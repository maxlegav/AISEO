"""
Simulation prompt generator — pre-generates 3×100 prompts via local claude CLI.

Standalone script: no server dependencies (no motor, no MongoDB, no FastAPI).
Only requires: json, subprocess, pathlib (stdlib only).

Usage (from anywhere):
    python server/simulation/generate_prompts.py

Output: server/simulation/prompts/{slug}.json  (one file per brand)

The generated JSON files can then be injected directly into MongoDB
(results.generatedPrompts) to skip the GPT-4o generation step in a real audit.
"""

import json
import logging
import os
import re
import shutil
import subprocess
import sys
from collections import Counter
from pathlib import Path

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

OUTPUT_DIR = Path(__file__).parent / "prompts"
PROMPT_COUNT = 100
MAX_ATTEMPTS = 3

# ─── Brand configs (inline — no import needed) ────────────────────────────────

BRANDS = [
    {
        "slug": "ankorstore",
        "businessName": "Ankorstore",
        "businessUrl": "https://fr.ankorstore.com/",
        "businessType": "marketplace B2B e-commerce",
        "category": "marketplace wholesale B2B pour retailers indépendants",
        "description": (
            "Ankorstore est une marketplace B2B européenne qui connecte des marques "
            "indépendantes avec des retailers (boutiques, concept stores, épiceries fines, "
            "librairies). Elle permet aux commerçants indépendants de commander en petites "
            "quantités auprès de plus de 30 000 marques avec des conditions avantageuses : "
            "paiement différé 60 jours, retours gratuits sur la première commande, "
            "et livraison centralisée. Fondée en France en 2019, présente dans toute l'Europe."
        ),
        "language": "fr",
        "localityTier": "global",
        "country": "France",
        "targetKeywords": [
            "marketplace wholesale", "fournisseur boutique indépendante",
            "commander en gros petites quantités", "plateforme B2B marques",
        ],
        "uniqueSellingPoints": [
            "Paiement différé 60 jours pour les retailers",
            "Retours gratuits sur la première commande",
            "30 000+ marques européennes indépendantes",
            "Commandes en petites quantités sans minimum élevé",
            "Plateforme 100% dédiée aux commerçants indépendants",
        ],
        "competitorNames": ["Faire", "Orderchamp", "Mable", "RangeMe"],
        "targetAudience": (
            "Gérants de boutiques indépendantes, concept stores, épiceries fines, "
            "librairies — cherchant à s'approvisionner en marques originales sans "
            "passer par les grossistes traditionnels."
        ),
        "servicesOrProducts": [
            "Marketplace wholesale B2B",
            "Accès à 30 000+ marques indépendantes",
            "Paiement différé 60 jours",
            "Retours gratuits première commande",
        ],
        "priceRange": "wholesale",
        "yearFounded": 2019,
    },
    {
        "slug": "creatify",
        "businessName": "Creatify",
        "businessUrl": "https://creatify.ai/",
        "businessType": "saas",
        "category": "AI-powered video ad creation platform",
        "description": (
            "Creatify is an AI-powered video ad creation platform that lets marketers, "
            "e-commerce brands, and agencies generate product video ads in minutes. "
            "Users input a product URL or images and the AI generates multiple video ad "
            "variations with AI avatars, realistic voiceovers, and auto-written scripts. "
            "Built specifically for performance marketing — Meta, TikTok, YouTube ads. "
            "Used by 1M+ marketers worldwide."
        ),
        "language": "en",
        "localityTier": "global",
        "targetKeywords": [
            "AI video ad creator", "automated video ads",
            "product video generator AI", "AI ad maker",
        ],
        "uniqueSellingPoints": [
            "Generate video ads from a product URL in under 2 minutes",
            "AI avatars and lifelike voiceovers in 29 languages",
            "Bulk generation: multiple ad variations at once",
            "Built specifically for performance marketing (Meta, TikTok, YouTube)",
            "No video editing skills required",
        ],
        "competitorNames": ["AdCreative.ai", "Invideo AI", "HeyGen", "Waymark", "Arcads"],
        "targetAudience": (
            "Performance marketers, DTC e-commerce brands, marketing agencies, "
            "social media managers — who need high-volume video ad production "
            "without a video production team."
        ),
        "servicesOrProducts": [
            "AI video ad generation from product URL",
            "AI avatar spokesperson videos",
            "Bulk ad variation creation",
            "Script auto-generation",
            "Multi-language voiceovers",
        ],
        "priceRange": "mid",
        "yearFounded": 2023,
    },
    {
        "slug": "maison_du_laser",
        "businessName": "Maison du Laser",
        "businessUrl": "https://www.maisondulaser.fr/",
        "businessType": "centre médical épilation laser",
        "category": "épilation laser permanente et médecine esthétique",
        "description": (
            "Maison du Laser est une chaîne de centres médicaux spécialisés dans "
            "l'épilation laser permanente et la médecine esthétique, avec 6 centres "
            "en France et à Bruxelles (Paris 11e, 12e, 14e, 15e, Argenteuil, Bruxelles). "
            "Chaque traitement est suivi médicalement par des médecins certifiés. "
            "La chaîne se distingue par son positionnement accessible et inclusif, "
            "avec une consultation médicale gratuite et une efficacité sur tous les phototypes."
        ),
        "language": "fr",
        "localityTier": "national",
        "city": "Paris",
        "region": "Île-de-France",
        "country": "France",
        "targetKeywords": [
            "épilation laser Paris", "centre épilation laser médical",
            "épilation laser permanente", "épilation laser définitive",
        ],
        "uniqueSellingPoints": [
            "Suivi médical par des médecins certifiés",
            "Consultation médicale gratuite avant traitement",
            "Efficace sur tous les phototypes (peaux foncées incluses)",
            "6 centres accessibles en Île-de-France et Bruxelles",
            "Positionnement tarifaire accessible",
        ],
        "competitorNames": ["Lazeo", "Alfa Laser", "Epilium & Skin", "Dépil Tech"],
        "targetAudience": (
            "Femmes et hommes cherchant une solution d'épilation définitive, "
            "toutes typologies de peau, soucieux d'un suivi médical sérieux "
            "à un tarif accessible."
        ),
        "servicesOrProducts": [
            "Épilation laser permanente (visage, aisselles, maillot, jambes)",
            "Épilation laser hommes",
            "Suppression de tatouage",
            "Médecine esthétique (injections acide hyaluronique)",
            "Peeling chimique",
        ],
        "certifications": ["Médecins certifiés", "Suivi médical réglementaire"],
        "priceRange": "accessible",
        "yearFounded": 2010,
    },
]


# ─── Prompt builder (extracted from prompt_generator.py, standalone) ──────────

def _build_geo_instructions(brand: dict) -> str:
    tier = brand.get("localityTier", "global")
    parts = []
    if brand.get("neighborhood"):
        parts.append(f"Neighborhood: {brand['neighborhood']}")
    if brand.get("city"):
        parts.append(f"City: {brand['city']}")
    if brand.get("region"):
        parts.append(f"Region: {brand['region']}")
    if brand.get("country"):
        parts.append(f"Country: {brand['country']}")
    location_block = "\n".join(f"- {p}" for p in parts) if parts else "(No location data provided)"

    if tier == "hyper_local":
        return f"""## Geography — HYPER-LOCAL business
Location data:
{location_block}

Geography rules:
- Levels 1-2: Use neighborhood names, street references, or city districts. NEVER use country alone.
- Level 3: Can widen to city level
- Levels 4-5: Can mention city or wider area alongside specific business details
- At least 30% of Level 1-2 prompts must reference a specific neighborhood or district"""

    elif tier == "national":
        return f"""## Geography — NATIONAL business
Location data:
{location_block}

Geography rules:
- Level 1: Use country-level references ("en France", "à Paris")
- Level 2-3: Can use region or city ("Île-de-France", "à Paris")
- Levels 4-5: Mix of country/city + specific business characteristics
- NEVER use neighborhood-level specificity — this business serves the whole country"""

    else:  # global
        return f"""## Geography — GLOBAL business
Location data:
{location_block}

Geography rules:
- Levels 1-3: NO geographic filter at all. Prompts should be location-agnostic.
- Levels 4-5: May reference the brand's country of origin as a descriptive detail, not a filter
- NEVER force geographic terms into prompts — this business serves a global audience"""


def _build_system_prompt(brand: dict) -> str:
    optional_sections = []
    if brand.get("city"):
        optional_sections.append(f"- City: {brand['city']}")
    if brand.get("neighborhood"):
        optional_sections.append(f"- Neighborhood: {brand['neighborhood']}")
    if brand.get("region"):
        optional_sections.append(f"- Region: {brand['region']}")
    if brand.get("country"):
        optional_sections.append(f"- Country: {brand['country']}")
    if brand.get("targetKeywords"):
        optional_sections.append(f"- Target Keywords: {', '.join(brand['targetKeywords'])}")
    if brand.get("uniqueSellingPoints"):
        optional_sections.append(f"- Unique Selling Points: {', '.join(brand['uniqueSellingPoints'])}")
    if brand.get("targetAudience"):
        optional_sections.append(f"- Target Audience: {brand['targetAudience']}")
    if brand.get("priceRange"):
        optional_sections.append(f"- Price Range: {brand['priceRange']}")
    if brand.get("servicesOrProducts"):
        optional_sections.append(f"- Services/Products: {', '.join(brand['servicesOrProducts'])}")
    if brand.get("competitorNames"):
        optional_sections.append(f"- Competitors: {', '.join(brand['competitorNames'])}")
    if brand.get("certifications"):
        optional_sections.append(f"- Certifications: {', '.join(brand['certifications'])}")
    if brand.get("yearFounded"):
        optional_sections.append(f"- Year Founded: {brand['yearFounded']}")
    optional_block = "\n".join(optional_sections) if optional_sections else "(No additional metadata)"

    lang = brand.get("language", "fr")
    lang_label = "French" if lang == "fr" else "English"
    total = PROMPT_COUNT
    per_level = total // 5
    ultra_broad = max(1, per_level // 4)
    filtered = per_level - ultra_broad
    min_per_category = max(2, total // 6 - 2)

    def _range(lvl: int) -> str:
        start = (lvl - 1) * per_level + 1
        end = lvl * per_level
        return f"{start}-{end}"

    if lang == "fr":
        tone_examples = """
BAD (robotic): "Quels sont les meilleurs fournisseurs en gros en France ?"
GOOD (human): "j'ouvre une boutique le mois prochain, comment je trouve des marques à revendre sans passer par des grossistes classiques ?"

BAD (robotic): "Recommandez des outils de création de vidéos publicitaires par IA"
GOOD (human): "on est une petite agence, on galère à produire des vidéos pour nos clients e-commerce, t'as des alternatives à Canva ?"
"""
    else:
        tone_examples = """
BAD (robotic): "What are the best AI video ad creation tools?"
GOOD (human): "we're a small e-comm team, need to make video ads fast without a production budget — what do people use?"

BAD (robotic): "Compare AI video generation platforms for marketing"
GOOD (human): "tried making TikTok ads myself, total disaster — is there something that just does it automatically from my product page?"
"""

    geo_instructions = _build_geo_instructions(brand)

    return f"""You are an expert in GEO (Generative Engine Optimization). Generate exactly {total} prompts
to test the visibility of a business in AI engine responses.

## Business Metadata
- Business Name: {brand['businessName']}
- Website URL: {brand['businessUrl']}
- Business Type: {brand['businessType']}
- Category: {brand['category']}
- Description: {brand['description']}
- Locality Tier: {brand.get('localityTier', 'global')}
{optional_block}

## Language
Generate ALL prompts in: {lang_label}

## CRITICAL: TONE — Write like a real human, not a textbook

Every prompt must sound like something a real person would actually type into ChatGPT or Perplexity.
Real people are casual, specific about their situation, and often include context about WHY they're asking.

{tone_examples}

### Mandatory rules for natural tone:
1. Use contractions, informal language, filler words ("actually", "honestly", "kinda", "genre", "du coup")
2. Include real-life REASONS: "pour mon annif", "avant de signer", "avec mes potes", "j'ouvre une boutique"
3. Use at least 5 DIFFERENT PERSONAS across the {total} prompts
4. NEVER use marketing language: "premium", "top-rated", "best-in-class", "leading"
5. Vary sentence structure: questions, incomplete sentences, conversational fragments

{geo_instructions}

## Structure: 5 levels x {per_level} prompts each

### Level 1 — BROAD ({per_level} prompts, IDs {_range(1)})
The FIRST {ultra_broad} prompts (IDs 1-{ultra_broad}) are ULTRA-BROAD: generic queries anyone in this category would ask.
The business name MUST NOT appear.

The NEXT {filtered} prompts (IDs {ultra_broad + 1}-{per_level}) are FILTERED: queries with natural filters (location, style, budget, product type).
The business name MUST NOT appear.

### Level 2 — NICHE ({per_level} prompts, IDs {_range(2)})
Very specific queries targeting the exact positioning of the business. The business name MUST NOT appear.
These should feel like someone who knows what they want but hasn't found it yet.

### Level 3 — QUASI-DIRECT ({per_level} prompts, IDs {_range(3)})
Queries that DESCRIBE the business by its characteristics WITHOUT naming it.
The person is basically describing the business without knowing its name.

### Level 4 — SEMI-DIRECT ({per_level} prompts, IDs {_range(4)})
Queries that mention PARTIAL IDENTIFYING DETAILS: city, very specific characteristics, ultra-precise niche.
The name MAY or MAY NOT appear (vary across prompts).

### Level 5 — DIRECT ({per_level} prompts, IDs {_range(5)})
Queries that EXPLICITLY NAME the business or URL. Vary formulations: direct question, opinion request, info request.

## Intent Categories (6 types)
Each prompt MUST be tagged with ONE intent category:
- discovery: Would the AI recommend this business?
- comparison: Comparison with competitors
- reputation: Reviews/reliability/trust
- product: Knowledge of products/services
- alternative: The business as an alternative to a competitor
- trust: Security/reliability of purchase

Distribute categories EVENLY. Each category must appear at least {min_per_category} times.

## OUTPUT FORMAT

CRITICAL: Your response MUST be EXCLUSIVELY valid JSON.
Return NO text outside the JSON. No markdown, no explanation, no comments, no ```json```.
Only raw JSON.

Expected format:
[
  {{"id": 1, "level": 1, "category": "discovery", "question": "..."}},
  {{"id": 2, "level": 1, "category": "comparison", "question": "..."}}
]

VERIFY before outputting:
- Exactly {total} prompts (id 1 to {total})
- {per_level} prompts per level (level 1 to 5)
- Each prompt has id, level, category, question
- Categories well distributed (min {min_per_category} per category)
- Level 1: {ultra_broad} ultra-broad (id 1-{ultra_broad}) + {filtered} filtered (id {ultra_broad + 1}-{per_level})
- Level 5: all {per_level} explicitly mention the business name or URL
- ALL prompts sound natural and human
- The JSON is valid and parsable"""


# ─── Validation ───────────────────────────────────────────────────────────────

def _strip_markdown_code_blocks(text: str) -> str:
    text = text.strip()
    if text.startswith("```json"):
        text = text[7:]
    elif text.startswith("```"):
        text = text[3:]
    if text.endswith("```"):
        text = text[:-3]
    return text.strip()


def _validate_prompts(prompts: list) -> list[str]:
    errors = []
    total = PROMPT_COUNT
    per_level = total // 5
    min_per_category = max(2, total // 6 - 2)

    if len(prompts) != total:
        errors.append(f"Expected {total} prompts, got {len(prompts)}")
        return errors

    ids = [p.get("id") for p in prompts]
    if sorted(ids) != list(range(1, total + 1)):
        errors.append(f"IDs should be 1-{total}")

    for level in range(1, 6):
        level_prompts = [p for p in prompts if p.get("level") == level]
        if len(level_prompts) != per_level:
            errors.append(f"Level {level} has {len(level_prompts)} prompts, expected {per_level}")

    valid_categories = {"discovery", "comparison", "reputation", "product", "alternative", "trust"}
    cat_counts = Counter(p.get("category") for p in prompts)
    for cat in valid_categories:
        if cat_counts.get(cat, 0) < min_per_category:
            errors.append(f"Category '{cat}' has {cat_counts.get(cat, 0)}, minimum {min_per_category}")

    for p in prompts:
        missing = [f for f in ("id", "level", "category", "question") if f not in p]
        if missing:
            errors.append(f"Prompt {p.get('id', '?')} missing fields: {missing}")
            break

    return errors


# ─── Claude CLI caller ────────────────────────────────────────────────────────

def call_claude_code_cli(message: str) -> dict:
    claude_bin = shutil.which("claude")
    if not claude_bin:
        return {"success": False, "response": None, "error": "claude CLI not found in PATH"}
    try:
        # Unset CLAUDECODE to allow spawning claude from inside a Claude Code session
        env = {k: v for k, v in os.environ.items() if k != "CLAUDECODE"}
        result = subprocess.run(
            [claude_bin, "-p", message, "--dangerously-skip-permissions"],
            capture_output=True,
            text=True,
            timeout=600,
            env=env,
        )
        if result.returncode == 0:
            return {"success": True, "response": result.stdout.strip(), "error": None}
        return {"success": False, "response": None, "error": result.stderr.strip() or f"Exit {result.returncode}"}
    except subprocess.TimeoutExpired:
        return {"success": False, "response": None, "error": "Timeout after 300s"}
    except Exception as e:
        return {"success": False, "response": None, "error": str(e)}


# ─── Main generation logic ────────────────────────────────────────────────────

def generate_for_brand(brand: dict) -> list[dict]:
    slug = brand["slug"]
    system_prompt = _build_system_prompt(brand)
    logger.info(f"[{slug}] System prompt: {len(system_prompt)} chars. Calling claude CLI...")

    last_error = ""
    for attempt in range(1, MAX_ATTEMPTS + 1):
        message = system_prompt
        if attempt > 1 and last_error:
            message += f"\n\n## RETRY — Previous attempt had errors:\n{last_error}\nPlease fix these issues."

        logger.info(f"[{slug}] Attempt {attempt}/{MAX_ATTEMPTS}...")
        result = call_claude_code_cli(message)

        if not result["success"]:
            last_error = result.get("error", "Unknown error")
            logger.warning(f"[{slug}] CLI call failed: {last_error}")
            continue

        raw_text = result["response"] or ""
        if not raw_text:
            last_error = "Empty response"
            continue

        clean_text = _strip_markdown_code_blocks(raw_text)
        try:
            prompts_data = json.loads(clean_text)
        except json.JSONDecodeError as e:
            last_error = f"JSON parse error: {e}"
            logger.warning(f"[{slug}] {last_error} — first 300 chars: {raw_text[:300]}")
            continue

        if not isinstance(prompts_data, list):
            last_error = "Response is not a JSON array"
            continue

        errors = _validate_prompts(prompts_data)
        if errors:
            last_error = "; ".join(errors)
            logger.warning(f"[{slug}] Validation failed: {last_error}")
            continue

        logger.info(f"[{slug}] Generated {len(prompts_data)} prompts successfully.")
        return prompts_data

    raise RuntimeError(f"[{slug}] Failed after {MAX_ATTEMPTS} attempts: {last_error}")


def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    summary = {}

    for brand in BRANDS:
        slug = brand["slug"]
        output_path = OUTPUT_DIR / f"{slug}.json"

        if output_path.exists():
            logger.info(f"[{slug}] Already exists — skipping. Delete to regenerate.")
            with open(output_path) as f:
                data = json.load(f)
            summary[slug] = len(data)
            continue

        try:
            prompts = generate_for_brand(brand)
            with open(output_path, "w", encoding="utf-8") as f:
                json.dump(prompts, f, ensure_ascii=False, indent=2)
            logger.info(f"[{slug}] Saved → {output_path}")
            summary[slug] = len(prompts)
        except Exception as e:
            logger.error(f"[{slug}] FAILED: {e}")
            summary[slug] = f"ERROR: {e}"

    print("\n" + "=" * 60)
    print("SIMULATION PROMPT GENERATION — SUMMARY")
    print("=" * 60)
    for slug, count in summary.items():
        status = f"{count} prompts" if isinstance(count, int) else count
        print(f"  {slug:25s} → {status}")
    print("=" * 60)
    print(f"\nFiles saved to: {OUTPUT_DIR}/")
    print("Next step: python simulation/inject_prompts.py <audit_id> <slug>")


if __name__ == "__main__":
    main()
