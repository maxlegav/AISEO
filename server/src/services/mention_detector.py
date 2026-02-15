"""
Mention Detector — Regex + fuzzy matching for business mention detection.

Detects whether a business is mentioned in an AI response,
calculates quality (0-3) and position (rank in recommendation list).
Uses rapidfuzz for fast fuzzy matching.
"""

import re
from urllib.parse import urlparse

from rapidfuzz import fuzz

from models.audit import EngineResult

# Fuzzy match threshold (0-100)
FUZZY_THRESHOLD = 85

# Minimum business name length for fuzzy matching (prevents false positives)
MIN_FUZZY_NAME_LENGTH = 4

# Patterns for detecting list structures in AI responses
LIST_PATTERNS = [
    r"^\s*(\d+)\.\s+",           # Numbered: "1. ", "2. "
    r"^\s*[-•*]\s+",             # Bullets: "- ", "• ", "* "
    r"^\s*\*\*\d+\.",            # Bold numbered: "**1."
    r"^\s*#{1,3}\s+\d+\.",      # Markdown headings with numbers
]


def generate_url_variants(url: str) -> list[str]:
    """
    Generate URL variants for matching.

    Input: "https://www.maisoncuir.fr"
    Output: ["maisoncuir.fr", "www.maisoncuir.fr", "https://maisoncuir.fr",
             "https://www.maisoncuir.fr", "maisoncuir"]
    """
    variants = []

    try:
        parsed = urlparse(url if "://" in url else f"https://{url}")
        hostname = parsed.hostname or ""
    except Exception:
        hostname = url

    # Remove www prefix for base domain
    base_domain = hostname.lstrip("www.").lower()

    if base_domain:
        variants.append(base_domain)  # "maisoncuir.fr"
        variants.append(f"www.{base_domain}")  # "www.maisoncuir.fr"
        variants.append(f"https://{base_domain}")  # "https://maisoncuir.fr"
        variants.append(f"https://www.{base_domain}")  # "https://www.maisoncuir.fr"
        variants.append(f"http://{base_domain}")  # "http://maisoncuir.fr"
        variants.append(f"http://www.{base_domain}")  # "http://www.maisoncuir.fr"

        # Domain without TLD (e.g., "maisoncuir")
        domain_no_tld = base_domain.split(".")[0]
        if domain_no_tld and domain_no_tld != base_domain:
            variants.append(domain_no_tld)

    return [v.lower() for v in variants if v]


def _split_into_segments(response: str) -> list[str]:
    """Split response into recommendation segments (list items or paragraphs)."""
    lines = response.split("\n")
    segments = []
    current_segment = ""

    for line in lines:
        stripped = line.strip()
        if not stripped:
            if current_segment:
                segments.append(current_segment)
                current_segment = ""
            continue

        # Check if line starts a new list item
        is_list_item = any(re.match(pat, stripped) for pat in LIST_PATTERNS)

        if is_list_item:
            if current_segment:
                segments.append(current_segment)
            current_segment = stripped
        else:
            if current_segment:
                current_segment += " " + stripped
            else:
                current_segment = stripped

    if current_segment:
        segments.append(current_segment)

    return segments


def _is_in_list_context(response: str) -> bool:
    """Check if the response contains a structured list of recommendations."""
    lines = response.split("\n")
    list_items = sum(
        1 for line in lines
        if any(re.match(pat, line.strip()) for pat in LIST_PATTERNS)
    )
    return list_items >= 2


def calculate_quality(response: str, business_name: str) -> int:
    """
    Calculate mention quality (0-3).

    0 = not mentioned
    1 = mentioned in passing (name appears once, or fuzzy-only match)
    2 = recommended among others (exact name in a numbered/bulleted list)
    3 = recommended first or response is focused on the business
    """
    response_lower = response.lower()
    name_lower = business_name.lower()

    # Count exact name occurrences
    count = response_lower.count(name_lower)
    is_exact = count > 0

    # Fuzzy-only matches are capped at quality 1 (weak signal)
    if not is_exact:
        return 1

    in_list = _is_in_list_context(response)

    if in_list:
        segments = _split_into_segments(response)
        for i, segment in enumerate(segments):
            if name_lower in segment.lower():
                if i == 0:
                    return 3  # First in list
                return 2  # In list but not first
        return 2  # In a list context

    # Not in a list structure
    # Check if response is focused on the business (name appears multiple times or response is short)
    if count >= 3 or (count >= 1 and len(response) < 500):
        return 3  # Response is focused on the business

    return 1  # Mentioned in passing


def calculate_position(response: str, business_name: str, business_url: str = "") -> int:
    """
    Calculate the position (rank) of the business in the response.

    Position 1 = first mentioned, 2 = second, etc.
    Returns 0 if not found in a rankable structure.
    """
    name_lower = business_name.lower()
    url_variants = generate_url_variants(business_url) if business_url else []

    segments = _split_into_segments(response)

    if len(segments) <= 1:
        # No clear list structure — if mentioned, position = 1
        return 1

    for rank, segment in enumerate(segments, start=1):
        segment_lower = segment.lower()

        # Check exact name match
        if name_lower in segment_lower:
            return rank

        # Check URL variants
        if any(variant in segment_lower for variant in url_variants):
            return rank

        # Check fuzzy match
        if fuzz.partial_ratio(name_lower, segment_lower) > FUZZY_THRESHOLD:
            return rank

    # Mentioned somewhere but not in identifiable segments
    return 1


def detect_mention(
    response: str,
    business_name: str,
    business_url: str,
) -> EngineResult:
    """
    Core mention detection: determines if a business is mentioned in an AI response.

    Returns EngineResult with mentioned, quality (0-3), position, and rawResponse.
    """
    if not response or not response.strip():
        return EngineResult(mentioned=False, quality=0, position=0, rawResponse=response or "")

    response_lower = response.lower()
    name_lower = business_name.lower()

    # 1. Exact name match (case-insensitive)
    name_match = name_lower in response_lower

    # 2. URL variant match
    url_variants = generate_url_variants(business_url)
    url_match = any(variant in response_lower for variant in url_variants)

    # 3. Fuzzy match on business name (skip for short names to avoid false positives)
    fuzzy_match = False
    if len(name_lower) >= MIN_FUZZY_NAME_LENGTH:
        fuzzy_score = fuzz.partial_ratio(name_lower, response_lower)
        fuzzy_match = fuzzy_score > FUZZY_THRESHOLD

    mentioned = name_match or url_match or fuzzy_match

    if not mentioned:
        return EngineResult(
            mentioned=False,
            quality=0,
            position=0,
            rawResponse=response,
        )

    quality = calculate_quality(response, business_name)
    position = calculate_position(response, business_name, business_url)

    return EngineResult(
        mentioned=True,
        quality=quality,
        position=position,
        rawResponse=response,
    )
