"""
Inject pre-generated prompts into an existing audit document in MongoDB.

Usage:
    python simulation/inject_prompts.py <audit_id> <brand_slug>

    brand_slug: ankorstore | creatify | maison_du_laser

This sets status = "awaiting_prompt_approval" with the pre-generated prompts,
so Phase 2 (AI execution via claude CLI) can be triggered immediately via
POST /audit/{audit_id}/approve-prompts.
"""

import asyncio
import json
import logging
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from bson import ObjectId
from bson.errors import InvalidId
from motor.motor_asyncio import AsyncIOMotorClient

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

PROMPTS_DIR = Path(__file__).parent / "prompts"


def _load_brand(slug: str) -> dict:
    """Load brand config from brands.py."""
    sys.path.insert(0, str(Path(__file__).parent))
    from brands import BRANDS
    for b in BRANDS:
        if b["slug"] == slug:
            return b
    raise ValueError(f"Unknown brand slug: {slug!r}. Available: {[b['slug'] for b in BRANDS]}")


async def inject(audit_id: str, slug: str):
    prompts_path = PROMPTS_DIR / f"{slug}.json"
    if not prompts_path.exists():
        raise FileNotFoundError(
            f"Prompts file not found: {prompts_path}\n"
            f"Run `python simulation/generate_prompts.py` first."
        )

    with open(prompts_path, encoding="utf-8") as f:
        prompts = json.load(f)

    brand = _load_brand(slug)
    logger.info(f"Loaded {len(prompts)} prompts for {brand['businessName']}")

    try:
        oid = ObjectId(audit_id)
    except (InvalidId, Exception):
        raise ValueError(f"Invalid audit_id: {audit_id!r}")

    uri = os.environ.get("MONGODB_URI")
    if not uri:
        raise RuntimeError("MONGODB_URI env var not set")

    client = AsyncIOMotorClient(uri)
    db = client.ShowYourBrand

    # Build minimal originalRequest for Phase 2 reconstruction
    original_request = {
        "auditId": audit_id,
        "businessId": str(oid),
        "userId": str(oid),
        "businessName": brand["businessName"],
        "businessUrl": brand["businessUrl"],
        "businessType": brand["businessType"],
        "category": brand["category"],
        "description": brand["description"],
        "language": brand.get("language", "fr"),
        "localityTier": brand.get("localityTier", "global"),
        "city": brand.get("city"),
        "country": brand.get("country"),
        "region": brand.get("region"),
        "neighborhood": brand.get("neighborhood"),
        "targetKeywords": brand.get("targetKeywords", []),
        "uniqueSellingPoints": brand.get("uniqueSellingPoints", []),
        "targetAudience": brand.get("targetAudience"),
        "priceRange": brand.get("priceRange"),
        "servicesOrProducts": brand.get("servicesOrProducts", []),
        "competitorNames": brand.get("competitorNames", []),
        "competitorUrls": brand.get("competitorUrls", []),
        "certifications": brand.get("certifications", []),
        "yearFounded": brand.get("yearFounded"),
        "subUrls": [],
        "socialMediaUrls": [],
        "customFields": {},
        "gscAccessToken": None,
        "gscSiteUrl": None,
        "googlePlaceId": None,
        "street": None,
    }

    business_snapshot = {
        "name": brand["businessName"],
        "primaryUrl": brand["businessUrl"],
        "subUrls": [],
        "competitorUrls": brand.get("competitorUrls", []),
        "competitorNames": brand.get("competitorNames", []),
        "category": brand["category"],
        "description": brand["description"],
        "targetKeywords": brand.get("targetKeywords", []),
        "businessType": brand["businessType"],
        "localityTier": brand.get("localityTier"),
        "allMetadata": original_request,
    }

    result = await db.audits.update_one(
        {"_id": oid},
        {
            "$set": {
                "status": "awaiting_prompt_approval",
                "businessName": brand["businessName"],
                "schemaVersion": 2,
                "results.businessSnapshot": business_snapshot,
                "results.localityTier": brand.get("localityTier"),
                "results.generatedPrompts": prompts,
                "results.originalRequest": original_request,
                "updatedAt": datetime.now(timezone.utc).isoformat(),
            }
        },
    )

    client.close()

    if result.matched_count == 0:
        raise RuntimeError(f"No audit found with id {audit_id}")

    logger.info(f"Injected {len(prompts)} prompts into audit {audit_id}")
    logger.info(f"Status set to 'awaiting_prompt_approval'")
    logger.info(f"Now call: POST /audit/{audit_id}/approve-prompts to run Phase 2")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python simulation/inject_prompts.py <audit_id> <brand_slug>")
        print("  brand_slug: ankorstore | creatify | maison_du_laser")
        sys.exit(1)

    audit_id_arg = sys.argv[1]
    slug_arg = sys.argv[2]

    asyncio.run(inject(audit_id_arg, slug_arg))
