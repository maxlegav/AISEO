#!/usr/bin/env python3
"""
3x2 Audit Test — runs 6 audits (2 per business, 3 businesses) to validate
the full audit pipeline AND test score consistency across runs.

Fixes the bug in test_real_audit.py: properly calls /approve-prompts so
audits don't get stuck at awaiting_prompt_approval.

Flow per audit:
  1. Insert audit doc (status: "pending") in MongoDB
  2. POST /audit → triggers Phase 1 (prompt generation)
  3. Poll until status = "awaiting_prompt_approval" (~30-60s)
  4. POST /audit/{id}/approve-prompts → triggers Phase 2
  5. Poll until status = "review_pending" or "failed" (~5-10min)

Usage:
    cd /path/to/AISEO/server
    python -m tests.test_3x2_audits --skip-docker   # if container already running
    python -m tests.test_3x2_audits                  # builds + starts Docker first
"""

import argparse
import json
import subprocess
import sys
import time
import traceback

import httpx
from bson import ObjectId
from pymongo import MongoClient
from datetime import datetime, timezone

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

SERVER_URL = "http://localhost:8080"
API_KEY = "p6jgXU4DDgWKt3Mp5WEtIZtoeS9m+ZKncQpCNW6ShBg"
MONGODB_URI = "mongodb+srv://automateitcontact:q1ziUY6sTrKPUexf@automateit.ljmnevl.mongodb.net/showyourbrand"
DB_NAME = "showyourbrand"

# Phase 1 polling (prompt generation): fast, ~30-60s
PHASE1_INTERVAL = 5     # seconds between polls
PHASE1_MAX_WAIT = 300   # 5 minutes max

# Phase 2 polling (AI execution + scoring): slower, ~5-10min
PHASE2_INTERVAL = 15    # seconds between polls
PHASE2_MAX_WAIT = 900   # 15 minutes max

REPO_ROOT = subprocess.check_output(
    ["git", "rev-parse", "--show-toplevel"], text=True
).strip()

# ---------------------------------------------------------------------------
# 3 Businesses — each gets 2 runs
# ---------------------------------------------------------------------------

BUSINESSES = [
    {
        "businessName": "Shigure",
        "businessUrl": "https://www.shigure.fr",
        "businessType": "coffee-shop",
        "category": "specialty coffee shop",
        "description": "Shigure is a specialty coffee shop in Paris inspired by Japanese aesthetics. It offers single-origin pour-over coffee, matcha, and homemade pastries in a minimalist setting.",
        "language": "fr",
        "city": "Paris",
        "country": "France",
        "localityTier": "hyper_local",
        "targetKeywords": ["café de spécialité Paris", "coffee shop japonais", "matcha Paris"],
        "competitorNames": ["Coutume", "Belleville Brûlerie", "Terres de Café"],
        "competitorUrls": ["https://coutumecafe.com", "https://bellevillebrulerie.com", "https://terresdecafe.com"],
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
        "competitorUrls": ["https://bubble.io", "https://retool.com", "https://softr.io"],
    },
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
        "competitorUrls": ["https://www.lefigaro.fr", "https://www.liberation.fr", "https://www.lesechos.fr"],
        "subUrls": ["https://www.lemonde.fr/international/", "https://www.lemonde.fr/politique/"],
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
    """Poll /health until the server is ready (includes auth header)."""
    headers = {"Authorization": f"Bearer {API_KEY}"}
    start = time.time()
    while time.time() - start < timeout:
        try:
            resp = httpx.get(f"{SERVER_URL}/health", headers=headers, timeout=5)
            if resp.status_code == 200 and resp.json().get("data", {}).get("status") == "healthy":
                print(f"[DOCKER] Server healthy after {int(time.time() - start)}s")
                return
        except (httpx.ConnectError, httpx.ReadTimeout, httpx.ReadError, httpx.RemoteProtocolError):
            pass
        time.sleep(3)
    print(f"[DOCKER] ERROR: Server not healthy after {timeout}s")
    logs = _run(["docker", "compose", "logs", "--tail", "40", "scraper"])
    print(logs.stdout[-2000:] if logs.stdout else logs.stderr[-2000:])
    sys.exit(1)


# ---------------------------------------------------------------------------
# User lookup
# ---------------------------------------------------------------------------

def find_automateit_user(db) -> ObjectId:
    """Find the automateit user in MongoDB. Exit if not found."""
    user = db.users.find_one({"email": {"$regex": "automateit", "$options": "i"}})
    if not user:
        user = db.users.find_one({"name": {"$regex": "automateit", "$options": "i"}})
    if not user:
        print("[ERROR] Could not find 'automateit' user. Available users:")
        for u in db.users.find({}, {"email": 1, "name": 1}).limit(10):
            print(f"  - {u.get('email', '?')} ({u.get('name', '?')})")
        sys.exit(1)
    print(f"[USER] Found: {user.get('email')} (id={user['_id']})")
    return user["_id"]


# ---------------------------------------------------------------------------
# Polling helper
# ---------------------------------------------------------------------------

def _poll_for_status(
    db,
    audit_id: str,
    target_statuses: set[str],
    fail_statuses: set[str],
    max_wait: int,
    interval: int,
    label: str,
) -> tuple[str, float]:
    """Poll MongoDB until audit reaches a target or fail status.

    Returns (final_status, elapsed_seconds).
    Raises TimeoutError if max_wait exceeded.
    """
    start = time.time()
    last_status = "?"

    while (time.time() - start) < max_wait:
        time.sleep(interval)
        elapsed = time.time() - start

        doc = db.audits.find_one({"_id": ObjectId(audit_id)}, {"status": 1, "error": 1})
        if not doc:
            raise RuntimeError(f"Audit {audit_id} vanished from DB during {label}")

        status = doc["status"]
        if status != last_status:
            err_msg = f" — {doc.get('error', '')[:80]}" if doc.get("error") else ""
            print(f"    [{label}] status={status}{err_msg}  ({elapsed:.0f}s)")
            last_status = status

        if status in target_statuses:
            return status, elapsed
        if status in fail_statuses:
            return status, elapsed

    raise TimeoutError(f"[{label}] Timed out after {max_wait}s (last status: {last_status})")


# ---------------------------------------------------------------------------
# Single audit run
# ---------------------------------------------------------------------------

def run_single_audit(
    db,
    headers: dict,
    business: dict,
    user_id: ObjectId,
    business_id: ObjectId,
    run_number: int,
) -> dict:
    """Run one full audit (Phase 1 + approve + Phase 2). Returns result dict."""
    audit_id = ObjectId()
    biz_name = business["businessName"]
    label = f"{biz_name} #{run_number}"
    run_start = time.time()

    print(f"\n  {'─' * 70}")
    print(f"  {label} — audit_id={audit_id}")

    # 1. Insert pending audit doc
    audit_doc = {
        "_id": audit_id,
        "businessId": business_id,
        "userId": user_id,
        "businessName": biz_name,
        "status": "pending",
        "schemaVersion": 2,
        "createdAt": datetime.now(timezone.utc).isoformat(),
        "completedAt": None,
        "error": None,
        "geoScore": None,
        "results": {},
    }
    db.audits.insert_one(audit_doc)

    # 2. POST /audit to trigger Phase 1
    request_body = {
        "auditId": str(audit_id),
        "businessId": str(business_id),
        "userId": str(user_id),
        **business,
    }
    resp = httpx.post(f"{SERVER_URL}/audit", json=request_body, headers=headers, timeout=30)
    if resp.status_code != 202:
        error_msg = f"POST /audit returned {resp.status_code}: {resp.text[:200]}"
        print(f"    [FAIL] {error_msg}")
        return {"audit_id": str(audit_id), "business": biz_name, "run": run_number,
                "status": "api_error", "error": error_msg, "elapsed": 0}

    print(f"    [OK] Audit triggered (202). Polling for Phase 1 completion...")

    # 3. Poll for awaiting_prompt_approval (Phase 1 done)
    try:
        status, p1_elapsed = _poll_for_status(
            db, str(audit_id),
            target_statuses={"awaiting_prompt_approval"},
            fail_statuses={"failed"},
            max_wait=PHASE1_MAX_WAIT,
            interval=PHASE1_INTERVAL,
            label=f"{label} P1",
        )
    except TimeoutError as e:
        print(f"    [TIMEOUT] {e}")
        return {"audit_id": str(audit_id), "business": biz_name, "run": run_number,
                "status": "phase1_timeout", "error": str(e), "elapsed": time.time() - run_start}

    if status == "failed":
        doc = db.audits.find_one({"_id": audit_id}, {"error": 1})
        error = (doc or {}).get("error", "unknown")
        return {"audit_id": str(audit_id), "business": biz_name, "run": run_number,
                "status": "failed", "error": error, "elapsed": time.time() - run_start}

    print(f"    [OK] Phase 1 done in {p1_elapsed:.0f}s. Approving prompts...")

    # 4. POST /audit/{id}/approve-prompts to trigger Phase 2
    approve_resp = httpx.post(
        f"{SERVER_URL}/audit/{audit_id}/approve-prompts",
        headers=headers,
        timeout=30,
    )
    if approve_resp.status_code != 202:
        error_msg = f"POST /approve-prompts returned {approve_resp.status_code}: {approve_resp.text[:200]}"
        print(f"    [FAIL] {error_msg}")
        return {"audit_id": str(audit_id), "business": biz_name, "run": run_number,
                "status": "approve_error", "error": error_msg, "elapsed": time.time() - run_start}

    print(f"    [OK] Prompts approved (202). Polling for Phase 2 completion...")

    # 5. Poll for review_pending / completed (Phase 2 done)
    try:
        status, p2_elapsed = _poll_for_status(
            db, str(audit_id),
            target_statuses={"review_pending", "completed"},
            fail_statuses={"failed"},
            max_wait=PHASE2_MAX_WAIT,
            interval=PHASE2_INTERVAL,
            label=f"{label} P2",
        )
    except TimeoutError as e:
        print(f"    [TIMEOUT] {e}")
        return {"audit_id": str(audit_id), "business": biz_name, "run": run_number,
                "status": "phase2_timeout", "error": str(e), "elapsed": time.time() - run_start}

    total_elapsed = time.time() - run_start

    # 6. Read final results
    doc = db.audits.find_one({"_id": audit_id})
    results = doc.get("results", {}) if doc else {}

    result = {
        "audit_id": str(audit_id),
        "business": biz_name,
        "run": run_number,
        "status": status,
        "error": (doc or {}).get("error"),
        "elapsed": total_elapsed,
        "geoScore": (doc or {}).get("geoScore"),
        "auditEngineScore": results.get("auditEngineScore"),
        "htmlScannerScore": results.get("htmlScannerScore"),
        "citationVisibilityScore": results.get("citationVisibilityScore"),
        "enginesUsed": results.get("enginesUsed", []),
        "enginesSucceeded": results.get("enginesSucceeded", []),
        "totalPrompts": results.get("totalPromptsProcessed", 0),
        "totalResponses": results.get("totalResponsesReceived", 0),
        "processingTimeMs": results.get("processingTimeMs", 0),
    }

    icon = "OK" if status in ("review_pending", "completed") else "FAIL"
    print(f"    [{icon}] {label} finished: status={status}, GEO={result['geoScore']}, "
          f"engine={result['auditEngineScore']}, html={result['htmlScannerScore']}, "
          f"time={total_elapsed:.0f}s")

    return result


# ---------------------------------------------------------------------------
# Comparison report
# ---------------------------------------------------------------------------

def print_comparison_report(results: list[dict], total_elapsed: float):
    """Print summary table, consistency analysis, and cross-business ranking."""

    print(f"\n{'=' * 80}")
    print("COMPARISON REPORT")
    print(f"Total runtime: {total_elapsed / 60:.1f} minutes")
    print("=" * 80)

    # 1. Summary table
    print(f"\n{'─' * 80}")
    print("  Summary Table")
    print(f"{'─' * 80}")
    print(f"  {'Business':<15} {'Run':<5} {'Status':<20} {'GEO':>6} {'Engine':>8} {'HTML':>6} {'Time':>7}")
    print(f"  {'─'*15} {'─'*5} {'─'*20} {'─'*6} {'─'*8} {'─'*6} {'─'*7}")

    for r in results:
        geo = f"{r['geoScore']:.1f}" if r.get("geoScore") is not None else "N/A"
        eng = f"{r['auditEngineScore']:.1f}" if r.get("auditEngineScore") is not None else "N/A"
        html = f"{r['htmlScannerScore']:.1f}" if r.get("htmlScannerScore") is not None else "N/A"
        elapsed = f"{r['elapsed']:.0f}s"
        print(f"  {r['business']:<15} {r['run']:<5} {r['status']:<20} {geo:>6} {eng:>8} {html:>6} {elapsed:>7}")

    # 2. Consistency analysis (run 1 vs run 2 per business)
    print(f"\n{'─' * 80}")
    print("  Consistency Analysis (Run 1 vs Run 2)")
    print(f"{'─' * 80}")

    businesses = {}
    for r in results:
        businesses.setdefault(r["business"], []).append(r)

    for biz_name, runs in businesses.items():
        if len(runs) < 2:
            print(f"\n  {biz_name}: Only {len(runs)} run(s) — skipping comparison")
            continue

        r1, r2 = runs[0], runs[1]
        print(f"\n  {biz_name}:")

        for metric in ["geoScore", "auditEngineScore", "htmlScannerScore"]:
            v1 = r1.get(metric)
            v2 = r2.get(metric)
            if v1 is not None and v2 is not None:
                delta = abs(v2 - v1)
                avg = (v1 + v2) / 2 if (v1 + v2) != 0 else 1
                pct = (delta / avg) * 100
                print(f"    {metric:<25s}  run1={v1:6.1f}  run2={v2:6.1f}  "
                      f"delta={delta:5.1f}  ({pct:.1f}% difference)")
            else:
                print(f"    {metric:<25s}  run1={v1}  run2={v2}  (incomplete)")

    # 3. Cross-business ranking (average of 2 runs)
    print(f"\n{'─' * 80}")
    print("  Cross-Business Ranking (average GEO score across runs)")
    print(f"{'─' * 80}")

    rankings = []
    for biz_name, runs in businesses.items():
        valid = [r for r in runs if r.get("geoScore") is not None]
        if valid:
            avg_geo = sum(r["geoScore"] for r in valid) / len(valid)
            avg_eng = sum(r.get("auditEngineScore", 0) or 0 for r in valid) / len(valid)
            avg_html = sum(r.get("htmlScannerScore", 0) or 0 for r in valid) / len(valid)
            rankings.append((biz_name, avg_geo, avg_eng, avg_html, len(valid)))

    rankings.sort(key=lambda x: x[1], reverse=True)

    for i, (name, geo, eng, html, n) in enumerate(rankings, 1):
        print(f"    {i}. {name:<15s}  avgGEO={geo:5.1f}  avgEngine={eng:5.1f}  "
              f"avgHTML={html:5.1f}  (from {n} runs)")

    if not rankings:
        print("    No successful audits to rank.")

    # 4. Success / failure summary
    succeeded = [r for r in results if r["status"] in ("review_pending", "completed")]
    failed = [r for r in results if r["status"] not in ("review_pending", "completed")]

    print(f"\n{'─' * 80}")
    print(f"  Totals: {len(succeeded)}/6 succeeded, {len(failed)}/6 failed/timed out")
    if failed:
        for r in failed:
            print(f"    - {r['business']} #{r['run']}: {r['status']} — {r.get('error', '')[:100]}")
    print(f"{'─' * 80}")


# ---------------------------------------------------------------------------
# Orchestrator
# ---------------------------------------------------------------------------

def run_all_audits():
    """Run 6 audits sequentially (2 per business) and print comparison report."""
    client = MongoClient(MONGODB_URI)
    db = client[DB_NAME]

    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json",
    }

    # Find the automateit user
    user_id = find_automateit_user(db)

    results: list[dict] = []
    total_start = time.time()

    print(f"\n{'=' * 80}")
    print(f"RUNNING 6 AUDITS (3 businesses x 2 runs each)")
    print("=" * 80)

    for biz in BUSINESSES:
        # Same businessId for both runs of this business
        business_id = ObjectId()
        biz_name = biz["businessName"]

        for run_number in range(1, 3):
            print(f"\n{'=' * 60}")
            print(f"  >>> {biz_name} — Run {run_number}/2")
            print(f"{'=' * 60}")

            try:
                result = run_single_audit(db, headers, biz, user_id, business_id, run_number)
                results.append(result)
            except Exception as e:
                print(f"    [ERROR] Unexpected exception: {e}")
                traceback.print_exc()
                results.append({
                    "audit_id": "?",
                    "business": biz_name,
                    "run": run_number,
                    "status": "exception",
                    "error": str(e),
                    "elapsed": 0,
                    "geoScore": None,
                    "auditEngineScore": None,
                    "htmlScannerScore": None,
                })

    total_elapsed = time.time() - total_start

    # Print comparison report
    print_comparison_report(results, total_elapsed)

    print(f"\n{'=' * 80}")
    print("TEST COMPLETE — all audit data persisted in MongoDB")
    print("=" * 80)

    client.close()


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(description="3x2 audit test: 6 audits, score consistency check")
    parser.add_argument(
        "--skip-docker", action="store_true",
        help="Skip Docker build/start (use if container is already running)",
    )
    args = parser.parse_args()

    print("=" * 80)
    print("AISEO 3x2 AUDIT CONSISTENCY TEST")
    print(f"Businesses: {', '.join(b['businessName'] for b in BUSINESSES)}")
    print(f"Runs per business: 2")
    print(f"Total audits: 6")
    print(f"Server: {SERVER_URL}")
    print("=" * 80)

    if not args.skip_docker:
        start_docker()
        wait_for_healthy(timeout=120)
    else:
        print("[DOCKER] Skipped — assuming container is already running")
        headers = {"Authorization": f"Bearer {API_KEY}"}
        try:
            resp = httpx.get(f"{SERVER_URL}/health", headers=headers, timeout=5)
            if resp.status_code != 200:
                print(f"[WARN] Server returned {resp.status_code} on /health")
        except Exception as e:
            print(f"[ERROR] Cannot reach server at {SERVER_URL}: {e}")
            sys.exit(1)

    run_all_audits()


if __name__ == "__main__":
    main()
