"""
Full simulation audit runner — standalone, no server needed.

For each of the 3 brands:
  1. Creates a Business document in MongoDB
  2. Creates an Audit document in MongoDB
  3. Runs a real HTTP-based HTML scan
  4. Executes 100 prompts via `claude -p` (local, uses subscription)
  5. Calculates GEO scores
  6. Writes everything to MongoDB as status="completed"

Usage:
    python simulation/run_full_audit.py

Prerequisites:
  - simulation/prompts/{slug}.json must exist (run generate_prompts.py first)
  - pymongo, requests, beautifulsoup4 installed
  - `claude` CLI available and authenticated

Config (hardcoded from .env.example):
  MONGODB_URI + USER_ID below.

IMPORTANT: Each brand creates a fresh MongoClient for its DB writes to avoid
           connection timeout issues during long-running (multi-hour) audits.
           Results are also saved to simulation/results/{slug}.json as backup.
"""

import json
import logging
import os
import re
import shutil
import subprocess
import sys
import time
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlparse

import requests
from bs4 import BeautifulSoup
from pymongo import MongoClient
from bson import ObjectId

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

# ─── Brand configs (same as brands.py) ───────────────────────────────────────

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

# ─── Category/level scoring weights (from config.py) ─────────────────────────

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

# ─── HTML Scanner (HTTP-based, no Selenium/Java/Rust required) ────────────────

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
    """Recursively ensure every value is BSON-serializable. Converts unknown types to str."""
    if isinstance(obj, dict):
        return {k: _mongo_safe(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_mongo_safe(v) for v in obj]
    if isinstance(obj, (str, int, float, bool, type(None), ObjectId)):
        return obj
    return str(obj)  # Catch-all: stringify anything unexpected (e.g. Response objects)


def run_html_scan(brand: dict) -> dict:
    """Simplified HTTP-based HTML scan. Returns htmlScan-compatible dict."""
    base_url = brand["businessUrl"].rstrip("/")
    logger.info(f"  [HTML] Scanning {base_url} ...")
    start = time.time()
    errors = []
    completeness = {}

    # ── 1. Fetch main page ─────────────────────────────────────────────────
    resp = _safe_get(base_url)
    if not resp or resp.status_code >= 400:
        errors.append(f"Main page unreachable: {resp.status_code if resp else 'timeout'}")
        return _empty_html_scan(base_url, errors, time.time() - start)

    soup = BeautifulSoup(resp.text, "html.parser")
    completeness["main_page"] = True

    # ── 2. Meta tags ───────────────────────────────────────────────────────
    title_tag = soup.find("title")
    title = title_tag.get_text(strip=True) if title_tag else ""

    meta_desc_tag = soup.find("meta", attrs={"name": "description"})
    meta_desc = meta_desc_tag.get("content", "") if meta_desc_tag else ""

    og_title = (soup.find("meta", property="og:title") or {}).get("content", "")
    og_desc = (soup.find("meta", property="og:description") or {}).get("content", "")
    og_image = (soup.find("meta", property="og:image") or {}).get("content", "")

    meta_tags = {
        "title": title,
        "description": meta_desc,
        "og:title": og_title,
        "og:description": og_desc,
        "og:image": og_image,
        "hasTitleTag": bool(title),
        "hasMetaDescription": bool(meta_desc),
        "hasOpenGraph": bool(og_title or og_desc),
    }
    completeness["meta_tags"] = True

    # ── 3. Heading structure ───────────────────────────────────────────────
    h_tags = {}
    for level in range(1, 7):
        tags = soup.find_all(f"h{level}")
        h_tags[f"h{level}"] = [t.get_text(strip=True)[:100] for t in tags[:5]]
    heading_structure = {
        "counts": {k: len(v) for k, v in h_tags.items()},
        "h1": h_tags.get("h1", []),
        "hasH1": len(h_tags.get("h1", [])) > 0,
        "multipleH1": len(h_tags.get("h1", [])) > 1,
    }
    completeness["headings"] = True

    # ── 4. Image alt text ──────────────────────────────────────────────────
    imgs = soup.find_all("img")
    imgs_with_alt = sum(1 for img in imgs if img.get("alt", "").strip())
    image_alt_text = {
        "total": len(imgs),
        "withAlt": imgs_with_alt,
        "withoutAlt": len(imgs) - imgs_with_alt,
        "coverageRate": round(imgs_with_alt / len(imgs), 2) if imgs else 1.0,
    }
    completeness["image_alt"] = True

    # ── 5. Schema.org (look for JSON-LD) ───────────────────────────────────
    json_ld_tags = soup.find_all("script", type="application/ld+json")
    schema_org_data = []
    for tag in json_ld_tags:
        try:
            schema_org_data.append(json.loads(tag.string or "{}"))
        except Exception:
            pass
    schema_org = {
        "jsonLd": schema_org_data,
        "hasJsonLd": len(schema_org_data) > 0,
        "types": [d.get("@type", "") for d in schema_org_data if isinstance(d, dict)],
    }
    completeness["schema_org"] = True

    # ── 6. robots.txt ──────────────────────────────────────────────────────
    robots_resp = _safe_get(f"{base_url}/robots.txt")
    robots_ok = robots_resp and robots_resp.status_code == 200
    robots_txt = {
        "exists": robots_ok,
        "content": (robots_resp.text[:500] if robots_ok else ""),
        "aiBotsBlocked": False,
    }
    if robots_ok:
        content_lower = robots_resp.text.lower()
        ai_bots = ["gptbot", "claudebot", "perplexitybot", "googlebot"]
        blocked = [b for b in ai_bots if f"user-agent: {b}" in content_lower and "disallow: /" in content_lower]
        robots_txt["aiBotsBlocked"] = len(blocked) > 0
        robots_txt["blockedBots"] = blocked
    completeness["robots_txt"] = robots_ok

    # ── 7. sitemap.xml ─────────────────────────────────────────────────────
    sitemap_resp = _safe_get(f"{base_url}/sitemap.xml")
    sitemap_ok = sitemap_resp and sitemap_resp.status_code == 200
    sitemap = {
        "exists": sitemap_ok,
        "urlCount": sitemap_resp.text.count("<url>") if sitemap_ok else 0,
    }
    completeness["sitemap"] = sitemap_ok

    # ── 8. llms.txt ────────────────────────────────────────────────────────
    llms_resp = _safe_get(f"{base_url}/llms.txt")
    llms_ok = llms_resp and llms_resp.status_code == 200
    llms_txt = {
        "exists": llms_ok,
        "content": (llms_resp.text[:1000] if llms_ok else ""),
    }
    completeness["llms_txt"] = llms_ok

    # ── 9. AI bot accessibility (HEAD requests) ────────────────────────────
    ai_bots_check = {}
    for bot, agent in [
        ("GPTBot", "GPTBot/1.0"),
        ("ClaudeBot", "ClaudeBot"),
        ("PerplexityBot", "PerplexityBot/1.0"),
    ]:
        try:
            r = requests.head(base_url, headers={"User-Agent": agent}, timeout=8, allow_redirects=True)
            ai_bots_check[bot] = {"status": r.status_code, "accessible": r.status_code < 400}
        except Exception:
            ai_bots_check[bot] = {"status": 0, "accessible": False}
    completeness["ai_bot_access"] = True

    # ── 10. Keywords (top 20 by frequency) ────────────────────────────────
    text = soup.get_text(separator=" ", strip=True).lower()
    words = re.findall(r"\b[a-zàâçéèêëîïôùûüÿœæ]{4,}\b", text)
    stopwords = {"dans", "avec", "pour", "plus", "votre", "notre", "nous", "vous", "that", "this",
                 "your", "with", "have", "from", "they", "what", "their", "will", "mais", "aussi",
                 "tout", "tous", "très", "bien", "être", "plus", "aussi", "comme", "when", "than"}
    filtered = [w for w in words if w not in stopwords]
    kw_counter = Counter(filtered)
    keywords = [{"word": w, "count": c} for w, c in kw_counter.most_common(20)]
    completeness["keywords"] = True

    # ── Score calculation ─────────────────────────────────────────────────
    score = 0.0
    score += 12 if title else 0              # Title tag
    score += 10 if meta_desc else 0          # Meta description
    score += 8 if meta_tags["hasOpenGraph"] else 0  # OG tags
    score += 10 if heading_structure["hasH1"] else 0  # H1 tag
    score += -5 if heading_structure["multipleH1"] else 0  # Multiple H1 = penalty
    score += 8 if schema_org["hasJsonLd"] else 0   # Schema.org
    score += 8 if robots_ok else 0           # robots.txt
    score += 8 if sitemap_ok else 0          # sitemap.xml
    score += 15 if llms_ok else 0            # llms.txt (big GEO bonus)
    score += 10 if not robots_txt.get("aiBotsBlocked") else -10  # AI bots accessible
    score += 8 if image_alt_text["coverageRate"] > 0.8 else (4 if image_alt_text["coverageRate"] > 0.5 else 0)
    score += 5  # Base for page being reachable
    score = max(0.0, min(100.0, score))
    elapsed_ms = int((time.time() - start) * 1000)

    return {
        "url": base_url,
        "metaTags": meta_tags,
        "headingStructure": heading_structure,
        "imageAltText": image_alt_text,
        "schemaOrg": schema_org,
        "robotsTxtAnalysis": robots_txt,
        "sitemapAnalysis": sitemap,
        "llmsTxtAnalysis": llms_txt,
        "aiBotAccessibility": ai_bots_check,
        "keywords": keywords,
        "htmlScannerScore": round(score, 1),
        "scanCompleteness": completeness,
        "scanErrors": errors,
        "hasBlockedUrls": False,
        "subPagesScanned": None,
        "w3cValidation": {},
        "linkCheck": {},
        "legalPages": {},
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


# ─── Claude Code CLI ──────────────────────────────────────────────────────────

def call_claude_cli(message: str, timeout: int = 90) -> dict:
    claude_bin = shutil.which("claude")
    if not claude_bin:
        return {"success": False, "response": "", "error": "claude not found"}
    try:
        env = {k: v for k, v in os.environ.items() if k != "CLAUDECODE"}
        result = subprocess.run(
            [claude_bin, "-p", message, "--dangerously-skip-permissions"],
            capture_output=True, text=True, timeout=timeout, env=env,
        )
        if result.returncode == 0:
            return {"success": True, "response": result.stdout.strip(), "error": None}
        return {"success": False, "response": "", "error": result.stderr.strip() or f"Exit {result.returncode}"}
    except subprocess.TimeoutExpired:
        return {"success": False, "response": "", "error": f"Timeout after {timeout}s"}
    except Exception as e:
        return {"success": False, "response": "", "error": str(e)}


# ─── Mention Detection (inline, simplified from mention_detector.py) ──────────

LIST_PATTERNS = [
    r"^\s*(\d+)\.\s+",
    r"^\s*[-•*]\s+",
    r"^\s*\*\*\d+\.",
]

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
    """Returns EngineResult-compatible dict."""
    if not response or not response.strip():
        return {"mentioned": False, "quality": 0, "position": 0, "rawResponse": response or "", "citations": [], "targetCited": False, "responseTime": 0, "error": None}

    resp_lower = response.lower()
    name_lower = business_name.lower()
    url_variants = _generate_url_variants(business_url)

    name_match = name_lower in resp_lower
    url_match = any(v in resp_lower for v in url_variants)
    mentioned = name_match or url_match

    if not mentioned:
        return {"mentioned": False, "quality": 0, "position": 0, "rawResponse": response, "citations": [], "targetCited": False, "responseTime": 0, "error": None}

    # Quality
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

    return {"mentioned": True, "quality": quality, "position": position, "rawResponse": response, "citations": [], "targetCited": False, "responseTime": 0, "error": None}


# ─── Scoring (inline, from scoring.py) ────────────────────────────────────────

MAX_RESPONSE_SCORE = 4.5


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
                comp_engines[eng] = {"mentioned": False, "quality": 0, "position": 0, "rawResponse": "", "citations": [], "targetCited": False, "responseTime": 0, "error": er.get("error")}
                continue
            comp_er = detect_mention(er["rawResponse"], comp_name, comp_url)
            comp_er["responseTime"] = er.get("responseTime", 0)
            comp_engines[eng] = comp_er
        ps, mr = calculate_prompt_score(comp_engines)
        comp_prs.append({"promptId": pr["promptId"], "level": pr["level"], "category": pr["category"], "question": pr["question"], "engines": comp_engines, "promptScore": ps, "mentionRate": mr})
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


# ─── MongoDB write (fresh connection per brand) ───────────────────────────────

def _write_audit_to_mongo(business_doc: dict, audit_id: ObjectId, geo_score: float, results_blob: dict) -> tuple:
    """
    Creates a fresh MongoClient, inserts business + audit docs, closes connection.
    Returns (business_id, audit_id).
    Called TWICE per brand: once to create stubs, once to update with results.
    """
    client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=15000, connectTimeoutMS=15000)
    try:
        db = client.showyourbrand
        # Delete previous business+audits for this slug to allow re-runs
        old_biz = db.businesses.find_one({"userId": business_doc["userId"], "slug": business_doc["slug"]})
        if old_biz:
            db.audits.delete_many({"businessId": old_biz["_id"]})
            db.businesses.delete_one({"_id": old_biz["_id"]})
        biz_result = db.businesses.insert_one(business_doc)
        business_id = biz_result.inserted_id

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


def _update_audit_completed(audit_id: ObjectId, geo_score: float, results_blob: dict):
    """Fresh connection to finalize the audit with completed status."""
    client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=15000, connectTimeoutMS=15000)
    try:
        db = client.showyourbrand
        db.audits.update_one(
            {"_id": audit_id},
            {
                "$set": {
                    "status": "completed",
                    "geoScore": geo_score,
                    "results": _mongo_safe(results_blob),
                    "completedAt": datetime.now(timezone.utc).isoformat(),
                }
            },
        )
    finally:
        client.close()


# ─── Main audit runner ────────────────────────────────────────────────────────

def run_brand_audit(brand: dict, cached_html_score: float | None = None) -> str:
    """
    Run a full audit for one brand. Returns the audit _id as string.
    Uses fresh MongoDB connections (not long-lived) to avoid timeout.
    Saves results to JSON as backup before writing to MongoDB.
    Pass cached_html_score to skip the HTML scan and reuse a known score.
    """
    slug = brand["slug"]
    logger.info(f"\n{'='*60}")
    logger.info(f"STARTING AUDIT: {brand['businessName']} ({slug})")
    logger.info(f"{'='*60}")
    audit_start = time.time()

    # ── 1. Load pre-generated prompts ─────────────────────────────────────
    prompts_path = PROMPTS_DIR / f"{slug}.json"
    if not prompts_path.exists():
        raise FileNotFoundError(f"Prompts not found: {prompts_path}. Run generate_prompts.py first.")
    with open(prompts_path, encoding="utf-8") as f:
        prompts = json.load(f)
    logger.info(f"  Loaded {len(prompts)} prompts from {prompts_path.name}")

    # ── 2. Create Business + Audit stub in MongoDB (fresh connection) ──────
    biz_slug = re.sub(r"[^a-z0-9]+", "-", brand["businessName"].lower()).strip("-")
    now_iso = datetime.now(timezone.utc).isoformat()
    business_doc = {
        "userId": USER_ID,
        "slug": biz_slug,
        "name": brand["businessName"],
        "primaryUrl": brand["businessUrl"],
        "subUrls": brand.get("subUrls", []),
        "competitorUrls": brand.get("competitorUrls", []),
        "competitorNames": brand.get("competitorNames", []),
        "category": brand["category"],
        "description": brand["description"],
        "businessType": brand["businessType"],
        "localityTier": brand.get("localityTier", "global"),
        "language": brand.get("language", "fr"),
        "targetKeywords": brand.get("targetKeywords", []),
        "uniqueSellingPoints": brand.get("uniqueSellingPoints", []),
        "targetAudience": brand.get("targetAudience", ""),
        "servicesOrProducts": brand.get("servicesOrProducts", []),
        "priceRange": brand.get("priceRange"),
        "city": brand.get("city"),
        "region": brand.get("region"),
        "country": brand.get("country"),
        "yearFounded": brand.get("yearFounded"),
        "createdAt": now_iso,
        "updatedAt": now_iso,
    }
    audit_id = ObjectId()
    business_id = _write_audit_to_mongo(business_doc, audit_id, None, {})
    logger.info(f"  Created business: {business_id} | audit stub: {audit_id}")

    # ── 3. HTML Scan (or reuse cached score) ───────────────────────────────
    if cached_html_score is not None:
        logger.info(f"  [HTML] Skipping scan — using cached score: {cached_html_score}")
        html_score = cached_html_score
        html_scan = _empty_html_scan(brand["businessUrl"], [], 0)
        html_scan["htmlScannerScore"] = html_score
        html_scan["note"] = "HTML scan skipped — cached score reused"
    else:
        logger.info(f"  [HTML] Starting scan for {brand['businessUrl']}...")
        html_scan = run_html_scan(brand)
        html_score = html_scan["htmlScannerScore"]
        logger.info(f"  [HTML] Score: {html_score}/100 | Errors: {len(html_scan['scanErrors'])}")

    # ── 4. Execute 100 prompts via claude CLI ──────────────────────────────
    logger.info(f"  [PROMPTS] Executing {len(prompts)} prompts via claude CLI...")
    prompt_results = []
    success_count = 0
    error_count = 0

    # Check for partial results from a previous interrupted run
    partial_path = RESULTS_DIR / f"{slug}_partial.json"
    if partial_path.exists():
        with open(partial_path, encoding="utf-8") as f:
            saved = json.load(f)
        prompt_results = saved.get("prompt_results", [])
        success_count = saved.get("success_count", 0)
        error_count = saved.get("error_count", 0)
        logger.info(f"  [PROMPTS] Resuming from partial save: {len(prompt_results)} already done")

    start_from = len(prompt_results)

    for i, prompt in enumerate(prompts[start_from:], start=start_from):
        prompt_start = time.time()

        # Build question (add location context for national/hyper_local)
        question = prompt["question"]
        locality = brand.get("localityTier", "global")
        if locality == "hyper_local" and brand.get("city"):
            context = f"[Context: user located in {brand.get('neighborhood', '')}, {brand.get('city', '')}, {brand.get('country', '')}]"
            question = f"{context}\n{question}"
        elif locality == "national" and brand.get("country"):
            context = f"[Context: user located in {brand.get('city', brand.get('country', ''))}]"
            question = f"{context}\n{question}"

        result = call_claude_cli(question, timeout=90)
        elapsed_ms = int((time.time() - prompt_start) * 1000)

        if result["success"] and result["response"]:
            er = detect_mention(result["response"], brand["businessName"], brand["businessUrl"])
            er["responseTime"] = elapsed_ms
            er["rawResponse"] = result["response"][:2000]  # Truncate to save space
            success_count += 1
        else:
            er = {"mentioned": False, "quality": 0, "position": 0, "rawResponse": "",
                  "citations": [], "targetCited": False, "responseTime": elapsed_ms,
                  "error": result.get("error", "Unknown error")}
            error_count += 1

        ps, mr = calculate_prompt_score({"claude_code": er})
        prompt_results.append({
            "promptId": prompt["id"],
            "level": prompt["level"],
            "category": prompt["category"],
            "question": prompt["question"],
            "engines": {"claude_code": er},
            "promptScore": ps,
            "mentionRate": mr,
        })

        # Save partial results every 10 prompts
        if (i + 1) % 10 == 0:
            elapsed_total = int(time.time() - audit_start)
            mentioned_so_far = sum(1 for pr in prompt_results if pr["mentionRate"] > 0)
            logger.info(f"    Progress: {i+1}/100 | Mentioned: {mentioned_so_far} | Errors: {error_count} | {elapsed_total}s elapsed")
            RESULTS_DIR.mkdir(exist_ok=True)
            with open(partial_path, "w", encoding="utf-8") as f:
                json.dump({"prompt_results": prompt_results, "success_count": success_count, "error_count": error_count}, f)

    logger.info(f"  [PROMPTS] Done: {success_count} success, {error_count} errors")

    # ── 5. Calculate scores ────────────────────────────────────────────────
    cat_scores = calculate_category_scores(prompt_results)
    lvl_scores = calculate_level_scores(prompt_results)
    engine_score = calculate_audit_engine_score(cat_scores)
    threshold = calculate_discoverability_threshold(lvl_scores)
    geo_score = calculate_geo_score(engine_score, html_score)

    logger.info(f"  [SCORES] Engine: {engine_score} | HTML: {html_score} | GEO: {geo_score}")

    # ── 6. Score competitors ───────────────────────────────────────────────
    competitor_results = []
    for comp_name, comp_url in zip(brand.get("competitorNames", []), brand.get("competitorUrls", [])):
        comp = score_competitor(prompt_results, comp_name, comp_url)
        competitor_results.append(comp)
        logger.info(f"  [COMPETITOR] {comp_name}: {comp['auditEngineScore']} engine score, {comp['mentionRate']:.1%} mention rate")

    # ── 7. Business snapshot ───────────────────────────────────────────────
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

    # ── 8. Build ResultsBlob ───────────────────────────────────────────────
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
        "citationStats": None,
        "citationVisibilityScore": None,
        "discoverabilityThreshold": threshold,
        "competitorResults": competitor_results,
        "llmHijackPrompt": None,
        "originalRequest": {k: v for k, v in brand.items() if k != "slug"},
        "enginesUsed": ["claude_code"],
        "enginesSucceeded": ["claude_code"],
        "totalPromptsProcessed": len(prompts),
        "totalResponsesReceived": total_responses,
        "processingTimeMs": processing_time_ms,
    }

    # ── 9. Save full results to JSON (safety backup) ───────────────────────
    RESULTS_DIR.mkdir(exist_ok=True)
    result_path = RESULTS_DIR / f"{slug}.json"
    full_save = {
        "audit_id": str(audit_id),
        "business_id": str(business_id),
        "geo_score": geo_score,
        "engine_score": engine_score,
        "html_score": html_score,
        "results_blob": results_blob,
    }
    with open(result_path, "w", encoding="utf-8") as f:
        # ObjectId not JSON-serializable → convert to str
        json.dump(full_save, f, default=str)
    logger.info(f"  [BACKUP] Results saved to {result_path}")

    # ── 10. Write completed audit to MongoDB (fresh connection) ────────────
    logger.info(f"  [MONGO] Writing completed audit to MongoDB...")
    _update_audit_completed(audit_id, geo_score, results_blob)

    # Clean up partial file on success
    if partial_path.exists():
        partial_path.unlink()

    elapsed_min = int((time.time() - audit_start) / 60)
    logger.info(f"  ✓ Audit COMPLETED in {elapsed_min}min | GEO Score: {geo_score} | Audit ID: {audit_id}")
    return str(audit_id)


if __name__ == "__main__":
    # Usage: python run_full_audit.py [slug ...] [--html-score=N]
    # e.g.:  python run_full_audit.py maison_du_laser --html-score=83
    # e.g.:  python run_full_audit.py maison_du_laser --html-score=83
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("slugs", nargs="*", help="Brand slug(s) to run (default: all)")
    parser.add_argument("--html-score", type=float, default=None, help="Reuse this HTML score, skip scan")
    args = parser.parse_args()

    # Filter brands if specific slugs passed
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
        logger.info("MongoDB connected. Starting audits...")
    finally:
        client.close()

    RESULTS_DIR.mkdir(exist_ok=True)
    audit_ids = {}
    total_start = time.time()

    for brand in target_brands:
        try:
            audit_id = run_brand_audit(brand, cached_html_score=args.html_score)
            audit_ids[brand["slug"]] = audit_id
        except Exception as e:
            logger.error(f"FAILED [{brand['slug']}]: {e}", exc_info=True)
            audit_ids[brand["slug"]] = f"ERROR: {e}"

    total_min = int((time.time() - total_start) / 60)
    print(f"\n{'='*60}")
    print(f"AUDITS COMPLETE ({total_min}min total)")
    print(f"{'='*60}")
    for slug, aid in audit_ids.items():
        print(f"  {slug:25s} → {aid}")
    print(f"{'='*60}")
