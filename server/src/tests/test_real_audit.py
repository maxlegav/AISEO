#!/usr/bin/env python3
"""
Real-world audit test — runs full audits on 3 real businesses:
  1. lemonde.fr   (French media, global)
  2. shigure.fr   (French brand, national)
  3. base44.com   (SaaS platform, global)

Starts Docker container, creates audit docs in MongoDB, triggers the API,
polls until completion, and prints a full report.

Usage:
    cd /path/to/AISEO/server
    python -m tests.test_real_audit

    # Or with custom options:
    python -m tests.test_real_audit --skip-docker   # If container already running
"""

import argparse
import json
import subprocess
import sys
import time

import httpx
from bson import ObjectId
from pymongo import MongoClient
from datetime import datetime, timezone

# ---------------------------------------------------------------------------
# Config — reads same values as the server .env
# ---------------------------------------------------------------------------

SERVER_URL = "http://localhost:8080"
API_KEY = "p6jgXU4DDgWKt3Mp5WEtIZtoeS9m+ZKncQpCNW6ShBg"
MONGODB_URI = "mongodb+srv://automateitcontact:q1ziUY6sTrKPUexf@automateit.ljmnevl.mongodb.net/ShowYourBrand"
DB_NAME = "showyourbrand"

POLL_INTERVAL = 15   # seconds between status checks
MAX_WAIT = 900       # 15 minutes max wait per audit

REPO_ROOT = subprocess.check_output(
    ["git", "rev-parse", "--show-toplevel"], text=True
).strip()

# ---------------------------------------------------------------------------
# Real businesses to audit
# ---------------------------------------------------------------------------

BUSINESSES = [
    {
        "businessName": "Le Monde",
        "businessUrl": "https://www.lemonde.fr",
        "businessType": "media",
        "category": "national newspaper and digital media",
        "description": "Le Monde is one of France's leading daily newspapers, covering international news, politics, economy, culture, and opinion. Founded in 1944, it is widely regarded as a reference in French-language journalism.",
        "language": "fr",
        "city": "Paris",
        "country": "France",
        "localityTier": "global",
        "targetKeywords": ["journal français", "actualités France", "presse quotidienne"],
        "competitorNames": ["Le Figaro", "Libération", "Les Échos"],
        "subUrls": ["https://www.lemonde.fr/international/", "https://www.lemonde.fr/politique/"],
        "competitorUrls": ["https://www.lefigaro.fr", "https://www.liberation.fr"],
    },
    {
        "businessName": "Shigure",
        "businessUrl": "https://www.shigure.fr",
        "businessType": "e-commerce",
        "category": "Japanese-inspired artisan products",
        "description": "Shigure is a French boutique brand offering Japanese-inspired artisan products, including ceramics, textiles, and home decor. Focused on craftsmanship and minimalist aesthetics.",
        "language": "fr",
        "city": "Paris",
        "country": "France",
        "localityTier": "national",
        "targetKeywords": ["boutique japonaise France", "céramique artisanale japonaise", "décoration japonaise"],
        "competitorNames": ["Muji", "Maison Hand", "Tsé & Tsé"],
    },
    {
        "businessName": "Base44",
        "businessUrl": "https://www.base44.com",
        "businessType": "saas",
        "category": "no-code app builder platform",
        "description": "Base44 is a no-code platform that lets users build full web applications with AI assistance. It provides database management, UI generation, and deployment — all without writing code.",
        "language": "en",
        "localityTier": "global",
        "targetKeywords": ["no-code platform", "AI app builder", "build app without code"],
        "competitorNames": ["Bubble", "Retool", "Softr"],
        "competitorUrls": ["https://bubble.io", "https://retool.com"],
    },
]


# ---------------------------------------------------------------------------
# Docker helpers
# ---------------------------------------------------------------------------

def _run(cmd: list[str], **kwargs) -> subprocess.CompletedProcess:
    """Run a shell command from repo root."""
    return subprocess.run(cmd, cwd=REPO_ROOT, text=True, capture_output=True, **kwargs)


def start_docker():
    """Build and start the aiseo-scraper container."""
    print("[DOCKER] Building and starting container...")
    result = _run(["docker", "compose", "up", "--build", "-d"])
    if result.returncode != 0:
        print(f"[DOCKER] ERROR: {result.stderr}")
        sys.exit(1)
    print("[DOCKER] Container started. Waiting for health check...")


def wait_for_healthy(timeout: int = 120):
    """Poll /health until the server is ready."""
    start = time.time()
    while time.time() - start < timeout:
        try:
            resp = httpx.get(f"{SERVER_URL}/health", timeout=5)
            if resp.status_code == 200 and resp.json().get("data", {}).get("status") == "healthy":
                print(f"[DOCKER] Server healthy after {int(time.time() - start)}s")
                return
        except (httpx.ConnectError, httpx.ReadTimeout, httpx.ReadError, httpx.RemoteProtocolError):
            pass
        time.sleep(3)
    print(f"[DOCKER] ERROR: Server not healthy after {timeout}s")
    # Show container logs for debugging
    logs = _run(["docker", "compose", "logs", "--tail", "40", "scraper"])
    print(logs.stdout[-2000:] if logs.stdout else logs.stderr[-2000:])
    sys.exit(1)


# ---------------------------------------------------------------------------
# Audit flow
# ---------------------------------------------------------------------------

def run_audits():
    """Create audit docs, trigger API, poll for results, print report."""
    client = MongoClient(MONGODB_URI)
    db = client[DB_NAME]

    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json",
    }

    audit_ids: list[tuple[str, str]] = []  # (audit_id, business_name)

    # ── Step 1: Insert pending docs & trigger audits ──────────────────────
    print(f"\n{'=' * 80}")
    print("STEP 1: Creating audit documents and triggering audits")
    print("=" * 80)

    for biz in BUSINESSES:
        audit_id = ObjectId()
        user_id = ObjectId()
        business_id = ObjectId()

        audit_doc = {
            "_id": audit_id,
            "businessId": str(business_id),
            "userId": str(user_id),
            "businessName": biz["businessName"],
            "status": "pending",
            "schemaVersion": 2,
            "createdAt": datetime.now(timezone.utc).isoformat(),
            "completedAt": None,
            "error": None,
            "geoScore": None,
            "results": {},
        }
        db.audits.insert_one(audit_doc)

        request_body = {
            "auditId": str(audit_id),
            "businessId": str(business_id),
            "userId": str(user_id),
            **biz,
        }

        resp = httpx.post(f"{SERVER_URL}/audit", json=request_body, headers=headers, timeout=30)
        result = resp.json()

        status_icon = "OK" if resp.status_code == 202 else "FAIL"
        print(f"  [{status_icon}] {biz['businessName']:20s} -> audit {audit_id} ({resp.status_code})")
        if resp.status_code != 202:
            print(f"         Response: {result}")
        audit_ids.append((str(audit_id), biz["businessName"]))

    # ── Step 2: Poll for completion ───────────────────────────────────────
    print(f"\n{'=' * 80}")
    print("STEP 2: Waiting for audits to complete...")
    print(f"        (polling every {POLL_INTERVAL}s, timeout {MAX_WAIT}s)")
    print("=" * 80)

    pending = {aid: name for aid, name in audit_ids}
    start_time = time.time()

    while pending and (time.time() - start_time) < MAX_WAIT:
        time.sleep(POLL_INTERVAL)
        elapsed = int(time.time() - start_time)

        for aid in list(pending.keys()):
            doc = db.audits.find_one({"_id": ObjectId(aid)}, {"status": 1, "error": 1})
            if doc and doc["status"] in ("review_pending", "completed", "failed", "rejected"):
                status = doc["status"]
                err = doc.get("error", "")
                icon = "OK" if status in ("review_pending", "completed") else "FAIL"
                suffix = f" — {err[:80]}" if err else ""
                print(f"  [{icon}] {pending[aid]:20s} -> {status}{suffix}  ({elapsed}s)")
                del pending[aid]

        if pending:
            names = ", ".join(pending.values())
            print(f"  ... still waiting ({elapsed}s): {names}")

    if pending:
        print(f"\n  TIMEOUT: {len(pending)} audits did not complete within {MAX_WAIT}s")
        for aid, name in pending.items():
            print(f"    - {name} ({aid})")

    # ── Step 3: Full report ───────────────────────────────────────────────
    print(f"\n{'=' * 80}")
    print("STEP 3: FULL AUDIT RESULTS REPORT")
    print("=" * 80)

    for aid, name in audit_ids:
        doc = db.audits.find_one({"_id": ObjectId(aid)})
        if not doc:
            print(f"\n--- {name} --- NOT FOUND IN DB")
            continue

        status = doc.get("status", "unknown")
        geo_score = doc.get("geoScore")
        error = doc.get("error")
        results = doc.get("results") or {}

        print(f"\n{'─' * 80}")
        print(f"  BUSINESS: {name}")
        print(f"  URL:      {next(b['businessUrl'] for b in BUSINESSES if b['businessName'] == name)}")
        print(f"  Status:   {status}")
        print(f"  Audit ID: {aid}")

        if error:
            print(f"  ERROR:    {error}")

        if status == "failed":
            continue

        print(f"\n  Scores:")
        print(f"    GEO Score:          {geo_score}")
        print(f"    Audit Engine Score: {results.get('auditEngineScore')}")
        print(f"    HTML Scanner Score: {results.get('htmlScannerScore')}")

        # Engines
        engines_used = results.get("enginesUsed", [])
        engines_ok = results.get("enginesSucceeded", [])
        print(f"\n  Engines:")
        print(f"    Used:       {engines_used}")
        print(f"    Succeeded:  {engines_ok}")
        print(f"    Prompts:    {results.get('totalPromptsProcessed')}")
        print(f"    Responses:  {results.get('totalResponsesReceived')}")
        proc_time = results.get("processingTimeMs", 0)
        print(f"    Time:       {proc_time / 1000:.1f}s")

        # Category scores
        cat_scores = results.get("categoryScores", {})
        if cat_scores:
            print(f"\n  Category Scores:")
            for cat, data in sorted(cat_scores.items()):
                if isinstance(data, dict):
                    score = data.get("score", 0)
                    mention = data.get("avgMentionRate", 0)
                    count = data.get("promptCount", 0)
                    print(f"    {cat:15s}  score={score:5.1f}  mentionRate={mention:.2f}  prompts={count}")

        # Level scores
        level_scores = results.get("levelScores", {})
        if level_scores:
            print(f"\n  Level Scores (1=broad -> 5=specific):")
            for lvl in sorted(level_scores.keys()):
                data = level_scores[lvl]
                if isinstance(data, dict):
                    score = data.get("score", 0)
                    mention = data.get("avgMentionRate", 0)
                    print(f"    Level {lvl}:  score={score:5.1f}  mentionRate={mention:.2f}")

        # Discoverability
        disco = results.get("discoverabilityThreshold", {})
        if disco and isinstance(disco, dict):
            print(f"\n  Discoverability: level={disco.get('level')}  {disco.get('description', '')}")

        # Competitor results
        comp_results = results.get("competitorResults", [])
        if comp_results:
            print(f"\n  Competitors:")
            for comp in comp_results:
                if isinstance(comp, dict):
                    cname = comp.get("competitorName", comp.get("competitorUrl", "?"))
                    cscore = comp.get("auditEngineScore", 0)
                    cmention = comp.get("mentionRate", 0)
                    print(f"    {cname:30s}  engineScore={cscore:5.1f}  mentionRate={cmention:.2f}")

        # HTML scan highlights
        html_scan = results.get("htmlScan", {})
        if html_scan and isinstance(html_scan, dict):
            print(f"\n  HTML Scan:")
            bot_access = html_scan.get("aiBotAccessibility", {})
            if isinstance(bot_access, dict):
                print(f"    AI Bot Accessibility: {json.dumps(bot_access, indent=6)[:300]}")
            robots = html_scan.get("robotsTxtAnalysis", {})
            if isinstance(robots, dict) and robots:
                print(f"    Robots.txt:           {json.dumps(robots, indent=6)[:300]}")

        # Sample prompt results (first 3)
        prompt_results = results.get("promptResults", [])
        if prompt_results:
            print(f"\n  Sample Prompts (first 3 of {len(prompt_results)}):")
            for pr in prompt_results[:3]:
                if isinstance(pr, dict):
                    q = pr.get("question", "")[:100]
                    ps = pr.get("promptScore", 0)
                    mr = pr.get("mentionRate", 0)
                    print(f"    Q: {q}")
                    print(f"       promptScore={ps:.2f}  mentionRate={mr:.2f}")
                    engines_data = pr.get("engines", {})
                    for eng_name, eng_data in engines_data.items():
                        if isinstance(eng_data, dict):
                            mentioned = eng_data.get("mentioned", False)
                            quality = eng_data.get("quality", 0)
                            snippet = (eng_data.get("rawResponse", "") or "")[:120]
                            print(f"       [{eng_name}] mentioned={mentioned} quality={quality} -> {snippet}...")

    # ── Summary ───────────────────────────────────────────────────────────
    print(f"\n{'=' * 80}")
    print("SUMMARY")
    print("=" * 80)

    all_docs = []
    for aid, name in audit_ids:
        doc = db.audits.find_one({"_id": ObjectId(aid)})
        if doc:
            all_docs.append((name, doc))

    succeeded = [(n, d) for n, d in all_docs if d.get("status") in ("review_pending", "completed")]
    failed = [(n, d) for n, d in all_docs if d.get("status") == "failed"]
    other = [(n, d) for n, d in all_docs if d.get("status") not in ("review_pending", "completed", "failed")]

    print(f"  Total businesses tested: {len(BUSINESSES)}")
    print(f"  Succeeded:               {len(succeeded)}")
    print(f"  Failed:                  {len(failed)}")
    print(f"  Other/pending:           {len(other)}")

    if succeeded:
        print(f"\n  Score Ranking:")
        ranked = sorted(succeeded, key=lambda x: x[1].get("geoScore") or 0, reverse=True)
        for i, (name, doc) in enumerate(ranked, 1):
            geo = doc.get("geoScore", 0)
            eng = (doc.get("results") or {}).get("auditEngineScore", 0)
            html = (doc.get("results") or {}).get("htmlScannerScore", 0)
            print(f"    {i}. {name:20s}  GEO={geo:5.1f}  engine={eng:5.1f}  html={html:5.1f}")

    if failed:
        print(f"\n  Failed Audits:")
        for name, doc in failed:
            print(f"    - {name}: {doc.get('error', 'unknown error')[:200]}")

    print(f"\n{'=' * 80}")
    print("TEST COMPLETE — audit data persisted in MongoDB")
    print("=" * 80)

    client.close()


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(description="Run real-world full audit tests")
    parser.add_argument(
        "--skip-docker", action="store_true",
        help="Skip Docker build/start (use if container is already running)",
    )
    args = parser.parse_args()

    print("=" * 80)
    print("AISEO REAL-WORLD AUDIT TEST")
    print(f"Businesses: {', '.join(b['businessName'] for b in BUSINESSES)}")
    print(f"Server:     {SERVER_URL}")
    print("=" * 80)

    if not args.skip_docker:
        start_docker()
        wait_for_healthy(timeout=120)
    else:
        print("[DOCKER] Skipped — assuming container is already running")
        # Quick health check anyway
        try:
            resp = httpx.get(f"{SERVER_URL}/health", timeout=5)
            if resp.status_code != 200:
                print(f"[WARN] Server returned {resp.status_code} on /health")
        except Exception as e:
            print(f"[ERROR] Cannot reach server at {SERVER_URL}: {e}")
            sys.exit(1)

    run_audits()


if __name__ == "__main__":
    main()
