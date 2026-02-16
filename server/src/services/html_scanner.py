"""
HTML Scanner — Comprehensive website HTML analysis.

Analyzes website for technical SEO health using:
- Headless Chromium rendering (Selenium) for full JS-rendered HTML
- W3C validation (vnu.jar via subprocess)
- Link checking (Lychee via subprocess)
- Schema.org extraction (extruct)
- Meta tag analysis (BeautifulSoup)
- Heading structure analysis (BeautifulSoup)
- Image alt text audit (BeautifulSoup)
- Keyword extraction (TF-IDF via scikit-learn)

Produces an HTML Scanner Score (0-100).
"""

import asyncio
import ipaddress
import json
import logging
import os
import socket
import subprocess
from collections import Counter
from urllib.parse import urljoin, urlparse
from urllib.robotparser import RobotFileParser

import httpx
from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.chrome.options import Options as ChromeOptions
from selenium.webdriver.chrome.service import Service as ChromeService
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, WebDriverException

from models.audit import HtmlScanResult

logger = logging.getLogger(__name__)

USER_AGENT = "ShowYourBrand-Bot/1.0 (+https://ShowYourBrand.com)"
FETCH_TIMEOUT = 30
RENDER_WAIT = 10  # seconds to wait for JS rendering after page load
VNU_JAR_PATH = "/app/vnu.jar"
LYCHEE_PATH = "/usr/local/bin/lychee"
CHROME_BIN = os.getenv("CHROME_BIN", "/usr/bin/chromium")
CHROMEDRIVER_PATH = os.getenv("CHROMEDRIVER_PATH", "/usr/bin/chromedriver")

# SSRF protection: allowed schemes and blocked IP ranges
ALLOWED_SCHEMES = {"http", "https"}


def _validate_url(url: str) -> str:
    """Validate URL to prevent SSRF attacks. Returns the first safe resolved IP.

    Raises ValueError for unsafe URLs (private IPs, bad scheme, etc.).
    """
    parsed = urlparse(url)

    # Scheme check
    if parsed.scheme not in ALLOWED_SCHEMES:
        raise ValueError(f"URL scheme '{parsed.scheme}' is not allowed")

    hostname = parsed.hostname
    if not hostname:
        raise ValueError("URL has no hostname")

    # Resolve hostname and check ALL IPs are safe
    try:
        addr_info = socket.getaddrinfo(hostname, None, socket.AF_UNSPEC, socket.SOCK_STREAM)
    except socket.gaierror:
        raise ValueError(f"Cannot resolve hostname: {hostname}")

    safe_ip = None
    for _family, _, _, _, sockaddr in addr_info:
        ip = ipaddress.ip_address(sockaddr[0])
        if ip.is_private or ip.is_loopback or ip.is_reserved or ip.is_link_local:
            raise ValueError("URL resolves to a private/reserved IP address")
        if safe_ip is None:
            safe_ip = str(ip)

    if safe_ip is None:
        raise ValueError(f"Cannot resolve hostname: {hostname}")

    return safe_ip

# Score weights (total = 100%)
WEIGHTS = {
    "w3c": 0.08,
    "links": 0.08,
    "schema": 0.18,
    "meta": 0.18,
    "headings": 0.13,
    "alt_text": 0.13,
    "keywords": 0.08,
    "ai_bots": 0.10,
    "robots": 0.04,
}

# AI bot user agents for accessibility checks
AI_BOT_USER_AGENTS = [
    ("GPTBot", "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; GPTBot/1.1; +https://openai.com/gptbot)"),
    ("ChatGPT-User", "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; ChatGPT-User/1.0; +https://openai.com/bot)"),
    ("OAI-SearchBot", "OAI-SearchBot/1.0"),
    ("ClaudeBot", "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; ClaudeBot/1.0; +claudebot@anthropic.com)"),
    ("PerplexityBot", "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; PerplexityBot/1.0; +https://perplexity.ai/perplexitybot)"),
    ("Google-Extended", "Google-Extended"),
    ("Bingbot", "Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)"),
    ("meta-externalagent", "meta-externalagent/1.1"),
    ("Applebot-Extended", "Applebot-Extended"),
]


# ---------------------------------------------------------------------------
# Headless Chromium rendering (Selenium)
# ---------------------------------------------------------------------------


def _create_chrome_driver() -> webdriver.Chrome:
    """Create a headless Chromium WebDriver instance."""
    options = ChromeOptions()
    options.binary_location = CHROME_BIN
    options.add_argument("--headless=new")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--disable-gpu")
    options.add_argument("--disable-extensions")
    options.add_argument("--disable-background-networking")
    options.add_argument("--disable-default-apps")
    options.add_argument("--disable-sync")
    options.add_argument("--disable-translate")
    options.add_argument(f"--user-agent={USER_AGENT}")
    options.add_argument("--window-size=1920,1080")

    service = ChromeService(executable_path=CHROMEDRIVER_PATH)
    return webdriver.Chrome(service=service, options=options)


def _fetch_page_sync(url: str) -> str:
    """Render a page with headless Chromium and return the fully-rendered HTML.

    Validates URL for SSRF safety before navigating, then waits for the
    page body to have meaningful content (handles SPAs).
    """
    _validate_url(url)

    driver = _create_chrome_driver()
    try:
        driver.set_page_load_timeout(FETCH_TIMEOUT)
        driver.get(url)

        # Wait for the body to have rendered content (covers SPAs)
        WebDriverWait(driver, RENDER_WAIT).until(
            lambda d: len(d.find_element("tag name", "body").text.strip()) > 50
        )

        return driver.page_source
    except TimeoutException:
        # Even if wait timed out, return whatever rendered so far
        logger.warning(f"Render wait timed out for {url}, using partial content")
        return driver.page_source
    finally:
        driver.quit()


async def fetch_page(url: str) -> str:
    """Fetch and render a page using headless Chromium.

    Runs Chromium in a thread pool to avoid blocking the event loop.
    SSRF protection: validates URL resolves to a public IP before navigating.
    """
    return await asyncio.to_thread(_fetch_page_sync, url)


# ---------------------------------------------------------------------------
# W3C Validation (vnu.jar)
# ---------------------------------------------------------------------------


def validate_html_w3c(html: str) -> dict:
    """Run W3C Nu Html Checker via subprocess."""
    try:
        result = subprocess.run(
            ["java", "-jar", VNU_JAR_PATH, "--format", "json", "-"],
            input=html,
            capture_output=True,
            text=True,
            timeout=30,
        )
        # vnu.jar outputs validation results on stderr in JSON format
        output = result.stderr or result.stdout
        if output:
            data = json.loads(output)
            messages = data.get("messages", [])
            errors = [m for m in messages if m.get("type") == "error"]
            warnings = [m for m in messages if m.get("type") in ("warning", "info")]
            return {
                "totalMessages": len(messages),
                "errors": len(errors),
                "warnings": len(warnings),
                "errorDetails": [m.get("message", "") for m in errors[:10]],
            }
        return {"totalMessages": 0, "errors": 0, "warnings": 0, "errorDetails": []}
    except FileNotFoundError:
        logger.warning("vnu.jar not found — skipping W3C validation")
        return {"error": "vnu.jar not available", "errors": 0, "warnings": 0}
    except subprocess.TimeoutExpired:
        return {"error": "W3C validation timed out", "errors": 0, "warnings": 0}
    except Exception as e:
        logger.error(f"W3C validation error: {e}")
        return {"error": str(e), "errors": 0, "warnings": 0}


# ---------------------------------------------------------------------------
# Link checking (Lychee)
# ---------------------------------------------------------------------------


def check_links_lychee(url: str) -> dict:
    """Run Lychee link checker via subprocess."""
    try:
        result = subprocess.run(
            [LYCHEE_PATH, "--format", "json", "--timeout", "10", url],
            capture_output=True,
            text=True,
            timeout=60,
        )
        if result.stdout:
            data = json.loads(result.stdout)
            total = data.get("total", 0)
            successful = data.get("successful", 0)
            failed = data.get("errors", 0)
            excluded = data.get("excludes", 0)
            timeouts = data.get("timeouts", 0)
            error_map = data.get("error_map", {})
            return {
                "total": total,
                "successful": successful,
                "failed": failed,
                "excluded": excluded,
                "timeouts": timeouts,
                "brokenLinks": error_map,
            }
        return {"total": 0, "successful": 0, "failed": 0, "excluded": 0}
    except FileNotFoundError:
        logger.warning("lychee not found — skipping link check")
        return {"error": "lychee not available", "total": 0, "successful": 0, "failed": 0}
    except subprocess.TimeoutExpired:
        return {"error": "Link check timed out", "total": 0, "successful": 0, "failed": 0}
    except Exception as e:
        logger.error(f"Link check error: {e}")
        return {"error": str(e), "total": 0, "successful": 0, "failed": 0}


# ---------------------------------------------------------------------------
# Schema.org extraction (extruct)
# ---------------------------------------------------------------------------


def _get_recommended_schema_types(business_type: str | None) -> set[str]:
    """Return contextual schema.org type recommendations based on business type."""
    # Baseline for all sites
    base = {"Organization", "WebSite", "BreadcrumbList"}

    if not business_type:
        return base

    bt = business_type.lower()

    # E-commerce / shops
    if any(kw in bt for kw in ("e-commerce", "ecommerce", "shop", "store", "retail", "marketplace")):
        return base | {"Product", "Offer"}

    # Local businesses (restaurants, cafes, salons, etc.)
    if any(kw in bt for kw in ("restaurant", "cafe", "salon", "local", "brick-and-mortar", "bakery", "bar", "hotel")):
        return base | {"LocalBusiness", "PostalAddress", "OpeningHoursSpecification"}

    # News / media
    if any(kw in bt for kw in ("news", "media", "journal", "press", "magazine", "blog")):
        return base | {"NewsMediaOrganization", "Article", "NewsArticle"}

    # SaaS / software
    if any(kw in bt for kw in ("saas", "software", "app", "platform", "tech")):
        return base | {"SoftwareApplication", "FAQPage"}

    # Professional services (lawyers, agencies, consultants)
    if any(kw in bt for kw in ("agency", "consultant", "lawyer", "service", "freelance")):
        return base | {"ProfessionalService", "FAQPage"}

    # Education
    if any(kw in bt for kw in ("education", "school", "university", "course", "training")):
        return base | {"EducationalOrganization", "Course"}

    # Healthcare
    if any(kw in bt for kw in ("health", "medical", "doctor", "clinic", "pharmacy")):
        return base | {"MedicalOrganization", "Physician"}

    return base


def extract_schema_org(html: str, base_url: str, business_type: str | None = None) -> dict:
    """Extract structured data using extruct."""
    try:
        import extruct

        data = extruct.extract(html, base_url=base_url, syntaxes=["json-ld", "microdata", "rdfa", "opengraph"])

        json_ld = data.get("json-ld", [])
        microdata = data.get("microdata", [])
        rdfa = data.get("rdfa", [])
        opengraph = data.get("opengraph", [])

        # Identify detected schema types
        detected_types = set()
        for item in json_ld:
            if "@type" in item:
                t = item["@type"]
                if isinstance(t, list):
                    detected_types.update(t)
                else:
                    detected_types.add(t)

        # Contextual recommendations based on business type
        recommended = _get_recommended_schema_types(business_type)
        missing = recommended - detected_types

        return {
            "jsonLd": len(json_ld),
            "microdata": len(microdata),
            "rdfa": len(rdfa),
            "opengraph": len(opengraph),
            "detectedTypes": list(detected_types),
            "recommendedTypes": list(recommended),
            "missingRecommended": list(missing),
            "totalStructuredData": len(json_ld) + len(microdata) + len(rdfa) + len(opengraph),
        }
    except Exception as e:
        logger.error(f"Schema.org extraction error: {e}")
        return {"error": str(e), "totalStructuredData": 0, "detectedTypes": [], "missingRecommended": []}


# ---------------------------------------------------------------------------
# Meta tags analysis
# ---------------------------------------------------------------------------


LANGUAGE_LOCALE_MAP = {
    "fr": "fr_FR",
    "en": "en_US",
    "es": "es_ES",
    "de": "de_DE",
    "it": "it_IT",
    "pt": "pt_BR",
    "nl": "nl_NL",
}


def analyze_meta_tags(html: str, language: str = "fr") -> dict:
    """Analyze meta tags using BeautifulSoup. Language-aware checks."""
    soup = BeautifulSoup(html, "lxml")
    result: dict = {"issues": []}

    # Title
    title_tag = soup.find("title")
    title = title_tag.get_text(strip=True) if title_tag else ""
    result["title"] = title
    if not title:
        result["issues"].append("Missing <title> tag")
    elif len(title) > 60:
        result["issues"].append(f"Title too long ({len(title)} chars, recommended max 60)")

    # Meta description
    desc_tag = soup.find("meta", attrs={"name": "description"})
    description = desc_tag.get("content", "") if desc_tag else ""
    result["description"] = description
    if not description:
        result["issues"].append("Missing meta description")
    elif len(description) > 160:
        result["issues"].append(f"Meta description too long ({len(description)} chars, recommended max 160)")

    # Canonical
    canonical = soup.find("link", attrs={"rel": "canonical"})
    result["canonical"] = canonical.get("href", "") if canonical else ""
    if not canonical:
        result["issues"].append("Missing canonical URL")

    # Robots
    robots_tag = soup.find("meta", attrs={"name": "robots"})
    result["robots"] = robots_tag.get("content", "") if robots_tag else ""

    # OpenGraph
    og_tags = {}
    for og in ["og:title", "og:description", "og:image", "og:type", "og:url"]:
        tag = soup.find("meta", attrs={"property": og})
        og_tags[og] = tag.get("content", "") if tag else ""
    result["openGraph"] = og_tags
    missing_og = [k for k, v in og_tags.items() if not v]
    if missing_og:
        result["issues"].append(f"Missing OpenGraph tags: {', '.join(missing_og)}")

    # Twitter Cards
    twitter_tags = {}
    for tc in ["twitter:card", "twitter:title", "twitter:description", "twitter:image"]:
        tag = soup.find("meta", attrs={"name": tc})
        twitter_tags[tc] = tag.get("content", "") if tag else ""
    result["twitterCards"] = twitter_tags
    missing_tc = [k for k, v in twitter_tags.items() if not v]
    if missing_tc:
        result["issues"].append(f"Missing Twitter Card tags: {', '.join(missing_tc)}")

    # Language-aware checks
    # html lang attribute
    html_tag = soup.find("html")
    html_lang = html_tag.get("lang", "") if html_tag else ""
    result["htmlLang"] = html_lang
    if not html_lang:
        result["issues"].append("Missing lang attribute on <html> tag")
    elif language and not html_lang.lower().startswith(language):
        result["issues"].append(
            f"<html lang=\"{html_lang}\"> does not match expected language \"{language}\""
        )

    # og:locale
    og_locale_tag = soup.find("meta", attrs={"property": "og:locale"})
    og_locale = og_locale_tag.get("content", "") if og_locale_tag else ""
    result["ogLocale"] = og_locale
    expected_locale = LANGUAGE_LOCALE_MAP.get(language, "")
    if not og_locale:
        result["issues"].append(
            f"Missing og:locale (recommended: {expected_locale})" if expected_locale
            else "Missing og:locale"
        )

    # content-language meta tag
    content_lang_tag = soup.find("meta", attrs={"http-equiv": "content-language"})
    content_lang = content_lang_tag.get("content", "") if content_lang_tag else ""
    result["contentLanguage"] = content_lang

    # Score: proportion of required tags present
    required_tags = (
        ["title", "description", "canonical", "htmlLang", "ogLocale"]
        + list(og_tags.keys())
        + list(twitter_tags.keys())
    )
    present_count = 0
    present_count += (1 if title else 0)
    present_count += (1 if description else 0)
    present_count += (1 if canonical else 0)
    present_count += (1 if html_lang else 0)
    present_count += (1 if og_locale else 0)
    present_count += sum(1 for v in og_tags.values() if v)
    present_count += sum(1 for v in twitter_tags.values() if v)
    result["completeness"] = round(present_count / len(required_tags) * 100, 1) if required_tags else 0

    return result


# ---------------------------------------------------------------------------
# Heading structure
# ---------------------------------------------------------------------------


def analyze_headings(html: str) -> dict:
    """Analyze H1-H6 heading structure."""
    soup = BeautifulSoup(html, "lxml")
    issues = []

    headings: dict[str, list[str]] = {}
    for level in range(1, 7):
        tag = f"h{level}"
        found = soup.find_all(tag)
        headings[tag] = [h.get_text(strip=True) for h in found]

    # Check: exactly 1 H1
    h1_count = len(headings.get("h1", []))
    if h1_count == 0:
        issues.append("Missing H1 tag")
    elif h1_count > 1:
        issues.append(f"Multiple H1 tags ({h1_count}) — should have exactly 1")

    # Check: no skipped levels
    levels_present = [i for i in range(1, 7) if headings.get(f"h{i}")]
    for i in range(len(levels_present) - 1):
        if levels_present[i + 1] - levels_present[i] > 1:
            issues.append(
                f"Skipped heading level: H{levels_present[i]} → H{levels_present[i + 1]}"
            )

    counts = {f"h{i}": len(headings.get(f"h{i}", [])) for i in range(1, 7)}
    total = sum(counts.values())

    return {
        "counts": counts,
        "total": total,
        "h1Content": headings.get("h1", []),
        "issues": issues,
    }


# ---------------------------------------------------------------------------
# Image alt text audit
# ---------------------------------------------------------------------------


def audit_images(html: str) -> dict:
    """Audit image alt text coverage."""
    soup = BeautifulSoup(html, "lxml")
    images = soup.find_all("img")
    issues = []

    total = len(images)
    with_alt = 0
    empty_alt = 0
    generic_alt = 0
    missing_alt = 0

    generic_terms = {"image", "photo", "picture", "img", "icon", "logo", "banner", "placeholder"}

    for img in images:
        alt = img.get("alt")
        src = img.get("src", "")

        if alt is None:
            missing_alt += 1
            issues.append(f"Missing alt: {src[:80]}")
        elif alt.strip() == "":
            empty_alt += 1
        elif alt.strip().lower() in generic_terms:
            generic_alt += 1
            issues.append(f"Generic alt '{alt}': {src[:80]}")
        else:
            with_alt += 1

    # Compliance: alt="" is valid per WCAG 2.1 for decorative images, so count it as compliant
    compliant = with_alt + empty_alt
    compliance = round(compliant / total * 100, 1) if total > 0 else None

    return {
        "total": total,
        "withAlt": with_alt,
        "emptyAlt": empty_alt,
        "genericAlt": generic_alt,
        "missingAlt": missing_alt,
        "compliance": compliance,
        "issues": issues[:10],  # Limit to 10 issues
    }


# ---------------------------------------------------------------------------
# Keyword extraction (TF-IDF)
# ---------------------------------------------------------------------------


def extract_keywords(html: str, language: str = "fr") -> list[dict]:
    """Extract top 30 keywords using term frequency on a single document.

    Uses simple normalized term frequency rather than TF-IDF, since IDF
    is meaningless on a single document.
    """
    try:
        import re as _re
        import nltk
        from nltk.corpus import stopwords as nltk_stopwords

        soup = BeautifulSoup(html, "lxml")

        # Remove script, style, nav, footer
        for tag in soup.find_all(["script", "style", "nav", "footer", "header"]):
            tag.decompose()

        # Prefer <main> or <article> content to avoid boilerplate noise
        content_root = soup.find("main") or soup.find("article") or soup
        text = content_root.get_text(separator=" ", strip=True)
        if not text or len(text) < 50:
            return []

        # Get stopwords
        try:
            stop_lang = "french" if language == "fr" else "english"
            stop_words = set(nltk_stopwords.words(stop_lang))
            other_lang = "english" if language == "fr" else "french"
            stop_words.update(nltk_stopwords.words(other_lang))
        except LookupError:
            stop_words = set()

        # Tokenize: lowercase, alpha-only tokens of 2+ chars
        tokens = _re.findall(r"\b[a-zà-ÿ]{2,}\b", text.lower())
        tokens = [t for t in tokens if t not in stop_words]

        if not tokens:
            return []

        # Count frequencies and normalize
        counts = Counter(tokens)
        max_freq = counts.most_common(1)[0][1]

        keywords = sorted(
            [{"term": term, "score": round(freq / max_freq, 4)} for term, freq in counts.most_common(30)],
            key=lambda x: x["score"],
            reverse=True,
        )

        return keywords[:30]

    except Exception as e:
        logger.error(f"Keyword extraction error: {e}")
        return []


# ---------------------------------------------------------------------------
# AI Bot Accessibility Check
# ---------------------------------------------------------------------------


async def check_ai_bot_accessibility(url: str) -> dict:
    """Check if major AI bots can access the URL via HEAD requests.

    Sends parallel HEAD requests with each AI bot's user agent to detect
    server-side bot blocking (403, 429, etc.).
    """
    try:
        _validate_url(url)
    except ValueError as e:
        return {"error": str(e)}

    async def _check_single_bot(client: httpx.AsyncClient, name: str, ua: str) -> dict:
        try:
            resp = await client.head(url, headers={"User-Agent": ua}, follow_redirects=True)
            return {"name": name, "status": resp.status_code, "accessible": resp.status_code < 400}
        except Exception as e:
            return {"name": name, "status": None, "accessible": False, "error": str(e)}

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            tasks = [_check_single_bot(client, name, ua) for name, ua in AI_BOT_USER_AGENTS]
            bot_results = await asyncio.gather(*tasks)

        accessible = sum(1 for r in bot_results if r["accessible"])
        blocked = len(bot_results) - accessible
        blocked_bots = [r["name"] for r in bot_results if not r["accessible"]]
        score = round(accessible / len(bot_results) * 100, 1) if bot_results else 0.0

        return {
            "totalBots": len(bot_results),
            "accessible": accessible,
            "blocked": blocked,
            "botResults": bot_results,
            "blockedBots": blocked_bots,
            "accessibilityScore": score,
        }
    except Exception as e:
        logger.error(f"AI bot accessibility check error: {e}")
        return {"error": str(e)}


# ---------------------------------------------------------------------------
# robots.txt Analysis
# ---------------------------------------------------------------------------


async def analyze_robots_txt(url: str) -> dict:
    """Fetch and parse robots.txt, checking AI bot directives.

    Uses urllib.robotparser for standards-compliant parsing and checks
    each AI bot's access permissions, crawl delays, and sitemap declarations.
    """
    parsed = urlparse(url)
    robots_url = f"{parsed.scheme}://{parsed.netloc}/robots.txt"

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(robots_url, follow_redirects=True)

        if resp.status_code == 404 or resp.status_code >= 400:
            return {
                "exists": False,
                "sitemaps": [],
                "blanketDisallow": False,
                "aiBotsBlocked": [],
                "aiBotsAllowed": [],
                "crawlDelays": {},
                "botDirectives": [],
                "issues": ["No robots.txt found"],
            }

        # Detect framework catch-all pages returning HTML instead of real robots.txt
        content_type = resp.headers.get("content-type", "")
        body_stripped = resp.text.strip().lower()
        if "text/html" in content_type or body_stripped.startswith(("<!doctype", "<html")):
            return {
                "exists": False,
                "sitemaps": [],
                "blanketDisallow": False,
                "aiBotsBlocked": [],
                "aiBotsAllowed": [],
                "crawlDelays": {},
                "botDirectives": [],
                "issues": ["No robots.txt found (server returned HTML fallback page)"],
            }

        robots_content = resp.text
        rp = RobotFileParser()
        rp.parse(robots_content.splitlines())

        # Check each AI bot
        root_url = f"{parsed.scheme}://{parsed.netloc}/"
        ai_blocked = []
        ai_allowed = []
        crawl_delays = {}
        bot_directives = []

        for bot_name, _ua in AI_BOT_USER_AGENTS:
            allowed = rp.can_fetch(bot_name, url)
            delay = rp.crawl_delay(bot_name)
            if allowed:
                ai_allowed.append(bot_name)
            else:
                ai_blocked.append(bot_name)
            if delay is not None:
                crawl_delays[bot_name] = delay
            bot_directives.append({
                "bot": bot_name,
                "allowed": allowed,
                "crawlDelay": delay,
            })

        # Blanket disallow check
        blanket_disallow = not rp.can_fetch("*", root_url)

        # Sitemaps
        sitemaps = rp.site_maps() or []

        # Issues
        issues = []
        if not sitemaps:
            issues.append("No sitemap declaration in robots.txt")
        if blanket_disallow:
            issues.append("Blanket Disallow: / for all bots")
        if ai_blocked:
            issues.append(f"AI bots explicitly blocked: {', '.join(ai_blocked)}")

        return {
            "exists": True,
            "sitemaps": sitemaps,
            "blanketDisallow": blanket_disallow,
            "aiBotsBlocked": ai_blocked,
            "aiBotsAllowed": ai_allowed,
            "crawlDelays": crawl_delays,
            "botDirectives": bot_directives,
            "issues": issues,
        }
    except Exception as e:
        logger.error(f"robots.txt analysis error: {e}")
        return {"error": str(e)}


# ---------------------------------------------------------------------------
# HTML Scanner Score calculation
# ---------------------------------------------------------------------------


def calculate_html_scanner_score(scan_data: dict) -> float:
    """
    Weighted scoring (0-100), re-normalized to exclude unavailable tools.

    Components and base weights:
    - W3C validation: 8% (fewer errors = higher score)
    - Link health: 8% (% of working links)
    - Schema.org: 18% (detected types / recommended types)
    - Meta tags: 18% (completeness)
    - Heading structure: 13% (proper H1, no skipped levels)
    - Image alt text: 13% (% with proper alt text)
    - Keyword richness: 8% (diversity and relevance)
    - AI bot accessibility: 10% (% of AI bots that can access the site)
    - robots.txt: 4% (exists, sitemap, no blanket disallow, no AI blocks)

    If a tool was unavailable (e.g. vnu.jar missing, lychee broken), its weight
    is redistributed proportionally across the tools that did run.
    """
    completeness = scan_data.get("scanCompleteness", {})
    scores = {}

    # W3C (10%) — fewer errors = higher score
    w3c = scan_data.get("w3cValidation", {})
    w3c_errors = w3c.get("errors", 0)
    if not completeness.get("w3c", True):
        pass  # skip — tool unavailable
    elif w3c_errors == 0:
        scores["w3c"] = 100.0
    elif w3c_errors <= 5:
        scores["w3c"] = 80.0
    elif w3c_errors <= 15:
        scores["w3c"] = 60.0
    elif w3c_errors <= 30:
        scores["w3c"] = 40.0
    else:
        scores["w3c"] = 20.0

    # Links (10%) — % of working links
    links = scan_data.get("linkCheck", {})
    total_links = links.get("total", 0)
    if not completeness.get("links", True):
        pass  # skip — tool unavailable
    elif total_links == 0:
        scores["links"] = 50.0
    else:
        successful = links.get("successful", 0)
        scores["links"] = round(successful / total_links * 100, 1)

    # Schema.org (20%) — detected types / recommended count
    schema = scan_data.get("schemaOrg", {})
    detected_types = set(schema.get("detectedTypes", []))
    recommended_types = set(schema.get("recommendedTypes", []))
    recommended_count = len(recommended_types) or 1
    matched_count = len(detected_types & recommended_types)
    if not completeness.get("schema", True):
        pass  # skip — tool unavailable
    else:
        scores["schema"] = min(round(matched_count / recommended_count * 100, 1), 100.0)

    # Meta tags (20%) — completeness percentage
    meta = scan_data.get("metaTags", {})
    scores["meta"] = meta.get("completeness", 0.0)

    # Headings (15%)
    headings = scan_data.get("headingStructure", {})
    heading_issues = headings.get("issues", [])
    heading_total = headings.get("total", 0)
    if heading_total == 0:
        scores["headings"] = 0.0
    elif len(heading_issues) == 0:
        scores["headings"] = 100.0
    elif len(heading_issues) == 1:
        scores["headings"] = 70.0
    else:
        scores["headings"] = max(40.0, 100.0 - len(heading_issues) * 15)

    # Alt text (15%) — compliance % (None means no images on page, skip from scoring)
    alt = scan_data.get("imageAltText", {})
    alt_compliance = alt.get("compliance")
    if alt_compliance is not None:
        scores["alt_text"] = alt_compliance

    # Keywords (8%) — presence of meaningful keywords
    keywords = scan_data.get("keywords", [])
    if len(keywords) >= 20:
        scores["keywords"] = 100.0
    elif len(keywords) >= 10:
        scores["keywords"] = 70.0
    elif len(keywords) >= 5:
        scores["keywords"] = 50.0
    elif len(keywords) > 0:
        scores["keywords"] = 30.0
    else:
        scores["keywords"] = 0.0

    # AI Bot Accessibility (10%) — percentage of bots that get HTTP 2xx
    ai_bots = scan_data.get("aiBotAccessibility", {})
    if not completeness.get("ai_bots", True):
        pass  # skip — tool unavailable
    else:
        scores["ai_bots"] = ai_bots.get("accessibilityScore", 0.0)

    # robots.txt (4%) — existence, sitemap, no blanket disallow, no AI blocks
    robots = scan_data.get("robotsTxtAnalysis", {})
    if not completeness.get("robots", True):
        pass  # skip — tool unavailable
    else:
        robots_score = 0.0
        if robots.get("exists"):
            robots_score += 40.0
            if robots.get("sitemaps"):
                robots_score += 20.0
            if not robots.get("blanketDisallow"):
                robots_score += 20.0
            if not robots.get("aiBotsBlocked"):
                robots_score += 20.0
        scores["robots"] = robots_score

    # Re-normalize weights: only include components that ran
    active_weights = {k: w for k, w in WEIGHTS.items() if k in scores}
    total_weight = sum(active_weights.values())
    if total_weight == 0:
        return 0.0

    total = sum(scores[k] * (w / total_weight) for k, w in active_weights.items())
    return round(total, 1)


# ---------------------------------------------------------------------------
# Main orchestrator
# ---------------------------------------------------------------------------


async def _scan_single_page(
    url: str, language: str, business_type: str | None = None
) -> tuple[dict, list[str]]:
    """Scan a single page and return (scan_data, errors)."""
    scan_errors: list[str] = []
    html = await fetch_page(url)

    # Run all analysis steps concurrently in thread pool
    (
        w3c_result,
        link_result,
        schema_result,
        meta_result,
        heading_result,
        alt_result,
        keyword_result,
        ai_bots_result,
        robots_result,
    ) = await asyncio.gather(
        asyncio.to_thread(validate_html_w3c, html),
        asyncio.to_thread(check_links_lychee, url),
        asyncio.to_thread(extract_schema_org, html, url, business_type),
        asyncio.to_thread(analyze_meta_tags, html, language),
        asyncio.to_thread(analyze_headings, html),
        asyncio.to_thread(audit_images, html),
        asyncio.to_thread(extract_keywords, html, language),
        check_ai_bot_accessibility(url),
        analyze_robots_txt(url),
    )

    # Track which tools ran successfully vs errored
    tool_results = {
        "w3c": ("W3C", w3c_result),
        "links": ("Links", link_result),
        "schema": ("Schema", schema_result),
        "ai_bots": ("AI Bot Access", ai_bots_result),
        "robots": ("robots.txt", robots_result),
    }
    completeness: dict[str, bool] = {}
    for key, (name, result) in tool_results.items():
        if isinstance(result, dict) and "error" in result:
            logger.warning(f"{name} tool error: {result['error']}")
            scan_errors.append(f"{name} analysis unavailable")
            completeness[key] = False
        else:
            completeness[key] = True

    # These BS4-based tools always succeed if we have HTML
    completeness["meta"] = True
    completeness["headings"] = True
    completeness["alt_text"] = True
    completeness["keywords"] = len(keyword_result) > 0 or True  # tool ran even if 0 keywords

    scan_data = {
        "w3cValidation": w3c_result,
        "linkCheck": link_result,
        "schemaOrg": schema_result,
        "metaTags": meta_result,
        "headingStructure": heading_result,
        "imageAltText": alt_result,
        "keywords": keyword_result,
        "aiBotAccessibility": ai_bots_result,
        "robotsTxtAnalysis": robots_result,
        "scanCompleteness": completeness,
    }
    return scan_data, scan_errors


async def scan_website(
    url: str, sub_urls: list[str], language: str = "fr", business_type: str | None = None,
) -> HtmlScanResult:
    """
    Orchestrator: fetch primary URL + sub-URLs, run all analyses, aggregate results.

    Sub-URLs are scanned independently and their scores are averaged with the
    primary page (primary gets 50% weight, sub-URLs share the other 50%).
    Fault-tolerant — if any individual page or analysis fails, continues with others.
    """
    scan_errors: list[str] = []
    has_blocked_urls = False

    # Fetch and scan primary page
    try:
        primary_data, primary_errors = await _scan_single_page(url, language, business_type)
        scan_errors.extend(primary_errors)
    except ValueError:
        # SSRF or validation rejection — flag as blocked
        logger.warning(f"Primary URL blocked by security validation: {url}")
        return HtmlScanResult(
            url=url,
            htmlScannerScore=0.0,
            scanErrors=["URL blocked by security policy"],
            hasBlockedUrls=True,
        )
    except Exception as e:
        logger.error(f"Failed to fetch {url}: {type(e).__name__}: {e}")
        return HtmlScanResult(
            url=url,
            htmlScannerScore=0.0,
            scanErrors=["Failed to scan URL"],
        )

    primary_score = calculate_html_scanner_score(primary_data)

    # Scan sub-URLs (if any)
    sub_scores: list[float] = []
    sub_pages_data: list[dict] = []
    for sub_url in (sub_urls or []):
        # Resolve relative sub-URLs against the primary URL
        resolved = sub_url if sub_url.startswith("http") else urljoin(url, sub_url)
        try:
            sub_data, sub_errors = await _scan_single_page(resolved, language, business_type)
            scan_errors.extend(f"[{resolved}] {err}" for err in sub_errors)
            sub_score = calculate_html_scanner_score(sub_data)
            sub_scores.append(sub_score)
            sub_pages_data.append({"url": resolved, "score": sub_score})
        except ValueError:
            # SSRF or validation rejection on sub-URL
            logger.warning(f"Sub-URL blocked by security validation: {resolved}")
            scan_errors.append("Sub-URL blocked by security policy")
            has_blocked_urls = True
        except Exception as e:
            logger.warning(f"Failed to scan sub-URL {resolved}: {type(e).__name__}: {e}")
            scan_errors.append("Failed to scan sub-URL")

    # Weighted average: primary=50%, sub-URLs share 50%
    if sub_scores:
        sub_avg = sum(sub_scores) / len(sub_scores)
        final_score = round(primary_score * 0.5 + sub_avg * 0.5, 1)
    else:
        final_score = primary_score

    return HtmlScanResult(
        url=url,
        w3cValidation=primary_data.get("w3cValidation"),
        linkCheck=primary_data.get("linkCheck"),
        schemaOrg=primary_data.get("schemaOrg"),
        metaTags=primary_data.get("metaTags"),
        headingStructure=primary_data.get("headingStructure"),
        imageAltText=primary_data.get("imageAltText"),
        keywords=primary_data.get("keywords"),
        aiBotAccessibility=primary_data.get("aiBotAccessibility"),
        robotsTxtAnalysis=primary_data.get("robotsTxtAnalysis"),
        htmlScannerScore=final_score,
        scanCompleteness=primary_data.get("scanCompleteness", {}),
        scanErrors=scan_errors,
        hasBlockedUrls=has_blocked_urls,
        subPagesScanned=sub_pages_data if sub_pages_data else None,
    )
