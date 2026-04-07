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
import gzip
import ipaddress
import json
import logging
import os
import socket
import subprocess
import xml.etree.ElementTree as ET
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
    "w3c": 0.07,
    "links": 0.07,
    "schema": 0.17,
    "meta": 0.17,
    "headings": 0.12,
    "alt_text": 0.12,
    "keywords": 0.06,      # was 0.08
    "ai_bots": 0.10,
    "robots": 0.02,        # was 0.04
    "sitemap": 0.04,       # was 0.06
    "legal_pages": 0.06,   # NEW: trust-signal pages for AI crawlers
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

LEGAL_PAGE_PATTERNS: dict[str, dict] = {
    "privacyPolicy": {
        "name": "Privacy Policy",
        "url_patterns": [
            "/privacy", "/privacy-policy", "/privacy-notice",
            "/politique-de-confidentialite", "/politique-confidentialite",
            "/confidentialite",
        ],
        "link_text": ["privacy", "confidentialit"],
        "link_href": ["privacy", "confidentialit"],
    },
    "termsOfService": {
        "name": "Terms of Service",
        "url_patterns": [
            "/terms", "/terms-of-service", "/terms-and-conditions", "/tos",
            "/cgu", "/conditions-generales", "/conditions-generales-utilisation",
            "/conditions-utilisation", "/cgv",
        ],
        "link_text": ["terms", "conditions", "cgu", "cgv"],
        "link_href": ["terms", "conditions", "cgu", "cgv"],
    },
    "mentionsLegales": {
        "name": "Mentions légales",
        "url_patterns": [
            "/mentions-legales", "/mentions-légales", "/legal",
            "/informations-legales", "/legal-notice",
        ],
        "link_text": ["mentions légales", "mentions legales", "legal notice", "legal"],
        "link_href": ["mentions-legales", "mentions-légales", "/legal"],
    },
    "cookiePolicy": {
        "name": "Cookie Policy",
        "url_patterns": [
            "/cookies", "/cookie-policy", "/politique-cookies",
            "/politique-de-cookies", "/cookie-notice",
        ],
        "link_text": ["cookie"],
        "link_href": ["cookie"],
    },
}


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
        from utils.stopwords import get_stopwords

        soup = BeautifulSoup(html, "lxml")

        # Remove script, style, nav, footer
        for tag in soup.find_all(["script", "style", "nav", "footer", "header"]):
            tag.decompose()

        # Prefer <main> or <article> content to avoid boilerplate noise
        content_root = soup.find("main") or soup.find("article") or soup
        text = content_root.get_text(separator=" ", strip=True)
        if not text or len(text) < 50:
            return []

        stop_words = get_stopwords(language)

        # Tokenize: lowercase, alpha-only tokens of 2+ chars
        tokens = _re.findall(r"\b[a-zà-ÿ]{2,}\b", text.lower())
        tokens = [t for t in tokens if t not in stop_words]

        if not tokens:
            return []

        # Count frequencies and normalize
        counts = Counter(tokens)
        max_freq = counts.most_common(1)[0][1]

        keywords = sorted(
            [{"word": term, "count": freq, "score": round(freq / max_freq, 4)} for term, freq in counts.most_common(30)],
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
# Sitemap.xml Analysis
# ---------------------------------------------------------------------------

SITEMAP_NS = "http://www.sitemaps.org/schemas/sitemap/0.9"
VALID_CHANGEFREQ = {"always", "hourly", "daily", "weekly", "monthly", "yearly", "never"}
SITEMAP_MAX_URLS = 50_000
SITEMAP_MAX_BYTES = 50 * 1024 * 1024  # 50 MB uncompressed


async def analyze_sitemap(url: str, robots_sitemaps: list[str] | None = None) -> dict:
    """Fetch, parse, and validate sitemap.xml files.

    Discovery order:
    1. URLs declared in robots.txt (passed via robots_sitemaps)
    2. Fallback to {origin}/sitemap.xml
    """
    parsed = urlparse(url)
    origin = f"{parsed.scheme}://{parsed.netloc}"

    default_result = {
        "exists": False,
        "sitemapUrls": [],
        "urlCount": 0,
        "isSitemapIndex": False,
        "childSitemapsCount": 0,
        "sizeBytes": 0,
        "hasValidNamespace": False,
        "validationIssues": [],
        "urlSample": [],
        "hasLastmod": 0,
        "hasPriority": 0,
        "hasChangefreq": 0,
        "duplicateUrls": 0,
        "invalidUrls": [],
    }

    sitemap_urls = list(robots_sitemaps) if robots_sitemaps else []
    if not sitemap_urls:
        sitemap_urls = [f"{origin}/sitemap.xml"]

    try:
        async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
            # Try each sitemap URL until one works
            raw_body: bytes | None = None
            working_url: str | None = None

            for sm_url in sitemap_urls:
                try:
                    resp = await client.get(sm_url)
                    if resp.status_code >= 400:
                        continue
                    # Detect framework catch-all pages returning HTML instead of real sitemap
                    content_type = resp.headers.get("content-type", "")
                    body_start = resp.content[:200].strip().lower()
                    if (
                        "text/html" in content_type
                        or body_start.startswith((b"<!doctype", b"<html"))
                    ):
                        continue
                    raw_body = resp.content
                    working_url = sm_url
                    break
                except Exception:
                    continue

            if raw_body is None or working_url is None:
                return {**default_result, "sitemapUrls": sitemap_urls}

            # Handle gzip
            if working_url.endswith(".gz"):
                try:
                    raw_body = gzip.decompress(raw_body)
                except Exception:
                    pass  # try parsing as-is

            size_bytes = len(raw_body)
            issues: list[str] = []

            if size_bytes > SITEMAP_MAX_BYTES:
                issues.append(f"Sitemap exceeds 50 MB limit ({size_bytes:,} bytes)")

            # Parse XML
            try:
                root = ET.fromstring(raw_body)
            except ET.ParseError as e:
                return {
                    **default_result,
                    "exists": True,
                    "sitemapUrls": [working_url],
                    "sizeBytes": size_bytes,
                    "validationIssues": [f"Malformed XML: {e}"],
                }

            # Strip namespace for easier tag matching
            tag_local = root.tag.split("}")[-1] if "}" in root.tag else root.tag
            ns = root.tag.replace(tag_local, "").strip("{}") if "}" in root.tag else ""

            has_valid_ns = ns == SITEMAP_NS
            if not has_valid_ns and ns:
                issues.append(f"Non-standard namespace: {ns}")

            is_index = tag_local == "sitemapindex"
            ns_prefix = f"{{{ns}}}" if ns else ""

            # --- Sitemap Index ---
            if is_index:
                child_sitemaps = root.findall(f"{ns_prefix}sitemap")
                child_locs = []
                for child in child_sitemaps:
                    loc_el = child.find(f"{ns_prefix}loc")
                    if loc_el is not None and loc_el.text:
                        child_locs.append(loc_el.text.strip())

                # Fetch and validate first child sitemap for deeper analysis
                child_result = {
                    "urlCount": 0, "urlSample": [], "hasLastmod": 0,
                    "hasPriority": 0, "hasChangefreq": 0,
                    "duplicateUrls": 0, "invalidUrls": [],
                }
                if child_locs:
                    try:
                        child_resp = await client.get(child_locs[0])
                        if child_resp.status_code < 400:
                            child_body = child_resp.content
                            if child_locs[0].endswith(".gz"):
                                try:
                                    child_body = gzip.decompress(child_body)
                                except Exception:
                                    pass
                            child_result = _parse_urlset(child_body, ns_prefix)
                    except Exception:
                        pass

                return {
                    "exists": True,
                    "sitemapUrls": [working_url],
                    "urlCount": child_result["urlCount"],
                    "isSitemapIndex": True,
                    "childSitemapsCount": len(child_locs),
                    "sizeBytes": size_bytes,
                    "hasValidNamespace": has_valid_ns,
                    "validationIssues": issues + child_result.get("_issues", []),
                    "urlSample": child_result["urlSample"],
                    "hasLastmod": child_result["hasLastmod"],
                    "hasPriority": child_result["hasPriority"],
                    "hasChangefreq": child_result["hasChangefreq"],
                    "duplicateUrls": child_result["duplicateUrls"],
                    "invalidUrls": child_result["invalidUrls"],
                }

            # --- Regular urlset ---
            if tag_local != "urlset":
                issues.append(f"Unexpected root element: <{tag_local}>")

            urlset_result = _parse_urlset(raw_body, ns_prefix)
            issues.extend(urlset_result.get("_issues", []))

            return {
                "exists": True,
                "sitemapUrls": [working_url],
                "urlCount": urlset_result["urlCount"],
                "isSitemapIndex": False,
                "childSitemapsCount": 0,
                "sizeBytes": size_bytes,
                "hasValidNamespace": has_valid_ns,
                "validationIssues": issues,
                "urlSample": urlset_result["urlSample"],
                "hasLastmod": urlset_result["hasLastmod"],
                "hasPriority": urlset_result["hasPriority"],
                "hasChangefreq": urlset_result["hasChangefreq"],
                "duplicateUrls": urlset_result["duplicateUrls"],
                "invalidUrls": urlset_result["invalidUrls"],
            }

    except Exception as e:
        logger.error(f"Sitemap analysis error: {e}")
        return {**default_result, "error": str(e), "sitemapUrls": sitemap_urls}


def _parse_urlset(xml_bytes: bytes, ns_prefix: str) -> dict:
    """Parse a <urlset> sitemap and validate its <url> entries."""
    issues: list[str] = []
    try:
        root = ET.fromstring(xml_bytes)
    except ET.ParseError:
        return {
            "urlCount": 0, "urlSample": [], "hasLastmod": 0,
            "hasPriority": 0, "hasChangefreq": 0,
            "duplicateUrls": 0, "invalidUrls": [], "_issues": ["Malformed child sitemap XML"],
        }

    # Re-detect namespace from this document if needed
    tag_local = root.tag.split("}")[-1] if "}" in root.tag else root.tag
    ns = root.tag.replace(tag_local, "").strip("{}") if "}" in root.tag else ""
    ns_prefix = f"{{{ns}}}" if ns else ""

    url_elements = root.findall(f"{ns_prefix}url")
    url_count = len(url_elements)

    if url_count > SITEMAP_MAX_URLS:
        issues.append(f"URL count ({url_count:,}) exceeds 50,000 limit")

    seen_locs: set[str] = set()
    url_sample: list[str] = []
    has_lastmod = 0
    has_priority = 0
    has_changefreq = 0
    duplicate_count = 0
    invalid_urls: list[str] = []

    for url_el in url_elements:
        loc_el = url_el.find(f"{ns_prefix}loc")
        loc_text = loc_el.text.strip() if loc_el is not None and loc_el.text else ""

        # Validate loc
        if not loc_text:
            if len(invalid_urls) < 5:
                invalid_urls.append("(empty <loc>)")
            continue

        if not loc_text.startswith(("http://", "https://")):
            if len(invalid_urls) < 5:
                invalid_urls.append(loc_text[:100])

        # Duplicates
        if loc_text in seen_locs:
            duplicate_count += 1
        else:
            seen_locs.add(loc_text)

        # Sample
        if len(url_sample) < 5:
            url_sample.append(loc_text)

        # lastmod
        lastmod_el = url_el.find(f"{ns_prefix}lastmod")
        if lastmod_el is not None and lastmod_el.text:
            has_lastmod += 1

        # priority
        priority_el = url_el.find(f"{ns_prefix}priority")
        if priority_el is not None and priority_el.text:
            has_priority += 1
            try:
                pval = float(priority_el.text.strip())
                if not (0.0 <= pval <= 1.0):
                    issues.append(f"Invalid priority value: {priority_el.text.strip()}")
            except ValueError:
                issues.append(f"Non-numeric priority: {priority_el.text.strip()}")

        # changefreq
        changefreq_el = url_el.find(f"{ns_prefix}changefreq")
        if changefreq_el is not None and changefreq_el.text:
            has_changefreq += 1
            if changefreq_el.text.strip().lower() not in VALID_CHANGEFREQ:
                issues.append(f"Invalid changefreq: {changefreq_el.text.strip()}")

    if duplicate_count:
        issues.append(f"{duplicate_count} duplicate URL(s) found")

    return {
        "urlCount": url_count,
        "urlSample": url_sample,
        "hasLastmod": has_lastmod,
        "hasPriority": has_priority,
        "hasChangefreq": has_changefreq,
        "duplicateUrls": duplicate_count,
        "invalidUrls": invalid_urls[:5],
        "_issues": issues,
    }


# ---------------------------------------------------------------------------
# Legal Pages Detection
# ---------------------------------------------------------------------------

# Soft-404 indicators in page title / body (both FR and EN)
_SOFT_404_TITLE_PATTERNS = [
    "404", "not found", "page not found", "introuvable",
    "page introuvable", "cette page n'existe pas", "error",
]


async def _get_soft_404_fingerprint(
    client: httpx.AsyncClient, origin: str
) -> dict | None:
    """GET a guaranteed-nonexistent URL to detect frameworks with catch-all routing.

    Returns a fingerprint dict if the site returns 200 for missing pages, else None.
    """
    canary = f"{origin}/syb-canary-nonexistent-page-xyz123"
    try:
        resp = await client.get(canary)
        if resp.status_code != 200:
            return None  # site returns real 4xx for missing pages — no issue
        # The site returns 200 for missing pages — capture fingerprint
        return {
            "content_length": len(resp.content),
            "title": _extract_title(resp.text),
        }
    except Exception:
        return None


def _extract_title(html: str) -> str:
    """Extract <title> text from HTML string (lowercased)."""
    soup = BeautifulSoup(html, "lxml")
    tag = soup.find("title")
    return tag.get_text(strip=True).lower() if tag else ""


def _is_soft_404(resp: httpx.Response, fingerprint: dict) -> bool:
    """Return True if this response looks like a framework catch-all 404 page."""
    # Check title for known 404 phrases
    title = _extract_title(resp.text)
    if any(pat in title for pat in _SOFT_404_TITLE_PATTERNS):
        return True
    # Compare body length: if within 5% of canary, it's likely the same catch-all page
    fp_len = fingerprint["content_length"]
    resp_len = len(resp.content)
    if fp_len > 0 and abs(resp_len - fp_len) / fp_len < 0.05:
        return True
    return False


async def check_legal_pages(html: str, base_url: str, language: str = "fr") -> dict:
    """Detect legal pages (privacy, terms, mentions légales, cookies).

    Phase 1: footer link discovery (uses already-fetched HTML, no HTTP).
    Phase 2: soft-404 fingerprinting to detect catch-all frameworks.
    Phase 3: GET-request probing of common URL patterns with soft-404 filtering.
    """
    import re as _re

    parsed = urlparse(base_url)
    origin = f"{parsed.scheme}://{parsed.netloc}"

    # mentionsLegales is a French-specific legal requirement — skip for non-French sites
    active_patterns = {
        k: v for k, v in LEGAL_PAGE_PATTERNS.items()
        if k != "mentionsLegales" or language == "fr"
    }

    # --- Phase 1: footer link discovery ---
    soup = BeautifulSoup(html, "lxml")
    footer_el = (
        soup.find("footer")
        or soup.find(attrs={"id": _re.compile(r"footer", _re.I)})
        or soup.find(attrs={"class": _re.compile(r"footer", _re.I)})
        or soup  # fallback: search whole page
    )
    footer_links = footer_el.find_all("a", href=True)

    found: dict[str, tuple[str | None, str | None]] = {k: (None, None) for k in active_patterns}

    for page_key, patterns in active_patterns.items():
        for link in footer_links:
            href = link.get("href", "").lower()
            text = link.get_text(strip=True).lower()
            if (
                any(pat in href for pat in patterns["link_href"])
                or any(pat in text for pat in patterns["link_text"])
            ):
                found[page_key] = (urljoin(base_url, link["href"]), "footer_link")
                break

    # --- Phase 2 + 3: URL probing for missing pages ---
    missing = [k for k, (url, _) in found.items() if url is None]
    if missing:
        async with httpx.AsyncClient(timeout=8.0, follow_redirects=True) as client:
            # Phase 2: fingerprint the site's 404 behavior
            soft_404_fingerprint = await _get_soft_404_fingerprint(client, origin)

            # Phase 3: probe URL patterns
            for page_key in missing:
                for url_pat in active_patterns[page_key]["url_patterns"]:
                    probe = f"{origin}{url_pat}"
                    try:
                        _validate_url(probe)
                        resp = await client.get(probe)
                        if resp.status_code >= 400:
                            continue
                        # Soft-404 check: reject if it looks like a catch-all page
                        if soft_404_fingerprint and _is_soft_404(resp, soft_404_fingerprint):
                            continue
                        found[page_key] = (str(resp.url), "url_probe")
                        break
                    except Exception:
                        continue

    # --- Build result ---
    pages_found = 0
    issues: list[str] = []
    result: dict = {}

    for page_key, patterns in active_patterns.items():
        url, via = found[page_key]
        if url:
            pages_found += 1
            result[page_key] = {"found": True, "url": url, "detectedVia": via}
        else:
            result[page_key] = {"found": False, "url": None, "detectedVia": None}
            issues.append(f"{patterns['name']} page not found")

    total = len(active_patterns)
    return {
        **result,
        "pagesFound": pages_found,
        "totalPages": total,
        "issues": issues,
        "score": round(pages_found / total * 100, 1),
    }


# ---------------------------------------------------------------------------
# llms.txt Analysis
# ---------------------------------------------------------------------------


async def analyze_llms_txt(url: str) -> dict:
    """Fetch and analyze llms.txt for AI LLM context directives.

    llms.txt is an emerging standard (https://llmstxt.org/) that provides
    structured Markdown context for Large Language Models about a website.

    False-positive protection: rejects HTML catch-all pages returned by
    frameworks that respond 200 to every path.
    """
    import re as _re

    parsed = urlparse(url)
    origin = f"{parsed.scheme}://{parsed.netloc}"
    llms_url = f"{origin}/llms.txt"
    llms_full_url = f"{origin}/llms-full.txt"

    default_missing = {
        "exists": False,
        "hasFullVersion": False,
        "title": None,
        "description": None,
        "sections": [],
        "linkCount": 0,
        "contentPreview": None,
        "issues": ["No llms.txt found"],
    }

    try:
        async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
            resp = await client.get(llms_url, headers={"User-Agent": USER_AGENT})

            if resp.status_code >= 400:
                return default_missing

            # Detect framework catch-all pages returning HTML instead of real llms.txt
            content_type = resp.headers.get("content-type", "")
            body_stripped = resp.text.strip()
            if "text/html" in content_type or body_stripped.lower().startswith(("<!doctype", "<html")):
                return {
                    **default_missing,
                    "issues": ["No llms.txt found (server returned HTML fallback page)"],
                }

            if len(body_stripped) < 10:
                return {
                    **default_missing,
                    "exists": True,
                    "issues": ["llms.txt exists but is empty"],
                }

            content = resp.text

            # Check for llms-full.txt (the extended version of the spec)
            has_full = False
            try:
                full_resp = await client.head(llms_full_url, headers={"User-Agent": USER_AGENT})
                if full_resp.status_code < 400:
                    full_ct = full_resp.headers.get("content-type", "")
                    if "text/html" not in full_ct:
                        has_full = True
            except Exception:
                pass

            # Parse Markdown structure
            title: str | None = None
            description: str | None = None
            sections: list[str] = []
            link_count = 0

            for line in content.splitlines():
                stripped = line.strip()
                if stripped.startswith("# ") and title is None:
                    title = stripped[2:].strip()
                elif stripped.startswith("> ") and description is None:
                    description = stripped[2:].strip()
                elif stripped.startswith("## "):
                    sections.append(stripped[3:].strip())
                # Count Markdown links: [text](https://...)
                link_count += len(_re.findall(r"\[.+?\]\(https?://.+?\)", stripped))

            # Quality issues
            issues: list[str] = []
            if not title:
                issues.append("llms.txt missing title (H1 heading)")
            if not description:
                issues.append("llms.txt missing description (blockquote)")
            if not sections:
                issues.append("llms.txt has no sections (H2 headings)")
            if link_count == 0:
                issues.append("llms.txt contains no links to key pages")

            return {
                "exists": True,
                "hasFullVersion": has_full,
                "title": title,
                "description": description,
                "sections": sections,
                "linkCount": link_count,
                "contentPreview": content[:500].strip(),
                "issues": issues,
            }

    except Exception as e:
        logger.error(f"llms.txt analysis error: {e}")
        return {"error": str(e), "exists": False}


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

    # Sitemap (6%) — existence, valid XML, URL count, clean validation
    sitemap = scan_data.get("sitemapAnalysis", {})
    if not completeness.get("sitemap", True):
        pass  # skip — tool unavailable
    else:
        sitemap_score = 0.0
        if sitemap.get("exists"):
            sitemap_score += 30.0
            if sitemap.get("hasValidNamespace"):
                sitemap_score += 20.0
            url_count = sitemap.get("urlCount", 0)
            if url_count > 0:
                sitemap_score += 20.0
                if 10 <= url_count <= SITEMAP_MAX_URLS:
                    sitemap_score += 10.0
            sitemap_issues = sitemap.get("validationIssues", [])
            if len(sitemap_issues) == 0:
                sitemap_score += 20.0
            elif len(sitemap_issues) <= 2:
                sitemap_score += 10.0
        scores["sitemap"] = sitemap_score

    # Legal Pages (6%) — presence of privacy, terms, mentions légales, cookie policy
    legal_pages = scan_data.get("legalPages", {})
    if not completeness.get("legal_pages", True):
        pass  # skip — check failed
    else:
        scores["legal_pages"] = legal_pages.get("score", 0.0)

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
        legal_pages_result,
        llms_txt_result,
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
        check_legal_pages(html, url, language),
        analyze_llms_txt(url),
    )

    # Sitemap analysis (depends on robots.txt results for sitemap URLs)
    robots_sitemaps = robots_result.get("sitemaps", []) if isinstance(robots_result, dict) else []
    sitemap_result = await analyze_sitemap(url, robots_sitemaps=robots_sitemaps)

    # Track which tools ran successfully vs errored
    tool_results = {
        "w3c": ("W3C", w3c_result),
        "links": ("Links", link_result),
        "schema": ("Schema", schema_result),
        "ai_bots": ("AI Bot Access", ai_bots_result),
        "robots": ("robots.txt", robots_result),
        "sitemap": ("Sitemap", sitemap_result),
        "legal_pages": ("Legal Pages", legal_pages_result),
        "llms_txt": ("llms.txt", llms_txt_result),
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
        "sitemapAnalysis": sitemap_result,
        "legalPages": legal_pages_result,
        "llmsTxtAnalysis": llms_txt_result,
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
        sitemapAnalysis=primary_data.get("sitemapAnalysis"),
        legalPages=primary_data.get("legalPages"),
        llmsTxtAnalysis=primary_data.get("llmsTxtAnalysis"),
        htmlScannerScore=final_score,
        scanCompleteness=primary_data.get("scanCompleteness", {}),
        scanErrors=scan_errors,
        hasBlockedUrls=has_blocked_urls,
        subPagesScanned=sub_pages_data if sub_pages_data else None,
    )
