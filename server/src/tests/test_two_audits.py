"""
End-to-end test: Shigure Café (hyper_local) + Base44 (global).

Validates all 4 phases:
  1. Locality tier classification
  2. Location-aware queries
  3. Human-sounding prompts
  4. Slim MongoDB schema (v2)

Usage:
  PROMPT_COUNT=20 docker compose up --build -d
  pip install motor httpx python-dotenv
  cd server/src && python3 tests/test_two_audits.py
"""

import asyncio
import os
import random
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

import httpx
from bson import ObjectId
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

# ---------------------------------------------------------------------------
# Load env from server/.env
# ---------------------------------------------------------------------------
ENV_PATH = Path(__file__).resolve().parents[2] / ".env"  # server/.env
load_dotenv(ENV_PATH)

MONGODB_URI = os.getenv("MONGODB_URI")
API_KEY = os.getenv("PROCESSING_SERVICE_API_KEY")
BASE_URL = os.getenv("TEST_SERVER_URL", "http://localhost:8080")
PROMPT_COUNT = int(os.getenv("PROMPT_COUNT", "20"))

POLL_INTERVAL = 30  # seconds
TIMEOUT = 15 * 60   # 15 minutes

if not MONGODB_URI:
    sys.exit("MONGODB_URI not set in server/.env")
if not API_KEY:
    sys.exit("PROCESSING_SERVICE_API_KEY not set in server/.env")


# ---------------------------------------------------------------------------
# Test payloads
# ---------------------------------------------------------------------------

def _make_shigure_payload(audit_id: str) -> dict:
    return {
        "auditId": audit_id,
        "businessId": "000000000000000000000001",
        "userId": "000000000000000000000099",
        "businessName": "Shigure Café",
        "businessUrl": "https://shigure.fr",
        "businessType": "coffee-shop",
        "category": "specialty matcha and dessert café",
        "description": (
            "Shigure Café is a Vietnamese-owned matcha and dessert specialty café "
            "in Paris's 9th arrondissement. Known for house-made moffles (mochi waffles), "
            "premium matcha drinks, and a no-laptop policy that preserves a quality-focused "
            "atmosphere. Tagline: Your Daily Ritual, Elevated."
        ),
        "language": "fr",
        "city": "Paris",
        "neighborhood": "Saint-Georges / South Pigalle",
        "street": "27 Rue Clauzel",
        "country": "France",
        "region": "Île-de-France",
        "subUrls": [],
        "competitorUrls": ["https://umamiparis.com", "https://maisonkitsune.com"],
        "competitorNames": ["Umami Matcha Café", "Café Kitsuné"],
        "targetKeywords": ["matcha paris", "coffee shop paris 9", "moffle paris", "café matcha paris"],
        "uniqueSellingPoints": ["House-made everything", "Premium matcha", "Signature moffles", "No-laptop policy"],
        "targetAudience": "Young professionals, matcha enthusiasts, tourists, Instagram-savvy Parisians",
        "priceRange": "mid-to-premium",
        "servicesOrProducts": ["matcha lattes", "moffles", "specialty coffee", "house-made desserts", "iced shiso crème latte"],
        "socialMediaUrls": ["https://instagram.com/shigure.cafe", "https://tiktok.com/@shigure.cafe"],
    }


def _make_base44_payload(audit_id: str) -> dict:
    return {
        "auditId": audit_id,
        "businessId": "000000000000000000000002",
        "userId": "000000000000000000000099",
        "businessName": "Base44",
        "businessUrl": "https://base44.com",
        "businessType": "saas",
        "category": "AI-powered no-code app builder",
        "description": (
            "Base44 is an AI-powered no-code platform that lets users build full web "
            "and mobile apps using natural language prompts. It auto-generates UI, database, "
            "auth, and hosting. Founded in Feb 2025 by Maor Shlomo, acquired by Wix for $80M "
            "in June 2025. 300K+ users."
        ),
        "language": "en",
        "country": "Israel",
        "subUrls": ["https://base44.com/pricing", "https://base44.com/features"],
        "competitorUrls": ["https://lovable.dev", "https://bolt.new"],
        "competitorNames": ["Lovable", "Bolt.new"],
        "targetKeywords": ["AI app builder", "no-code platform", "vibe coding", "build app with AI"],
        "uniqueSellingPoints": [
            "Natural language to full app",
            "All-in-one (DB, auth, hosting)",
            "Solo-founder to $80M exit",
            "300K users in weeks",
        ],
        "targetAudience": "Non-technical founders, indie hackers, small teams, enterprise product teams",
        "priceRange": "freemium to premium",
        "servicesOrProducts": ["AI app builder", "template library", "custom domains", "GitHub integration", "analytics"],
        "socialMediaUrls": ["https://instagram.com/base44.dev", "https://twitter.com/base_44"],
        "yearFounded": 2025,
    }


# ---------------------------------------------------------------------------
# Validation helpers
# ---------------------------------------------------------------------------

class Report:
    """Collects PASS/FAIL assertions and prints a summary."""

    def __init__(self):
        self.checks: list[tuple[str, bool, str]] = []  # (label, passed, detail)

    def check(self, label: str, condition: bool, detail: str = ""):
        status = "PASS" if condition else "FAIL"
        self.checks.append((label, condition, detail))
        icon = "✅" if condition else "❌"
        print(f"  {icon} {label}" + (f"  — {detail}" if detail else ""))

    def summary(self):
        passed = sum(1 for _, ok, _ in self.checks if ok)
        total = len(self.checks)
        print(f"\n{'='*60}")
        if passed == total:
            print(f"  ALL {total} CHECKS PASSED")
        else:
            print(f"  {passed}/{total} PASSED — {total - passed} FAILED")
        print(f"{'='*60}")
        return passed == total


def _validate_slim_schema(doc: dict, report: Report, name: str):
    """Phase 4 — Slim MongoDB assertions."""
    report.check(
        f"[{name}] schemaVersion == 2",
        doc.get("schemaVersion") == 2,
        f"got {doc.get('schemaVersion')}",
    )
    # Top-level fields must exist
    for field in ("businessName", "geoScore", "status", "businessId", "userId"):
        report.check(
            f"[{name}] top-level '{field}' exists",
            field in doc,
        )
    # geoScore is a number
    report.check(
        f"[{name}] geoScore is a number",
        isinstance(doc.get("geoScore"), (int, float)),
        f"got {type(doc.get('geoScore')).__name__}: {doc.get('geoScore')}",
    )
    # results blob exists and has expected sub-fields
    results = doc.get("results", {})
    report.check(f"[{name}] 'results' blob exists", isinstance(results, dict))
    for sub in ("businessSnapshot", "generatedPrompts", "promptResults", "categoryScores"):
        report.check(
            f"[{name}] results.{sub} exists",
            sub in results,
        )
    # These should NOT be at top level
    for forbidden in ("generatedPrompts", "promptResults", "categoryScores", "levelScores"):
        report.check(
            f"[{name}] no top-level '{forbidden}'",
            forbidden not in doc,
            "leaked outside results blob" if forbidden in doc else "",
        )


def _validate_prompts_quality(doc: dict, report: Report, name: str, expected_tier: str):
    """Phase 3 — Human-sounding prompts + geo rules."""
    results = doc.get("results", {})
    prompts = results.get("generatedPrompts", [])
    per_level = PROMPT_COUNT // 5

    report.check(
        f"[{name}] has {PROMPT_COUNT} generated prompts",
        len(prompts) == PROMPT_COUNT,
        f"got {len(prompts)}",
    )

    # Spot-check: 5 random prompts should not start with "What are the best"
    sample = random.sample(prompts, min(5, len(prompts)))
    robotic_count = sum(
        1 for p in sample
        if p.get("question", "").lower().startswith("what are the best")
    )
    report.check(
        f"[{name}] spot-check: no robotic 'What are the best...' openers",
        robotic_count == 0,
        f"{robotic_count}/5 sampled prompts were robotic",
    )

    # Geo rules per tier
    level_1_2 = [p for p in prompts if p.get("level") in (1, 2)]

    if expected_tier == "hyper_local":
        # Should reference neighborhoods/arrondissements, not just "France"
        geo_terms = ["paris", "pigalle", "saint-georges", "9e", "9ème", "clauzel", "arrondissement"]
        has_local = sum(
            1 for p in level_1_2
            if any(t in p.get("question", "").lower() for t in geo_terms)
        )
        report.check(
            f"[{name}] Level 1-2 prompts reference local geography",
            has_local >= len(level_1_2) * 0.3,
            f"{has_local}/{len(level_1_2)} mention local geo terms (need ≥30%)",
        )
    elif expected_tier == "global":
        # Should NOT have forced geographic terms
        geo_forced = ["in israel", "in france", "in paris"]
        forced_count = sum(
            1 for p in level_1_2
            if any(t in p.get("question", "").lower() for t in geo_forced)
        )
        report.check(
            f"[{name}] Level 1-3 prompts have no forced geography",
            forced_count == 0,
            f"{forced_count}/{len(level_1_2)} had forced geo terms",
        )


MIN_ENGINES = int(os.getenv("MIN_ENGINES_REQUIRED", "2"))


def _validate_engines(doc: dict, report: Report, name: str):
    """Check prompt results came from at least MIN_ENGINES engines."""
    results = doc.get("results", {})
    engines_succeeded = results.get("enginesSucceeded", [])
    report.check(
        f"[{name}] at least {MIN_ENGINES} engine(s) succeeded",
        len(engines_succeeded) >= MIN_ENGINES,
        f"engines: {engines_succeeded}",
    )


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

async def main():
    print(f"Connecting to MongoDB...")
    client = AsyncIOMotorClient(MONGODB_URI)
    db = client.showyourbrand

    # 1. Insert two pending audit docs
    shigure_oid = ObjectId()
    base44_oid = ObjectId()
    now = datetime.now(timezone.utc).isoformat()

    inserts = [
        (shigure_oid, "Shigure Café", "000000000000000000000001", "000000000000000000000099"),
        (base44_oid, "Base44", "000000000000000000000002", "000000000000000000000099"),
    ]
    for oid, bname, bid, uid in inserts:
        await db.audits.insert_one({
            "_id": oid,
            "businessId": bid,
            "userId": uid,
            "status": "pending",
            "businessName": bname,
            "schemaVersion": 2,
            "createdAt": now,
        })
    print(f"Inserted pending docs: shigure={shigure_oid}, base44={base44_oid}")

    # 2. Fire both audits via HTTP
    headers = {"Authorization": f"Bearer {API_KEY}", "Content-Type": "application/json"}
    async with httpx.AsyncClient(timeout=30) as http:
        shigure_payload = _make_shigure_payload(str(shigure_oid))
        base44_payload = _make_base44_payload(str(base44_oid))

        r1 = await http.post(f"{BASE_URL}/audit", json=shigure_payload, headers=headers)
        print(f"Shigure POST /audit → {r1.status_code}: {r1.json()}")

        r2 = await http.post(f"{BASE_URL}/audit", json=base44_payload, headers=headers)
        print(f"Base44  POST /audit → {r2.status_code}: {r2.json()}")

        if r1.status_code != 202 or r2.status_code != 202:
            sys.exit("One or both audit requests were rejected — check server logs")

    # 3. Poll until both complete
    print(f"\nPolling every {POLL_INTERVAL}s (timeout {TIMEOUT // 60}min)...")
    start = time.time()
    done = {"shigure": False, "base44": False}

    while time.time() - start < TIMEOUT:
        for label, oid in [("shigure", shigure_oid), ("base44", base44_oid)]:
            if done[label]:
                continue
            doc = await db.audits.find_one({"_id": oid}, {"status": 1})
            status = doc.get("status") if doc else "missing"
            if status in ("review_pending", "completed", "failed"):
                done[label] = True
                elapsed = int(time.time() - start)
                print(f"  [{label}] reached '{status}' after {elapsed}s")

        if all(done.values()):
            break
        await asyncio.sleep(POLL_INTERVAL)
    else:
        print("TIMEOUT — not all audits finished")

    # 4. Fetch full documents and validate
    print(f"\n{'='*60}")
    print("  VALIDATION REPORT")
    print(f"{'='*60}\n")

    report = Report()

    shigure_doc = await db.audits.find_one({"_id": shigure_oid})
    base44_doc = await db.audits.find_one({"_id": base44_oid})

    # --- General: status ---
    report.check("[Shigure] status == review_pending", shigure_doc.get("status") == "review_pending", f"got '{shigure_doc.get('status')}'")
    report.check("[Base44]  status == review_pending", base44_doc.get("status") == "review_pending", f"got '{base44_doc.get('status')}'")

    # --- Phase 1: Locality Tier ---
    shigure_tier = (shigure_doc.get("results") or {}).get("localityTier")
    base44_tier = (base44_doc.get("results") or {}).get("localityTier")
    report.check("[Shigure] localityTier == hyper_local", shigure_tier == "hyper_local", f"got '{shigure_tier}'")
    report.check("[Base44]  localityTier == global", base44_tier == "global", f"got '{base44_tier}'")

    # --- Phase 3: Prompt quality ---
    _validate_prompts_quality(shigure_doc, report, "Shigure", "hyper_local")
    _validate_prompts_quality(base44_doc, report, "Base44", "global")

    # --- Phase 4: Slim MongoDB ---
    _validate_slim_schema(shigure_doc, report, "Shigure")
    _validate_slim_schema(base44_doc, report, "Base44")

    # --- Engines ---
    _validate_engines(shigure_doc, report, "Shigure")
    _validate_engines(base44_doc, report, "Base44")

    # --- Processing time ---
    for name, doc in [("Shigure", shigure_doc), ("Base44", base44_doc)]:
        ms = (doc.get("results") or {}).get("processingTimeMs", 0)
        report.check(
            f"[{name}] processing time < 15 min",
            ms < 15 * 60 * 1000,
            f"{ms / 1000:.0f}s",
        )

    # Summary
    all_ok = report.summary()

    # Cleanup: remove test docs
    await db.audits.delete_one({"_id": shigure_oid})
    await db.audits.delete_one({"_id": base44_oid})
    print("Cleaned up test documents from MongoDB")

    client.close()
    sys.exit(0 if all_ok else 1)


if __name__ == "__main__":
    asyncio.run(main())
