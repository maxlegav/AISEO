#!/usr/bin/env python3
"""
Full end-to-end audit test — submits multiple businesses through the pipeline
and polls MongoDB until completion, then prints a full report.

Usage:
    python -m tests.test_full_audit
"""

import asyncio
import json
import time
import httpx
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

SERVER_URL = "http://localhost:8080"
API_KEY = "p6jgXU4DDgWKt3Mp5WEtIZtoeS9m+ZKncQpCNW6ShBg"
MONGODB_URI = "mongodb+srv://automateitcontact:q1ziUY6sTrKPUexf@automateit.ljmnevl.mongodb.net/ShowYourBrand"
DB_NAME = "showyourbrand"

POLL_INTERVAL = 10  # seconds between status checks
MAX_WAIT = 900      # 15 minutes max wait per audit

# ---------------------------------------------------------------------------
# Test businesses — diverse types, languages, localities
# ---------------------------------------------------------------------------

BUSINESSES = [
    {
        "businessName": "MaisonCuir",
        "businessUrl": "https://www.maisoncuir.fr",
        "businessType": "e-commerce",
        "category": "artisanal leather shoes",
        "description": "French artisan leather shoe brand specializing in handmade boots and loafers using traditional techniques from Lyon.",
        "language": "fr",
        "city": "Lyon",
        "country": "France",
        "localityTier": "national",
        "targetKeywords": ["chaussures cuir artisanal", "bottes cuir Lyon"],
        "competitorNames": ["Paraboot", "JM Weston"],
    },
    {
        "businessName": "TechPulse",
        "businessUrl": "https://www.techpulse.io",
        "businessType": "saas",
        "category": "project management software",
        "description": "AI-powered project management SaaS for remote teams. Real-time collaboration, sprint planning, and automated reporting.",
        "language": "en",
        "country": "United States",
        "localityTier": "global",
        "targetKeywords": ["project management tool", "AI project management"],
        "competitorNames": ["Asana", "Monday.com", "Linear"],
    },
    {
        "businessName": "Boulangerie Dupont",
        "businessUrl": "https://www.boulangerie-dupont.fr",
        "businessType": "bakery",
        "category": "artisan bakery and pastry",
        "description": "Boulangerie artisanale familiale dans le Marais à Paris. Pain au levain, viennoiseries, pâtisseries françaises traditionnelles depuis 1952.",
        "language": "fr",
        "city": "Paris",
        "neighborhood": "Le Marais",
        "country": "France",
        "localityTier": "hyper_local",
        "targetKeywords": ["boulangerie Marais", "pain artisanal Paris"],
        "competitorNames": ["Poilâne", "Du Pain et des Idées"],
    },
    {
        "businessName": "GreenLeaf Wellness",
        "businessUrl": "https://www.greenleafwellness.co.uk",
        "businessType": "health_wellness",
        "category": "organic supplements and wellness products",
        "description": "UK-based wellness brand offering organic supplements, herbal teas, and natural skincare. Certified B Corp with sustainable sourcing.",
        "language": "en",
        "city": "London",
        "country": "United Kingdom",
        "localityTier": "national",
        "targetKeywords": ["organic supplements UK", "natural wellness products"],
        "competitorNames": ["Holland & Barrett", "Huel"],
    },
    {
        "businessName": "CodeNinja Academy",
        "businessUrl": "https://www.codeninja-academy.com",
        "businessType": "education",
        "category": "online coding bootcamp",
        "description": "Online coding bootcamp offering intensive full-stack web development and data science programs with job placement guarantee.",
        "language": "en",
        "localityTier": "global",
        "country": "United States",
        "targetKeywords": ["coding bootcamp online", "learn to code"],
        "competitorNames": ["Le Wagon", "General Assembly", "Codecademy"],
    },
]


async def main():
    print("=" * 80)
    print("AISEO FULL AUDIT TEST")
    print(f"Testing {len(BUSINESSES)} businesses with local Ollama (gemma3:4b)")
    print(f"Server: {SERVER_URL}")
    print("=" * 80)

    # Connect to MongoDB
    client = AsyncIOMotorClient(MONGODB_URI)
    db = client[DB_NAME]

    # Check server health
    async with httpx.AsyncClient(timeout=10) as http:
        resp = await http.get(f"{SERVER_URL}/health")
        health = resp.json()
        print(f"\nServer health: {health['data']['status']}")
        if health["data"]["status"] != "healthy":
            print("ERROR: Server not healthy, aborting.")
            return

    audit_ids = []
    headers = {"Authorization": f"Bearer {API_KEY}", "Content-Type": "application/json"}

    # Step 1: Insert pending audit docs and trigger audits
    print(f"\n{'=' * 80}")
    print("STEP 1: Creating audit documents and triggering audits")
    print("=" * 80)

    for biz in BUSINESSES:
        audit_id = ObjectId()
        user_id = ObjectId()
        business_id = ObjectId()

        # Insert pending audit doc in MongoDB (required by the endpoint)
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
        await db.audits.insert_one(audit_doc)

        # Build audit request
        request_body = {
            "auditId": str(audit_id),
            "businessId": str(business_id),
            "userId": str(user_id),
            **biz,
        }

        # Trigger audit
        async with httpx.AsyncClient(timeout=30) as http:
            resp = await http.post(f"{SERVER_URL}/audit", json=request_body, headers=headers)
            result = resp.json()

        if resp.status_code == 202:
            print(f"  [OK] {biz['businessName']:30s} -> audit {audit_id} (202 accepted)")
            audit_ids.append((str(audit_id), biz["businessName"]))
        else:
            print(f"  [FAIL] {biz['businessName']:30s} -> {resp.status_code}: {result}")
            audit_ids.append((str(audit_id), biz["businessName"]))

    # Step 2: Poll for completion
    print(f"\n{'=' * 80}")
    print("STEP 2: Waiting for audits to complete...")
    print("=" * 80)

    pending = {aid: name for aid, name in audit_ids}
    start_time = time.time()

    while pending and (time.time() - start_time) < MAX_WAIT:
        await asyncio.sleep(POLL_INTERVAL)
        elapsed = int(time.time() - start_time)

        for aid in list(pending.keys()):
            doc = await db.audits.find_one({"_id": ObjectId(aid)}, {"status": 1, "error": 1})
            if doc and doc["status"] in ("review_pending", "completed", "failed", "rejected"):
                status = doc["status"]
                err = doc.get("error", "")
                emoji = "OK" if status in ("review_pending", "completed") else "FAIL"
                suffix = f" — {err[:80]}" if err else ""
                print(f"  [{emoji}] {pending[aid]:30s} -> {status}{suffix}  ({elapsed}s)")
                del pending[aid]

        if pending:
            names = ", ".join(pending.values())
            print(f"  ... still waiting ({elapsed}s): {names}")

    if pending:
        print(f"\n  TIMEOUT: {len(pending)} audits did not complete within {MAX_WAIT}s")
        for aid, name in pending.items():
            print(f"    - {name} ({aid})")

    # Step 3: Full report
    print(f"\n{'=' * 80}")
    print("STEP 3: FULL AUDIT RESULTS REPORT")
    print("=" * 80)

    for aid, name in audit_ids:
        doc = await db.audits.find_one({"_id": ObjectId(aid)})
        if not doc:
            print(f"\n--- {name} --- NOT FOUND IN DB")
            continue

        status = doc.get("status", "unknown")
        geo_score = doc.get("geoScore")
        error = doc.get("error")
        results = doc.get("results") or {}

        print(f"\n{'─' * 80}")
        print(f"  BUSINESS: {name}")
        print(f"  Status:   {status}")
        print(f"  Audit ID: {aid}")

        if error:
            print(f"  ERROR:    {error}")

        if status == "failed":
            continue

        print(f"  GEO Score:          {geo_score}")
        print(f"  Audit Engine Score: {results.get('auditEngineScore')}")
        print(f"  HTML Scanner Score: {results.get('htmlScannerScore')}")

        # Engines
        engines_used = results.get("enginesUsed", [])
        engines_ok = results.get("enginesSucceeded", [])
        print(f"  Engines used:       {engines_used}")
        print(f"  Engines succeeded:  {engines_ok}")
        print(f"  Total prompts:      {results.get('totalPromptsProcessed')}")
        print(f"  Total responses:    {results.get('totalResponsesReceived')}")
        print(f"  Processing time:    {results.get('processingTimeMs', 0) / 1000:.1f}s")

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
                    print(f"    {lvl}:  score={score:5.1f}  mentionRate={mention:.2f}")

        # Discoverability
        disco = results.get("discoverabilityThreshold", {})
        if disco and isinstance(disco, dict):
            print(f"\n  Discoverability Threshold: level={disco.get('level')}  {disco.get('description', '')}")

        # Competitor results
        comp_results = results.get("competitorResults", [])
        if comp_results:
            print(f"\n  Competitor Comparison:")
            for comp in comp_results:
                if isinstance(comp, dict):
                    cname = comp.get("competitorName", comp.get("competitorUrl", "?"))
                    cscore = comp.get("auditEngineScore", 0)
                    cmention = comp.get("mentionRate", 0)
                    print(f"    {cname:30s}  engineScore={cscore:5.1f}  mentionRate={cmention:.2f}")

        # Sample prompt results (first 3)
        prompt_results = results.get("promptResults", [])
        if prompt_results:
            print(f"\n  Sample Prompt Results (first 3 of {len(prompt_results)}):")
            for pr in prompt_results[:3]:
                if isinstance(pr, dict):
                    q = pr.get("question", "")[:100]
                    ps = pr.get("promptScore", 0)
                    mr = pr.get("mentionRate", 0)
                    print(f"    Q: {q}...")
                    print(f"       promptScore={ps:.2f}  mentionRate={mr:.2f}")
                    engines_data = pr.get("engines", {})
                    for eng_name, eng_data in engines_data.items():
                        if isinstance(eng_data, dict):
                            mentioned = eng_data.get("mentioned", False)
                            quality = eng_data.get("quality", 0)
                            resp_snip = (eng_data.get("rawResponse", "") or "")[:120]
                            print(f"       [{eng_name}] mentioned={mentioned} quality={quality} -> {resp_snip}...")

    # Summary
    print(f"\n{'=' * 80}")
    print("SUMMARY")
    print("=" * 80)

    all_docs = []
    for aid, name in audit_ids:
        doc = await db.audits.find_one({"_id": ObjectId(aid)})
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
            print(f"    {i}. {name:30s}  GEO={geo:5.1f}  engine={eng:5.1f}  html={html:5.1f}")

    if failed:
        print(f"\n  Failed Audits:")
        for name, doc in failed:
            print(f"    - {name}: {doc.get('error', 'unknown error')[:120]}")

    print(f"\n{'=' * 80}")
    print("TEST COMPLETE")
    print("=" * 80)

    client.close()


if __name__ == "__main__":
    asyncio.run(main())
