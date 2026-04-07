"""
Simulation audit runner using pre-provided answers.

Instead of calling claude CLI for each prompt, uses answer files from
simulation/results/*_answers.json (format: [{id, response}, ...]).

Generates ALL server-side features:
  - HTML scan (real HTTP)
  - Mention detection + scoring
  - Issue detection (deterministic)
  - Prompt gap extraction (deterministic)
  - llmsTxtContent (template-based)
  - llmHijackPrompt (HTML schema.org snippet)
  - Competitor scoring
  - GEO Score

Writes audits to MongoDB with status="completed" for the demo user.

Usage:
    cd server
    python simulation/run_audit_from_answers.py [ankorstore|creatify|maison_du_laser ...]
"""

import json
import logging
import os
import re
import sys
import time
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlparse
from textwrap import dedent

import requests
from bs4 import BeautifulSoup
from pymongo import MongoClient
from bson import ObjectId

# Allow imports from server/src/
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "src"))
from utils.stopwords import get_stopwords

# ─── Config ───────────────────────────────────────────────────────────────────

MONGODB_URI = "mongodb+srv://automateitcontact:q1ziUY6sTrKPUexf@automateit.ljmnevl.mongodb.net/ShowYourBrand"
USER_ID = ObjectId("69a02404732ae67ba8385b29")
PROMPTS_DIR = Path(__file__).parent / "prompts"
RESULTS_DIR = Path(__file__).parent / "results"

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler(Path(__file__).parent / "audit_run.log"),
    ],
)
logger = logging.getLogger(__name__)

# ─── Brand configs ────────────────────────────────────────────────────────────

BRANDS = [
    {
        "slug": "ankorstore",
        "businessName": "Ankorstore",
        "businessUrl": "https://fr.ankorstore.com/",
        "businessType": "marketplace B2B e-commerce",
        "category": "marketplace wholesale B2B pour retailers indépendants",
        "description": "Ankorstore est une marketplace B2B européenne qui connecte des marques indépendantes avec des retailers. Elle permet aux commerçants de commander en petites quantités auprès de plus de 30 000 marques avec des conditions avantageuses : paiement différé 60 jours, retours gratuits sur la première commande.",
        "language": "fr",
        "localityTier": "global",
        "country": "France",
        "competitorNames": ["Faire", "Orderchamp", "Mable", "RangeMe"],
        "competitorUrls": ["https://faire.com", "https://www.orderchamp.com", "https://mable.com", "https://www.rangeme.com"],
        "targetKeywords": ["marketplace wholesale", "fournisseur boutique indépendante", "commander en gros petites quantités"],
        "uniqueSellingPoints": ["Paiement différé 60 jours", "Retours gratuits première commande", "30 000+ marques européennes"],
        "targetAudience": "Gérants de boutiques indépendantes, concept stores, épiceries fines",
        "servicesOrProducts": ["Marketplace wholesale B2B", "Paiement différé 60 jours", "Livraison centralisée multi-marques"],
        "priceRange": "wholesale",
        "yearFounded": 2019,
        "subUrls": [],
    },
    {
        "slug": "creatify",
        "businessName": "Creatify",
        "businessUrl": "https://creatify.ai/",
        "businessType": "saas",
        "category": "AI-powered video ad creation platform",
        "description": "Creatify is an AI-powered video ad creation platform that lets marketers and e-commerce brands generate product video ads in minutes. Users input a product URL or images and the AI generates multiple video ad variations with AI avatars, voiceovers, and scripts.",
        "language": "en",
        "localityTier": "global",
        "competitorNames": ["AdCreative.ai", "Invideo AI", "HeyGen", "Waymark"],
        "competitorUrls": ["https://adcreative.ai", "https://invideo.io", "https://heygen.com", "https://waymark.com"],
        "targetKeywords": ["AI video ad creator", "automated video ads", "product video generator AI"],
        "uniqueSellingPoints": ["Generate video ads from product URL in 2 minutes", "AI avatars and voiceovers in 29 languages", "Built for Meta, TikTok, YouTube"],
        "targetAudience": "Performance marketers, DTC e-commerce brands, marketing agencies",
        "servicesOrProducts": ["AI video ad generation", "AI avatar spokesperson videos", "Bulk ad variation creation"],
        "priceRange": "mid",
        "yearFounded": 2023,
        "subUrls": [],
    },
    {
        "slug": "maison_du_laser",
        "businessName": "Maison du Laser",
        "businessUrl": "https://www.maisondulaser.fr/",
        "businessType": "centre médical épilation laser",
        "category": "épilation laser permanente et médecine esthétique",
        "description": "Maison du Laser est une chaîne de centres médicaux spécialisés dans l'épilation laser permanente et la médecine esthétique, avec 6 centres en France et à Bruxelles. Chaque traitement est suivi médicalement par des médecins certifiés. Consultation médicale gratuite, efficace sur tous les phototypes.",
        "language": "fr",
        "localityTier": "national",
        "city": "Paris",
        "region": "Île-de-France",
        "country": "France",
        "competitorNames": ["Lazeo", "Alfa Laser", "Epilium & Skin", "Dépil Tech"],
        "competitorUrls": ["https://www.lazeo.com", "https://alfa-laser.com", "https://www.epilium-paris.com", "https://www.depiltech.fr"],
        "targetKeywords": ["épilation laser Paris", "centre épilation laser médical", "épilation laser permanente"],
        "uniqueSellingPoints": ["Suivi médical par des médecins certifiés", "Consultation médicale gratuite", "Efficace sur tous les phototypes", "Tarifs accessibles"],
        "targetAudience": "Femmes et hommes cherchant une solution d'épilation définitive, toutes typologies de peau",
        "servicesOrProducts": ["Épilation laser permanente", "Épilation laser hommes", "Suppression de tatouage", "Médecine esthétique"],
        "certifications": ["Médecins certifiés"],
        "priceRange": "accessible",
        "yearFounded": 2010,
        "subUrls": [],
    },
]

# ─── Scoring weights ───────────────────────────────────────────────────────────

CATEGORY_WEIGHTS = {
    "discovery": 2.0,
    "comparison": 1.5,
    "reputation": 1.2,
    "product": 1.0,
    "alternative": 1.5,
    "trust": 1.0,
}

LEVEL_DESCRIPTIONS = {
    1: "Excellent — visible on broad queries (level 1)",
    2: "Good — visible in its niche (level 2)",
    3: "Medium — visible when characteristics are described (level 3)",
    4: "Weak — visible only with very specific hints (level 4)",
    5: "Minimal — visible only when cited by name (level 5)",
}

DISCOVERABILITY_THRESHOLD = 0.25
MAX_RESPONSE_SCORE = 4.5

# ─── HTML Scanner ──────────────────────────────────────────────────────────────

HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; ShowYourBrandBot/1.0; +https://showyourbrand.ai/bot)",
    "Accept": "text/html,application/xhtml+xml",
    "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
}


def _safe_get(url: str, timeout: int = 15) -> requests.Response | None:
    try:
        r = requests.get(url, headers=HEADERS, timeout=timeout, allow_redirects=True)
        return r if r.status_code < 400 else None
    except Exception:
        return None


def _mongo_safe(obj):
    if isinstance(obj, dict):
        return {k: _mongo_safe(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_mongo_safe(v) for v in obj]
    if isinstance(obj, (str, int, float, bool, type(None), ObjectId)):
        return obj
    return str(obj)


def run_html_scan(brand: dict) -> dict:
    base_url = brand["businessUrl"].rstrip("/")
    logger.info(f"  [HTML] Scanning {base_url} ...")
    start = time.time()
    errors = []
    completeness = {}

    resp = _safe_get(base_url)
    if not resp or resp.status_code >= 400:
        errors.append(f"Main page unreachable: {resp.status_code if resp else 'timeout'}")
        return _empty_html_scan(base_url, errors, time.time() - start)

    soup = BeautifulSoup(resp.text, "html.parser")
    completeness["main_page"] = True

    title_tag = soup.find("title")
    title = title_tag.get_text(strip=True) if title_tag else ""
    meta_desc_tag = soup.find("meta", attrs={"name": "description"})
    meta_desc = meta_desc_tag.get("content", "") if meta_desc_tag else ""
    og_title = (soup.find("meta", property="og:title") or {}).get("content", "")
    og_desc = (soup.find("meta", property="og:description") or {}).get("content", "")
    og_image = (soup.find("meta", property="og:image") or {}).get("content", "")
    meta_tags = {
        "title": title, "description": meta_desc,
        "og:title": og_title, "og:description": og_desc, "og:image": og_image,
        "hasTitleTag": bool(title), "hasMetaDescription": bool(meta_desc),
        "hasOpenGraph": bool(og_title or og_desc),
        "issues": ([] if (title and meta_desc) else
                   (["Missing <title>"] if not title else []) +
                   (["Missing meta description"] if not meta_desc else [])),
    }
    completeness["meta_tags"] = True

    h_tags = {}
    for level in range(1, 7):
        tags = soup.find_all(f"h{level}")
        h_tags[f"h{level}"] = [t.get_text(strip=True)[:100] for t in tags[:5]]
    heading_issues = []
    if len(h_tags.get("h1", [])) == 0:
        heading_issues.append("No H1 tag found")
    if len(h_tags.get("h1", [])) > 1:
        heading_issues.append("Multiple H1 tags")
    heading_structure = {
        "counts": {k: len(v) for k, v in h_tags.items()},
        "h1": h_tags.get("h1", []),
        "hasH1": len(h_tags.get("h1", [])) > 0,
        "multipleH1": len(h_tags.get("h1", [])) > 1,
        "issues": heading_issues,
    }
    completeness["headings"] = True

    imgs = soup.find_all("img")
    imgs_with_alt = sum(1 for img in imgs if img.get("alt", "").strip())
    coverage = round(imgs_with_alt / len(imgs) * 100, 1) if imgs else 100.0
    image_alt_text = {
        "total": len(imgs), "withAlt": imgs_with_alt,
        "withoutAlt": len(imgs) - imgs_with_alt,
        "coverageRate": round(imgs_with_alt / len(imgs), 2) if imgs else 1.0,
        "compliance": round(coverage, 1),
    }
    completeness["image_alt"] = True

    json_ld_tags = soup.find_all("script", type="application/ld+json")
    schema_org_data = []
    for tag in json_ld_tags:
        try:
            schema_org_data.append(json.loads(tag.string or "{}"))
        except Exception:
            pass
    detected_types = [d.get("@type", "") for d in schema_org_data if isinstance(d, dict)]
    schema_org = {
        "jsonLd": schema_org_data, "hasJsonLd": len(schema_org_data) > 0,
        "types": detected_types,
        "detectedTypes": detected_types,
        "missingRecommended": [],
    }
    completeness["schema_org"] = True

    robots_resp = _safe_get(f"{base_url}/robots.txt")
    robots_ok = robots_resp and robots_resp.status_code == 200
    robots_txt = {
        "exists": robots_ok,
        "content": (robots_resp.text[:500] if robots_ok else ""),
        "aiBotsBlocked": False, "blanketDisallow": False,
    }
    if robots_ok:
        content_lower = robots_resp.text.lower()
        ai_bots = ["gptbot", "claudebot", "perplexitybot"]
        blocked = [b for b in ai_bots if f"user-agent: {b}" in content_lower and "disallow: /" in content_lower]
        robots_txt["aiBotsBlocked"] = len(blocked) > 0
        robots_txt["blockedBots"] = blocked
        robots_txt["blanketDisallow"] = ("user-agent: *" in content_lower and "disallow: /" in content_lower)
    completeness["robots_txt"] = robots_ok

    sitemap_resp = _safe_get(f"{base_url}/sitemap.xml")
    sitemap_ok = sitemap_resp and sitemap_resp.status_code == 200
    sitemap = {"exists": sitemap_ok, "urlCount": sitemap_resp.text.count("<url>") if sitemap_ok else 0}
    completeness["sitemap"] = sitemap_ok

    llms_resp = _safe_get(f"{base_url}/llms.txt")
    llms_ok = llms_resp and llms_resp.status_code == 200
    llms_txt = {"exists": llms_ok, "content": (llms_resp.text[:1000] if llms_ok else ""), "issues": []}
    completeness["llms_txt"] = llms_ok

    ai_bots_check = {}
    for bot, agent in [("GPTBot", "GPTBot/1.0"), ("ClaudeBot", "ClaudeBot"), ("PerplexityBot", "PerplexityBot/1.0")]:
        try:
            r = requests.head(base_url, headers={"User-Agent": agent}, timeout=8, allow_redirects=True)
            ai_bots_check[bot] = {"status": r.status_code, "accessible": r.status_code < 400}
        except Exception:
            ai_bots_check[bot] = {"status": 0, "accessible": False}
    accessible_count = sum(1 for v in ai_bots_check.values() if v["accessible"])
    ai_bots_check["accessibilityScore"] = round(accessible_count / max(len(ai_bots_check), 1) * 100)
    completeness["ai_bot_access"] = True

    text = soup.get_text(separator=" ", strip=True).lower()
    words = re.findall(r"\b[a-zàâçéèêëîïôùûüÿœæ]{4,}\b", text)
    _stopwords = get_stopwords("fr")
    filtered = [w for w in words if w not in _stopwords]
    kw_counter = Counter(filtered)
    keywords = [{"word": w, "count": c} for w, c in kw_counter.most_common(20)]
    completeness["keywords"] = True

    score = 0.0
    score += 12 if title else 0
    score += 10 if meta_desc else 0
    score += 8 if meta_tags["hasOpenGraph"] else 0
    score += 10 if heading_structure["hasH1"] else 0
    score += -5 if heading_structure["multipleH1"] else 0
    score += 8 if schema_org["hasJsonLd"] else 0
    score += 8 if robots_ok else 0
    score += 8 if sitemap_ok else 0
    score += 15 if llms_ok else 0
    score += 10 if not robots_txt.get("aiBotsBlocked") else -10
    score += 8 if image_alt_text["coverageRate"] > 0.8 else (4 if image_alt_text["coverageRate"] > 0.5 else 0)
    score += 5
    score = max(0.0, min(100.0, score))
    elapsed_ms = int((time.time() - start) * 1000)

    return {
        "url": base_url, "metaTags": meta_tags, "headingStructure": heading_structure,
        "imageAltText": image_alt_text, "schemaOrg": schema_org,
        "robotsTxtAnalysis": robots_txt, "sitemapAnalysis": sitemap,
        "llmsTxtAnalysis": llms_txt, "aiBotAccessibility": ai_bots_check,
        "keywords": keywords, "htmlScannerScore": round(score, 1),
        "scanCompleteness": completeness, "scanErrors": errors,
        "hasBlockedUrls": False, "subPagesScanned": None,
        "w3cValidation": {}, "linkCheck": {}, "legalPages": {},
        "processingTimeMs": elapsed_ms,
    }


def _empty_html_scan(url: str, errors: list, elapsed: float) -> dict:
    return {
        "url": url, "metaTags": {}, "headingStructure": {}, "imageAltText": {},
        "schemaOrg": {}, "robotsTxtAnalysis": {}, "sitemapAnalysis": {},
        "llmsTxtAnalysis": {}, "aiBotAccessibility": {}, "keywords": [],
        "htmlScannerScore": 0.0, "scanCompleteness": {}, "scanErrors": errors,
        "hasBlockedUrls": False, "subPagesScanned": None, "w3cValidation": {},
        "linkCheck": {}, "legalPages": {}, "processingTimeMs": int(elapsed * 1000),
    }


# ─── Mention Detection ────────────────────────────────────────────────────────

LIST_PATTERNS = [r"^\s*(\d+)\.\s+", r"^\s*[-•*]\s+", r"^\s*\*\*\d+\."]


def _generate_url_variants(url: str) -> list:
    variants = []
    try:
        parsed = urlparse(url if "://" in url else f"https://{url}")
        hostname = parsed.hostname or ""
    except Exception:
        hostname = url
    base_domain = hostname.lstrip("www.").lower()
    if base_domain:
        variants += [base_domain, f"www.{base_domain}", f"https://{base_domain}",
                     f"https://www.{base_domain}", base_domain.split(".")[0]]
    return [v.lower() for v in variants if v]


def _split_segments(response: str) -> list:
    lines = response.split("\n")
    segments, current = [], ""
    for line in lines:
        stripped = line.strip()
        if not stripped:
            if current:
                segments.append(current)
                current = ""
            continue
        is_list = any(re.match(p, stripped) for p in LIST_PATTERNS)
        if is_list:
            if current:
                segments.append(current)
            current = stripped
        else:
            current = (current + " " + stripped).strip() if current else stripped
    if current:
        segments.append(current)
    return segments


def detect_mention(response: str, business_name: str, business_url: str) -> dict:
    if not response or not response.strip():
        return {"mentioned": False, "quality": 0, "position": 0, "rawResponse": response or "",
                "citations": [], "targetCited": False, "responseTime": 0, "error": None}
    resp_lower = response.lower()
    name_lower = business_name.lower()
    url_variants = _generate_url_variants(business_url)
    name_match = name_lower in resp_lower
    url_match = any(v in resp_lower for v in url_variants)
    mentioned = name_match or url_match
    if not mentioned:
        return {"mentioned": False, "quality": 0, "position": 0, "rawResponse": response,
                "citations": [], "targetCited": False, "responseTime": 0, "error": None}
    count = resp_lower.count(name_lower)
    lines = response.split("\n")
    list_items = sum(1 for l in lines if any(re.match(p, l.strip()) for p in LIST_PATTERNS))
    in_list = list_items >= 2
    if in_list:
        segs = _split_segments(response)
        for i, s in enumerate(segs):
            if name_lower in s.lower():
                quality = 3 if i == 0 else 2
                position = i + 1
                break
        else:
            quality, position = 2, 1
    else:
        quality = 3 if (count >= 3 or (count >= 1 and len(response) < 500)) else 1
        position = 1
    return {"mentioned": True, "quality": quality, "position": position, "rawResponse": response,
            "citations": [], "targetCited": False, "responseTime": 0, "error": None}


# ─── Scoring ──────────────────────────────────────────────────────────────────

def _pos_multiplier(pos: int) -> float:
    if pos == 0: return 0.0
    if pos == 1: return 1.5
    if pos <= 3: return 1.0
    return 0.7


def calculate_prompt_score(engine_results: dict) -> tuple:
    responded, mentioned, total_score = 0, 0, 0.0
    for er in engine_results.values():
        if er.get("error"): continue
        responded += 1
        if er.get("mentioned"):
            mentioned += 1
            total_score += er["quality"] * _pos_multiplier(er["position"])
    if not responded: return 0.0, 0.0
    return round(total_score / (responded * MAX_RESPONSE_SCORE), 4), round(mentioned / responded, 4)


def calculate_category_scores(prompt_results: list) -> dict:
    groups = {}
    for pr in prompt_results:
        groups.setdefault(pr["category"], []).append(pr)
    scores = {}
    for cat, prs in groups.items():
        avg_s = sum(p["promptScore"] for p in prs) / len(prs)
        avg_m = sum(p["mentionRate"] for p in prs) / len(prs)
        scores[cat] = {"score": round(avg_s, 4), "promptCount": len(prs), "avgMentionRate": round(avg_m, 4)}
    return scores


def calculate_level_scores(prompt_results: list) -> dict:
    groups = {}
    for pr in prompt_results:
        groups.setdefault(pr["level"], []).append(pr)
    scores = {}
    for level, prs in groups.items():
        avg_s = sum(p["promptScore"] for p in prs) / len(prs)
        avg_m = sum(p["mentionRate"] for p in prs) / len(prs)
        scores[f"level{level}"] = {"score": round(avg_s, 4), "promptCount": len(prs), "avgMentionRate": round(avg_m, 4)}
    return scores


def calculate_audit_engine_score(cat_scores: dict) -> float:
    weighted_sum, total_weight = 0.0, 0.0
    for cat, weight in CATEGORY_WEIGHTS.items():
        cs = cat_scores.get(cat)
        if cs:
            weighted_sum += cs["score"] * weight
            total_weight += weight
    return round((weighted_sum / total_weight) * 100, 1) if total_weight else 0.0


def calculate_discoverability_threshold(lvl_scores: dict) -> dict:
    for level in range(1, 6):
        ls = lvl_scores.get(f"level{level}")
        if ls and ls["avgMentionRate"] >= DISCOVERABILITY_THRESHOLD:
            return {"level": level, "description": LEVEL_DESCRIPTIONS.get(level, "")}
    return {"level": None, "description": "Not discovered — invisible even when cited directly"}


def calculate_geo_score(engine_score: float, html_score: float | None) -> float:
    if html_score is not None:
        return round(engine_score * 0.70 + html_score * 0.30, 1)
    return round(engine_score, 1)


def score_competitor(prompt_results: list, comp_name: str, comp_url: str) -> dict:
    comp_prs = []
    for pr in prompt_results:
        comp_engines = {}
        for eng, er in pr["engines"].items():
            if er.get("error") or not er.get("rawResponse"):
                comp_engines[eng] = {"mentioned": False, "quality": 0, "position": 0,
                                     "rawResponse": "", "citations": [], "targetCited": False,
                                     "responseTime": 0, "error": er.get("error")}
                continue
            comp_er = detect_mention(er["rawResponse"], comp_name, comp_url)
            comp_er["responseTime"] = er.get("responseTime", 0)
            comp_engines[eng] = comp_er
        ps, mr = calculate_prompt_score(comp_engines)
        comp_prs.append({"promptId": pr["promptId"], "level": pr["level"], "category": pr["category"],
                         "question": pr["question"], "engines": comp_engines, "promptScore": ps, "mentionRate": mr})
    cat_s = calculate_category_scores(comp_prs)
    lvl_s = calculate_level_scores(comp_prs)
    es = calculate_audit_engine_score(cat_s)
    avg_mr = sum(p["mentionRate"] for p in comp_prs) / len(comp_prs) if comp_prs else 0.0
    return {
        "competitorUrl": comp_url, "competitorName": comp_name,
        "auditEngineScore": es, "mentionRate": round(avg_mr, 4),
        "categoryScores": {k: v["score"] for k, v in cat_s.items()},
        "levelScores": {k: v["score"] for k, v in lvl_s.items()},
    }


# ─── Issue Detector (ported from server/src/services/issue_detector.py) ───────

_SEVERITY_ORDER = {"critical": 0, "high": 1, "medium": 2, "low": 3}
_TYPE_ORDER = {"technical": 0, "accessibility": 1, "schema": 2, "content": 3, "meta": 4}
_ORG_SCHEMA_TYPES = {
    "Organization", "LocalBusiness", "ProfessionalService", "Corporation",
    "GovernmentOrganization", "NGO", "EducationalOrganization", "MedicalOrganization",
    "SportsOrganization", "Restaurant", "Store", "Hotel", "FinancialService",
    "LegalService", "RealEstateAgent",
}


def _mk_issue(id_: str, type_: str, severity: str, title: str, description: str, ai_impact: str | None = None) -> dict:
    return {"id": id_, "type": type_, "severity": severity, "title": title,
            "description": description, "aiImpact": ai_impact, "source": "detector"}


def detect_issues(html_scan: dict | None, cat_scores: dict, lvl_scores: dict,
                  engine_score: float, threshold: dict) -> tuple:
    issues = []

    if html_scan:
        robots = html_scan.get("robotsTxtAnalysis", {})
        if robots.get("exists") is False:
            issues.append(_mk_issue("no_robots_txt", "technical", "high",
                "No robots.txt found",
                "Your website does not have a robots.txt file.",
                "AI crawlers may not efficiently discover your content."))
        if robots.get("blanketDisallow"):
            issues.append(_mk_issue("robots_blanket_disallow", "technical", "critical",
                "robots.txt blocks all crawlers",
                "Your robots.txt contains a blanket Disallow rule.",
                "AI models cannot crawl or index any of your content."))
        blocked = robots.get("blockedBots", []) if robots.get("aiBotsBlocked") else []
        if blocked:
            issues.append(_mk_issue("robots_ai_bots_blocked", "accessibility", "high",
                "AI bots blocked in robots.txt",
                f"Your robots.txt explicitly blocks AI crawlers: {', '.join(blocked[:5])}.",
                "Blocked AI bots cannot crawl your site."))

        llms = html_scan.get("llmsTxtAnalysis", {})
        if llms.get("exists") is False:
            issues.append(_mk_issue("no_llms_txt", "technical", "high",
                "No llms.txt found",
                "Your website does not have an llms.txt file.",
                "LLMs miss a dedicated source of structured business information."))

        sitemap = html_scan.get("sitemapAnalysis", {})
        if sitemap.get("exists") is False:
            issues.append(_mk_issue("no_sitemap", "technical", "medium",
                "No sitemap.xml found",
                "Your website does not have a sitemap.xml.",
                "AI crawlers may miss important pages."))

        schema_org = html_scan.get("schemaOrg", {})
        detected_types = set(schema_org.get("detectedTypes", []))
        if not (detected_types & _ORG_SCHEMA_TYPES):
            issues.append(_mk_issue("no_organization_schema", "schema", "high",
                "No Organization schema markup",
                "Your website lacks Organization structured data.",
                "AI models rely on schema.org to understand your business identity."))

        has_faq = "FAQPage" in detected_types
        if not has_faq:
            disc_cat = cat_scores.get("discovery", {})
            sev = "critical" if disc_cat and disc_cat.get("score", 1) < 0.40 else "high"
            fid = "no_faq_schema_critical" if sev == "critical" else "no_faq_schema"
            issues.append(_mk_issue(fid, "schema", sev,
                "No FAQ schema markup",
                "Your website lacks FAQPage structured data.",
                "FAQ schema directly feeds AI models with Q&A about your business."))

        meta = html_scan.get("metaTags", {})
        description = meta.get("description", "")
        if not description or len(description) < 100:
            issues.append(_mk_issue("weak_meta_description", "meta", "medium",
                "Weak or missing meta description",
                "Your meta description is missing or too short (under 100 characters).",
                "Meta descriptions help AI models understand page purpose."))

        for issue_text in meta.get("issues", []):
            if "title" in issue_text.lower():
                issues.append(_mk_issue("missing_meta_title", "meta", "high",
                    "Missing page title",
                    "Your page is missing a <title> tag.",
                    "Without a title, AI models cannot properly identify your page."))
                break

        heading_issues = html_scan.get("headingStructure", {}).get("issues", [])
        if heading_issues:
            issues.append(_mk_issue("heading_structure_issues", "meta", "medium",
                "Heading structure issues",
                f"Found {len(heading_issues)} heading issue(s): {heading_issues[0]}.",
                "Proper heading hierarchy helps AI models parse your content."))

        img_alt = html_scan.get("imageAltText", {})
        compliance = img_alt.get("compliance")
        if compliance is not None and compliance < 50:
            issues.append(_mk_issue("low_image_alt_compliance", "meta", "medium",
                "Low image alt text compliance",
                f"Only {compliance}% of images have alt text. Best practice is above 90%.",
                "Alt text helps AI models understand visual content."))

        ai_bot = html_scan.get("aiBotAccessibility", {})
        acc_score = ai_bot.get("accessibilityScore")
        if acc_score is not None and acc_score < 50:
            issues.append(_mk_issue("low_ai_bot_accessibility", "accessibility", "high",
                "Low AI bot accessibility score",
                f"AI bot accessibility score is {acc_score}/100.",
                "If AI bots cannot access your site, your content won't appear in AI responses."))

    # Layer 2: AI score-based rules
    l1 = lvl_scores.get("level1")
    l5 = lvl_scores.get("level5")
    if l1 and l5 and l1.get("avgMentionRate", 1) < 0.20 and l5.get("avgMentionRate", 0) > 0.60:
        issues.append(_mk_issue("low_brand_awareness", "content", "critical",
            "Low brand awareness in AI",
            "AI models know your niche but rarely mention your brand at broad query levels.",
            "Users asking general questions won't be directed to your business."))

    comp_cat = cat_scores.get("comparison", {})
    if comp_cat and comp_cat.get("score", 1) < 0.25:
        issues.append(_mk_issue("weak_comparison_visibility", "content", "high",
            "Weak comparison visibility",
            f"Your comparison score is {comp_cat['score']:.0%}. AI rarely includes you in comparisons.",
            "When users ask AI to compare options, you're often left out."))

    rep_cat = cat_scores.get("reputation", {})
    if rep_cat and rep_cat.get("score", 1) < 0.30:
        sev = "high" if rep_cat["score"] < 0.15 else "medium"
        issues.append(_mk_issue("weak_reputation_score", "content", sev,
            "Weak reputation in AI responses",
            f"Your reputation score is {rep_cat['score']:.0%}.",
            "Trust-related queries yield weak or absent AI responses."))

    if threshold.get("level") is None:
        issues.append(_mk_issue("invisible_to_ai", "content", "critical",
            "Invisible to AI models",
            "AI models do not mention your business at any specificity level.",
            "No matter how users phrase their queries, AI will not mention your business."))

    if threshold.get("level") is not None and threshold["level"] >= 4:
        issues.append(_mk_issue("late_discovery_only", "content", "high",
            "Only discovered at high specificity",
            f"AI only mentions your business at specificity level {threshold['level']}+.",
            "Most users won't phrase queries specifically enough."))

    # Layer 3: severity escalation
    if engine_score < 20:
        for issue in issues:
            if issue["severity"] == "high" and issue["source"] == "detector":
                issue["severity"] = "critical"

    issues.sort(key=lambda i: (_SEVERITY_ORDER.get(i["severity"], 9), _TYPE_ORDER.get(i["type"], 9)))

    counts = {"critical": 0, "high": 0, "medium": 0, "low": 0}
    for iss in issues:
        if iss["severity"] in counts:
            counts[iss["severity"]] += 1
    summary = {
        "criticalCount": counts["critical"], "highCount": counts["high"],
        "mediumCount": counts["medium"], "lowCount": counts["low"],
        "totalCount": len(issues),
    }
    return issues, summary


# ─── Prompt Gap Extractor (ported from server/src/services/prompt_gap_extractor.py) ─

def extract_prompt_gaps(prompt_results: list, cat_scores: dict,
                        max_gaps: int = 10, max_per_category: int = 3) -> tuple:
    all_gaps = []
    for pr in prompt_results:
        if pr["level"] in (2, 3) and pr["mentionRate"] == 0.0:
            all_gaps.append({
                "promptId": pr["promptId"], "question": pr["question"],
                "level": pr["level"], "category": pr["category"], "mentionRate": 0.0,
            })

    if not all_gaps:
        return [], {"totalGaps": 0, "prioritizedCount": 0, "weakestCategories": []}

    sorted_cats = sorted(cat_scores.items(), key=lambda item: item[1].get("score", 0))
    weakest_cats = [cat for cat, _ in sorted_cats[:3]]

    prioritized = []
    used_ids = set()
    for cat in weakest_cats:
        cat_gaps = [g for g in all_gaps if g["category"] == cat]
        for gap in cat_gaps[:max_per_category]:
            if len(prioritized) >= max_gaps:
                break
            prioritized.append(gap)
            used_ids.add(gap["promptId"])

    remaining = [g for g in all_gaps if g["promptId"] not in used_ids]
    for gap in remaining:
        if len(prioritized) >= max_gaps:
            break
        prioritized.append(gap)

    summary = {
        "totalGaps": len(all_gaps),
        "prioritizedCount": len(prioritized),
        "weakestCategories": weakest_cats,
    }
    return prioritized, summary


# ─── llmsTxtContent Generator (template-based) ────────────────────────────────

def generate_llms_txt(brand: dict) -> str:
    name = brand["businessName"]
    url = brand["businessUrl"].rstrip("/")
    desc = brand["description"]
    lang = brand.get("language", "fr")
    services = brand.get("servicesOrProducts", [])
    keywords = brand.get("targetKeywords", [])

    services_str = ", ".join(services[:3]) if services else brand["category"]
    keywords_str = ", ".join(keywords[:5]) if keywords else ""

    if lang == "fr":
        about_label = "À propos"
        services_label = "Services & Produits"
        contact_label = "Contact"
        about_desc = f"Découvrir {name}"
        contact_desc = f"Contacter {name}"
    else:
        about_label = "About"
        services_label = "Services & Products"
        contact_label = "Contact"
        about_desc = f"Learn about {name}"
        contact_desc = f"Contact {name}"

    lines = [
        f"# {name}",
        f"> {desc[:200]}",
        "",
        f"## {about_label}",
        f"- [Homepage]({url}): {name} — {brand['category']}",
        f"- [{about_label}]({url}/about): {about_desc}",
    ]

    if services:
        lines += ["", f"## {services_label}"]
        for i, svc in enumerate(services[:3]):
            lines.append(f"- [{svc}]({url}/{'services' if lang == 'en' else 'services'}): {svc}")

    if keywords_str:
        if lang == "fr":
            lines += ["", "## Mots-clés", f"- Domaine d'expertise: {keywords_str}"]
        else:
            lines += ["", "## Keywords", f"- Area of expertise: {keywords_str}"]

    lines += [
        "",
        f"## {contact_label}",
        f"- [{contact_label}]({url}/contact): {contact_desc}",
    ]

    content = "\n".join(lines)
    # Keep under 1000 chars as per spec
    if len(content) > 1000:
        content = content[:997] + "..."
    return content


# ─── llmHijackPrompt Generator (template-based HTML schema.org) ───────────────

def generate_llm_hijack_prompt(brand: dict, cat_scores: dict) -> str:
    name = brand["businessName"]
    url = brand["businessUrl"].rstrip("/")
    desc = brand["description"]
    year = brand.get("yearFounded", "")
    services = brand.get("servicesOrProducts", [])
    usps = brand.get("uniqueSellingPoints", [])
    audience = brand.get("targetAudience", "")
    locality = brand.get("localityTier", "global")
    lang = brand.get("language", "fr")

    # Find weakest category for FAQ focus
    weakest = sorted(cat_scores.items(), key=lambda x: x[1].get("score", 0))
    faq_category = weakest[0][0] if weakest else "discovery"

    # Build FAQ questions based on weakest category
    if faq_category == "discovery":
        if lang == "fr":
            faqs = [
                {"q": f"C'est quoi {name} ?", "a": desc},
                {"q": f"Comment fonctionne {name} ?", "a": f"{name} est {brand['category']}. {'. '.join(usps[:2])}"},
                {"q": f"Pourquoi choisir {name} ?", "a": ". ".join(usps) if usps else desc},
            ]
        else:
            faqs = [
                {"q": f"What is {name}?", "a": desc},
                {"q": f"How does {name} work?", "a": f"{name} is {brand['category']}. {'. '.join(usps[:2])}"},
                {"q": f"Why choose {name}?", "a": ". ".join(usps) if usps else desc},
            ]
    elif faq_category == "comparison":
        competitors = brand.get("competitorNames", [])[:2]
        comp_str = " and ".join(competitors) if competitors else "alternatives"
        if lang == "fr":
            faqs = [
                {"q": f"Quelle différence entre {name} et {comp_str} ?",
                 "a": f"{name} se distingue par : {'. '.join(usps[:3])}"},
                {"q": f"Pourquoi {name} est-il meilleur que {comp_str} ?",
                 "a": ". ".join(usps) if usps else f"{name} offre {brand['category']}"},
            ]
        else:
            faqs = [
                {"q": f"What's the difference between {name} and {comp_str}?",
                 "a": f"{name} stands out with: {'. '.join(usps[:3])}"},
                {"q": f"Why is {name} better than {comp_str}?",
                 "a": ". ".join(usps) if usps else f"{name} offers {brand['category']}"},
            ]
    else:
        if lang == "fr":
            faqs = [
                {"q": f"Peut-on faire confiance à {name} ?",
                 "a": f"Oui. {name} est {brand['category']} depuis {year}. {'. '.join(usps[:2])}"},
                {"q": f"Comment contacter {name} ?",
                 "a": f"Visitez {url} pour contacter {name}."},
            ]
        else:
            faqs = [
                {"q": f"Is {name} trustworthy?",
                 "a": f"Yes. {name} has been {brand['category']} since {year}. {'. '.join(usps[:2])}"},
                {"q": f"How to contact {name}?",
                 "a": f"Visit {url} to contact {name}."},
            ]

    # Build schema.org JSON-LD
    schema = {
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": name,
        "url": url,
        "description": desc[:300],
    }
    if year:
        schema["foundingDate"] = str(year)
    if audience:
        schema["audience"] = {"@type": "Audience", "audienceType": audience}
    if locality in ("hyper_local", "national"):
        schema["@type"] = "LocalBusiness"
        if brand.get("city"):
            schema["address"] = {"@type": "PostalAddress", "addressLocality": brand["city"],
                                  "addressCountry": brand.get("country", "")}

    # FAQ schema
    faq_schema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
            {"@type": "Question", "name": f["q"],
             "acceptedAnswer": {"@type": "Answer", "text": f["a"]}}
            for f in faqs
        ]
    }

    usp_list = "\n".join(f"  <li>{usp}</li>" for usp in usps[:5])
    services_list = "\n".join(f"  <li>{svc}</li>" for svc in services[:5])

    html = dedent(f"""\
    <!-- GEO Optimization Snippet for {name} — generated by ShowYourBrand -->
    <script type="application/ld+json">
    {json.dumps(schema, ensure_ascii=False, indent=2)}
    </script>
    <script type="application/ld+json">
    {json.dumps(faq_schema, ensure_ascii=False, indent=2)}
    </script>
    <div style="display:none" aria-hidden="true">
      <h1>{name}</h1>
      <p>{desc[:400]}</p>
      <h2>{'Avantages clés' if lang == 'fr' else 'Key advantages'}</h2>
      <ul>
    {usp_list}
      </ul>
      <h2>{'Services' if lang == 'fr' else 'Services'}</h2>
      <ul>
    {services_list}
      </ul>
      {'<h2>FAQ</h2>' if faqs else ''}
      {''.join(f"<details><summary>{f['q']}</summary><p>{f['a']}</p></details>" for f in faqs)}
    </div>""")

    return html


# ─── Citation stats (no citations for pre-provided answers) ──────────────────

def calculate_citation_stats(prompt_results: list, target_url: str) -> tuple:
    """No citations for pre-provided answers (plain text, no Perplexity citations)."""
    stats = {
        "totalCitations": 0, "uniqueUrls": 0,
        "targetCitationRate": 0.0, "topDomains": [], "byEngine": {},
    }
    return stats, None


# ─── MongoDB write ────────────────────────────────────────────────────────────

def _write_audit_stub(business_doc: dict, audit_id: ObjectId) -> ObjectId:
    client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=15000, connectTimeoutMS=15000)
    try:
        db = client.showyourbrand
        # Reuse existing business if one already exists for this user+slug
        existing_biz = db.businesses.find_one(
            {"userId": business_doc["userId"], "slug": business_doc["slug"]}
        )
        if existing_biz:
            business_id = existing_biz["_id"]
            logger.info(f"  Reusing existing business: {business_id} (slug={business_doc['slug']})")
        else:
            biz_result = db.businesses.insert_one(business_doc)
            business_id = biz_result.inserted_id
            logger.info(f"  Created new business: {business_id}")
        stub = {
            "_id": audit_id,
            "businessId": business_id,
            "userId": USER_ID,
            "businessName": business_doc["name"],
            "status": "processing",
            "geoScore": None,
            "schemaVersion": 2,
            "results": {},
            "createdAt": business_doc["createdAt"],
            "completedAt": None,
        }
        db.audits.insert_one(stub)
        return business_id
    finally:
        client.close()


def _write_audit_completed(audit_id: ObjectId, geo_score: float, results_blob: dict):
    client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=15000, connectTimeoutMS=15000)
    try:
        db = client.showyourbrand
        db.audits.update_one(
            {"_id": audit_id},
            {"$set": {
                "status": "completed",
                "geoScore": geo_score,
                "results": _mongo_safe(results_blob),
                "completedAt": datetime.now(timezone.utc).isoformat(),
            }},
        )
    finally:
        client.close()


# ─── Main audit runner ────────────────────────────────────────────────────────

def run_brand_audit(brand: dict) -> str:
    slug = brand["slug"]
    logger.info(f"\n{'='*60}")
    logger.info(f"STARTING AUDIT (from answers): {brand['businessName']} ({slug})")
    logger.info(f"{'='*60}")
    audit_start = time.time()

    # 1. Load prompts
    prompts_path = PROMPTS_DIR / f"{slug}.json"
    if not prompts_path.exists():
        raise FileNotFoundError(f"Prompts not found: {prompts_path}")
    with open(prompts_path, encoding="utf-8") as f:
        prompts = json.load(f)

    # 2. Load pre-provided answers
    answers_path = RESULTS_DIR / f"{slug}_answers.json"
    if not answers_path.exists():
        raise FileNotFoundError(f"Answers not found: {answers_path}. Run audit first to get answers.")
    with open(answers_path, encoding="utf-8") as f:
        raw_answers = json.load(f)
    answers_by_id = {a["id"]: a["response"] for a in raw_answers}
    logger.info(f"  Loaded {len(prompts)} prompts + {len(answers_by_id)} pre-provided answers")

    # 3. Create Business + Audit stub in MongoDB
    biz_slug = re.sub(r"[^a-z0-9]+", "-", brand["businessName"].lower()).strip("-")
    now_iso = datetime.now(timezone.utc).isoformat()
    business_doc = {
        "userId": USER_ID, "slug": biz_slug, "name": brand["businessName"],
        "primaryUrl": brand["businessUrl"], "subUrls": brand.get("subUrls", []),
        "competitorUrls": brand.get("competitorUrls", []),
        "competitorNames": brand.get("competitorNames", []),
        "category": brand["category"], "description": brand["description"],
        "businessType": brand["businessType"],
        "localityTier": brand.get("localityTier", "global"),
        "language": brand.get("language", "fr"),
        "targetKeywords": brand.get("targetKeywords", []),
        "uniqueSellingPoints": brand.get("uniqueSellingPoints", []),
        "targetAudience": brand.get("targetAudience", ""),
        "servicesOrProducts": brand.get("servicesOrProducts", []),
        "priceRange": brand.get("priceRange"),
        "city": brand.get("city"), "region": brand.get("region"),
        "country": brand.get("country"), "yearFounded": brand.get("yearFounded"),
        "createdAt": now_iso, "updatedAt": now_iso,
    }
    audit_id = ObjectId()
    business_id = _write_audit_stub(business_doc, audit_id)
    logger.info(f"  Created business: {business_id} | audit stub: {audit_id}")

    # 4. HTML Scan
    logger.info(f"  [HTML] Scanning {brand['businessUrl']}...")
    html_scan = run_html_scan(brand)
    html_score = html_scan["htmlScannerScore"]
    logger.info(f"  [HTML] Score: {html_score}/100 | Errors: {len(html_scan['scanErrors'])}")

    # 5. Process answers → prompt_results with mention detection
    logger.info(f"  [PROMPTS] Processing {len(prompts)} pre-provided answers...")
    prompt_results = []
    success_count = 0
    error_count = 0

    for prompt in prompts:
        prompt_id = prompt["id"]
        response = answers_by_id.get(prompt_id, "")

        if response:
            er = detect_mention(response, brand["businessName"], brand["businessUrl"])
            er["rawResponse"] = response[:2000]
            success_count += 1
        else:
            er = {"mentioned": False, "quality": 0, "position": 0, "rawResponse": "",
                  "citations": [], "targetCited": False, "responseTime": 0,
                  "error": "No pre-provided answer for this prompt"}
            error_count += 1

        ps, mr = calculate_prompt_score({"claude_code": er})
        prompt_results.append({
            "promptId": prompt_id,
            "level": prompt["level"],
            "category": prompt["category"],
            "question": prompt["question"],
            "engines": {"claude_code": er},
            "promptScore": ps,
            "mentionRate": mr,
        })

    logger.info(f"  [PROMPTS] Done: {success_count} processed, {error_count} missing")

    # 6. Calculate scores
    cat_scores = calculate_category_scores(prompt_results)
    lvl_scores = calculate_level_scores(prompt_results)
    engine_score = calculate_audit_engine_score(cat_scores)
    threshold = calculate_discoverability_threshold(lvl_scores)
    citation_stats, citation_visibility_score = calculate_citation_stats(prompt_results, brand["businessUrl"])
    geo_score = calculate_geo_score(engine_score, html_score)
    logger.info(f"  [SCORES] Engine: {engine_score} | HTML: {html_score} | GEO: {geo_score}")

    # 7. Issue detection (deterministic)
    issues, issues_summary = detect_issues(html_scan, cat_scores, lvl_scores, engine_score, threshold)
    logger.info(f"  [ISSUES] Detected {issues_summary['totalCount']} issues "
                f"({issues_summary['criticalCount']} critical, {issues_summary['highCount']} high)")

    # 8. Prompt gap extraction (deterministic)
    prompt_gaps, prompt_gaps_summary = extract_prompt_gaps(prompt_results, cat_scores)
    logger.info(f"  [GAPS] Found {prompt_gaps_summary['totalGaps']} gaps, "
                f"{prompt_gaps_summary['prioritizedCount']} prioritized")

    # 9. Generate llmsTxtContent (template-based)
    llms_txt_content = generate_llms_txt(brand)
    logger.info(f"  [LLMS.TXT] Generated ({len(llms_txt_content)} chars)")

    # 10. Generate llmHijackPrompt (template-based HTML)
    llm_hijack_prompt = generate_llm_hijack_prompt(brand, cat_scores)
    logger.info(f"  [HIJACK] Generated ({len(llm_hijack_prompt)} chars)")

    # 11. Score competitors
    competitor_results = []
    for comp_name, comp_url in zip(brand.get("competitorNames", []), brand.get("competitorUrls", [])):
        comp = score_competitor(prompt_results, comp_name, comp_url)
        competitor_results.append(comp)
        logger.info(f"  [COMPETITOR] {comp_name}: {comp['auditEngineScore']} engine score, {comp['mentionRate']:.1%} mention rate")

    # 12. Business snapshot
    business_snapshot = {
        "name": brand["businessName"],
        "primaryUrl": brand["businessUrl"],
        "subUrls": brand.get("subUrls", []),
        "competitorUrls": brand.get("competitorUrls", []),
        "competitorNames": brand.get("competitorNames", []),
        "category": brand["category"],
        "description": brand["description"],
        "targetKeywords": brand.get("targetKeywords", []),
        "businessType": brand["businessType"],
        "localityTier": brand.get("localityTier"),
        "allMetadata": {k: v for k, v in brand.items() if k != "slug"},
    }

    # 13. Build ResultsBlob
    processing_time_ms = int((time.time() - audit_start) * 1000)
    total_responses = sum(1 for pr in prompt_results for er in pr["engines"].values() if not er.get("error"))

    results_blob = {
        "businessSnapshot": business_snapshot,
        "localityTier": brand.get("localityTier"),
        "generatedPrompts": prompts,
        "promptResults": prompt_results,
        "categoryScores": cat_scores,
        "levelScores": lvl_scores,
        "auditEngineScore": engine_score,
        "htmlScan": html_scan,
        "htmlScannerScore": html_score,
        "gscData": None,
        "googleReviews": None,
        "citationStats": citation_stats,
        "citationVisibilityScore": citation_visibility_score,
        "issues": issues,
        "issuesSummary": issues_summary,
        "promptGaps": prompt_gaps,
        "promptGapsSummary": prompt_gaps_summary,
        "llmsTxtContent": llms_txt_content,
        "llmHijackPrompt": llm_hijack_prompt,
        "discoverabilityThreshold": threshold,
        "competitorResults": competitor_results,
        "originalRequest": {k: v for k, v in brand.items() if k != "slug"},
        "enginesUsed": ["claude_code"],
        "enginesSucceeded": ["claude_code"],
        "totalPromptsProcessed": len(prompts),
        "totalResponsesReceived": total_responses,
        "processingTimeMs": processing_time_ms,
    }

    # 14. Save JSON backup
    RESULTS_DIR.mkdir(exist_ok=True)
    result_path = RESULTS_DIR / f"{slug}_from_answers.json"
    with open(result_path, "w", encoding="utf-8") as f:
        json.dump({
            "audit_id": str(audit_id), "business_id": str(business_id),
            "geo_score": geo_score, "engine_score": engine_score, "html_score": html_score,
            "issues_count": issues_summary["totalCount"],
            "gaps_count": prompt_gaps_summary["totalGaps"],
        }, f, default=str)
    logger.info(f"  [BACKUP] Summary saved to {result_path}")

    # 15. Write completed audit to MongoDB
    logger.info(f"  [MONGO] Writing completed audit...")
    _write_audit_completed(audit_id, geo_score, results_blob)

    elapsed_min = round((time.time() - audit_start) / 60, 1)
    logger.info(f"  ✓ Audit COMPLETED in {elapsed_min}min | GEO: {geo_score} | Issues: {issues_summary['totalCount']} | Gaps: {prompt_gaps_summary['totalGaps']} | ID: {audit_id}")
    return str(audit_id)


# ─── Entry point ──────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("slugs", nargs="*", help="Brand slug(s) to run (default: all)")
    args = parser.parse_args()

    target_brands = BRANDS
    if args.slugs:
        target_brands = [b for b in BRANDS if b["slug"] in args.slugs]
        if not target_brands:
            print(f"Unknown slug(s): {args.slugs}. Available: {[b['slug'] for b in BRANDS]}")
            sys.exit(1)

    logger.info("Verifying MongoDB connectivity...")
    client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=10000)
    try:
        client.showyourbrand.command("ping")
        logger.info("MongoDB connected. Starting audits from pre-provided answers...")
    finally:
        client.close()

    RESULTS_DIR.mkdir(exist_ok=True)
    audit_ids = {}
    total_start = time.time()

    for brand in target_brands:
        try:
            audit_id = run_brand_audit(brand)
            audit_ids[brand["slug"]] = audit_id
        except Exception as e:
            logger.error(f"FAILED [{brand['slug']}]: {e}", exc_info=True)
            audit_ids[brand["slug"]] = f"ERROR: {e}"

    total_min = round((time.time() - total_start) / 60, 1)
    print(f"\n{'='*60}")
    print(f"AUDITS COMPLETE ({total_min}min total)")
    print(f"{'='*60}")
    for slug, aid in audit_ids.items():
        print(f"  {slug:25s} → {aid}")
    print(f"{'='*60}")
