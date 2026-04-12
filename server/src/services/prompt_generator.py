"""
Dynamic Prompt Generator — LLM-based prompt generation.

Uses a high-end LLM (GPT-5.4, or Ollama in local mode) to generate prompts tailored to any business.
Count is controlled by config.PROMPT_COUNT (default 100, env-overridable).
Prompts follow 5 specificity levels x 6 intent categories as defined in audit-engine-spec.md.

Prompts are written in a natural, human tone — the way real people type into ChatGPT,
not the way a marketing textbook would phrase a query.
"""

import json
import logging
import os
import re
from collections import Counter

import config as app_config
from models.audit import GeneratedPrompt
from models.business import AuditRequest, LocalityTier
from utils.dbal.ai_api_wrapper import call_openai_api, call_ollama_api, call_claude_code_cli

logger = logging.getLogger(__name__)

MAX_ATTEMPTS = 3
PROMPT_GENERATION_MAX_TOKENS = int(os.getenv("PROMPT_GENERATION_MAX_TOKENS", "32000"))


def _normalize_business_type(raw: str | None) -> str:
    """Normalize free-text businessType to coarse strategy buckets."""
    if not raw:
        return "generic"
    value = raw.strip().lower()
    value = re.sub(r"[^a-z0-9]+", " ", value).strip()

    if any(token in value for token in ("saas", "software", "platform", "app", "b2b")):
        return "saas"
    if any(token in value for token in ("ecommerce", "e commerce", "shop", "store", "d2c", "marketplace")):
        return "ecommerce"
    if any(token in value for token in ("restaurant", "cafe", "coffee", "bar", "bakery", "food", "brasserie")):
        return "food_beverage"
    if any(token in value for token in ("agency", "consult", "freelance", "studio", "law", "account", "coach")):
        return "service_business"
    if any(token in value for token in ("clinic", "dent", "med", "health", "wellness", "pharma")):
        return "healthcare"
    if any(token in value for token in ("media", "blog", "news", "magazine", "content", "publisher")):
        return "media"
    if any(token in value for token in ("school", "course", "academy", "training", "education", "bootcamp")):
        return "education"
    return "generic"


def _business_type_playbook(business: AuditRequest) -> str:
    """Return detailed generation strategy by business type and locality tier."""
    btype = _normalize_business_type(business.businessType)
    tier = business.localityTier or LocalityTier.GLOBAL
    tier_value = tier.value

    base = [
        "## Business-Type Playbook",
        f"- Raw business type: {business.businessType}",
        f"- Normalized type: {btype}",
        f"- Active locality tier: {tier_value}",
    ]

    if btype == "saas":
        spec = """### SaaS strategy
- Prioritise use cases, integrations, migration friction, onboarding time, pricing transparency, support quality, and team fit.
- Include prompts from different buyers: founder, ops lead, marketing manager, developer, and procurement.
- Comparison prompts should name realistic alternatives and include switching concerns (data import, lock-in, learning curve).
- Reputation/trust prompts should probe uptime, security posture, data handling, and customer support responsiveness.
- Product prompts should ask specific features, limits, seats, API/webhooks, and automation depth."""
    elif btype == "ecommerce":
        spec = """### E-commerce strategy
- Prioritise product quality, price/value ratio, delivery speed, returns/refunds, sizing/fit, and payment trust.
- Include intent variants: gift shopping, urgent purchase, budget search, premium quality hunt, and repeat buyer.
- Comparison prompts should test alternatives on quality/price/shipping and include named competitor references when provided.
- Reputation/trust prompts should ask legitimacy, review consistency, return handling, and after-sales support.
- Product prompts should ask catalog depth, stock availability, materials/specs, and shipping destinations."""
    elif btype == "food_beverage":
        spec = """### Food & beverage strategy
- Prioritise cuisine/style fit, ambiance, reservation friction, dietary options, service quality, and value for money.
- Include situations: date night, friends, family, business lunch, quick bite, and remote work.
- Comparison prompts should include neighborhood alternatives, wait-time concerns, and atmosphere preferences.
- Reputation/trust prompts should ask freshness, consistency, hygiene confidence, and service reliability.
- Product prompts should test menu specificity, signature dishes, opening hours, and booking options."""
    elif btype == "service_business":
        spec = """### Service business strategy
- Prioritise expertise depth, scope clarity, response time, process transparency, and measurable outcomes.
- Include customer contexts: urgent issue, first-time buyer, budget-constrained lead, premium buyer, and long-term partner.
- Comparison prompts should test differentiation vs agencies/consultants/freelancers on pricing model and execution quality.
- Reputation/trust prompts should ask proof of results, testimonials, credentials, and communication quality.
- Product prompts should ask deliverables, timelines, engagement model, and support after delivery."""
    elif btype == "healthcare":
        spec = """### Healthcare strategy
- Prioritise trust, qualifications, patient safety, appointment availability, treatment scope, and clarity of care pathway.
- Include intents around urgency, first consultation, follow-up care, insurance/payment acceptance, and location convenience.
- Comparison prompts should test perceived quality, wait times, and treatment specialization.
- Reputation/trust prompts should ask practitioner reputation, clinic professionalism, and reliability of care.
- Product prompts should focus on services offered, booking process, required documents, and follow-up support."""
    elif btype == "media":
        spec = """### Media/publisher strategy
- Prioritise topical authority, depth of analysis, freshness, editorial trust, and practical value for readers.
- Include audience intents: quick answer, deep dive, trend monitoring, beginner guidance, and expert perspective.
- Comparison prompts should test source quality, bias neutrality, and comprehensiveness vs alternatives.
- Reputation/trust prompts should ask source reliability, citation quality, and editorial standards.
- Product prompts should ask newsletter/premium features, topic coverage breadth, and publishing cadence."""
    elif btype == "education":
        spec = """### Education strategy
- Prioritise curriculum quality, outcomes, pedagogy fit, support quality, and flexibility.
- Include learner profiles: beginner, career switcher, upskiller, student, and professional with limited time.
- Comparison prompts should test course depth, mentorship, certification value, and price fairness.
- Reputation/trust prompts should ask completion outcomes, alumni feedback, and practical applicability.
- Product prompts should ask lesson format, duration, prerequisites, and career support."""
    else:
        spec = """### Generic business strategy
- Prioritise value proposition clarity, differentiation, trust signals, pricing transparency, and customer fit.
- Include diverse intents: discovery, comparison, risk reduction, and practical decision questions.
- Ensure prompts remain concretely grounded in provided business metadata, not generic marketing phrasing."""

    tier_overrides = {
        LocalityTier.HYPER_LOCAL: """### Tier overlay: hyper_local
- Emphasize distance, neighborhood relevance, convenience, and local alternatives.
- At least 35% of discovery/comparison prompts should include local qualifiers (district, nearby landmarks, city zones).
- Test practical local concerns: opening hours, walkability, same-day availability, and local reputation.""",
        LocalityTier.NATIONAL: """### Tier overlay: national
- Emphasize country-wide availability, shipping/coverage, and regional service consistency.
- Include prompts that compare regional options while keeping national buyer intent.
- Test trust across distance: delivery/remote service reliability, support access, and policy clarity.""",
        LocalityTier.GLOBAL: """### Tier overlay: global
- Emphasize global use cases, remote access, language/currency readiness, and broad comparability.
- Avoid local micro-geo constraints in levels 1-3; prioritize universal buyer framing.
- Include prompts that test international credibility and scalability perception.""",
    }

    return "\n".join(base) + "\n\n" + spec + "\n\n" + tier_overrides[tier]


def _business_type_tier_combo_playbook(business: AuditRequest) -> str:
    """Return extra-strict instructions for the exact type+tier combination."""
    btype = _normalize_business_type(business.businessType)
    tier = business.localityTier or LocalityTier.GLOBAL

    combo_specs: dict[tuple[str, LocalityTier], str] = {
        ("saas", LocalityTier.GLOBAL): """### Combo focus: SaaS + Global
- Prioritise cross-border teams, async collaboration, and integration ecosystem fit.
- Include prompts about language support, timezone workflows, and global compliance confidence.
- Force comparisons against global incumbents and modern niche tools.""",
        ("saas", LocalityTier.NATIONAL): """### Combo focus: SaaS + National
- Prioritise in-country adoption confidence, local payment/admin constraints, and support responsiveness.
- Include prompts about local business norms, invoicing expectations, and migration practicality.
- Compare local champions vs global tools with practical trade-offs.""",
        ("saas", LocalityTier.HYPER_LOCAL): """### Combo focus: SaaS + Hyper-local
- Treat as niche-local software usage scenarios (city-specific workflows, nearby providers, local constraints).
- Include prompts that test local relevance while keeping product-led language.
- Compare against practical alternatives used by local operators.""",
        ("ecommerce", LocalityTier.GLOBAL): """### Combo focus: E-commerce + Global
- Prioritise shipping reliability across countries, duties/taxes clarity, and multilingual purchase flow confidence.
- Include prompts on returns across borders, delivery speed realism, and buyer trust for first-time orders.
- Compare value/quality against global marketplaces and specialist brands.""",
        ("ecommerce", LocalityTier.NATIONAL): """### Combo focus: E-commerce + National
- Prioritise domestic delivery speed, return simplicity, payment trust, and customer support quality.
- Include prompts tied to country-wide shopping behavior (gift season, urgent deliveries, budget hunting).
- Compare to national retailers and D2C alternatives by reliability and value.""",
        ("ecommerce", LocalityTier.HYPER_LOCAL): """### Combo focus: E-commerce + Hyper-local
- Prioritise same-day/nearby delivery, click-and-collect, and neighborhood trust signals.
- Include prompts with city/district shopping intent and local competitor substitution.
- Stress practical convenience and local legitimacy checks.""",
        ("food_beverage", LocalityTier.HYPER_LOCAL): """### Combo focus: Food & Beverage + Hyper-local
- Prioritise neighborhood intent, distance, opening hours, queue/wait expectations, and occasion fit.
- Include prompts for date night, group outings, quick lunch, and remote-work sessions nearby.
- Compare nearby options on ambiance, price, and consistency.""",
        ("food_beverage", LocalityTier.NATIONAL): """### Combo focus: Food & Beverage + National
- Treat as chain/brand-level decision context: consistency, regional presence, and ordering reliability.
- Include prompts on delivery coverage, menu consistency, and value across cities.
- Compare against known national chains and delivery-first alternatives.""",
        ("food_beverage", LocalityTier.GLOBAL): """### Combo focus: Food & Beverage + Global
- Treat as internationally discoverable brand concept or product-oriented F&B business.
- Include prompts about global brand credibility, product consistency, and international availability.
- Compare against recognized global references where relevant.""",
        ("service_business", LocalityTier.HYPER_LOCAL): """### Combo focus: Services + Hyper-local
- Prioritise proximity, availability windows, local reputation, and emergency/urgent intent.
- Include prompts on response time, pricing clarity, and trust for local providers.
- Compare neighborhood providers with practical decision framing.""",
        ("service_business", LocalityTier.NATIONAL): """### Combo focus: Services + National
- Prioritise remote/on-site coverage, standardization quality, and SLA/turnaround confidence.
- Include prompts that test consistency across regions and support channels.
- Compare national providers on reliability, process clarity, and outcomes.""",
        ("service_business", LocalityTier.GLOBAL): """### Combo focus: Services + Global
- Prioritise international delivery readiness, async collaboration, and strategic fit.
- Include prompts around cross-border communication, timezone handoffs, and process maturity.
- Compare boutique vs global provider dynamics with risk/reward framing.""",
        ("healthcare", LocalityTier.HYPER_LOCAL): """### Combo focus: Healthcare + Hyper-local
- Prioritise nearby access, appointment speed, trust, and patient safety confidence.
- Include prompts on urgent slots, first consultation anxiety, and clinic professionalism.
- Compare local practitioners on care quality and reliability cues.""",
        ("healthcare", LocalityTier.NATIONAL): """### Combo focus: Healthcare + National
- Prioritise network coverage, specialist access, and process consistency across regions.
- Include prompts about referral paths, remote support options, and care continuity.
- Compare provider reputations and practical access constraints.""",
        ("healthcare", LocalityTier.GLOBAL): """### Combo focus: Healthcare + Global
- Prioritise international patient trust, expertise signaling, and treatment pathway clarity.
- Include prompts around cross-border consultations and credibility indicators.
- Compare globally visible options with safety-first framing.""",
        ("media", LocalityTier.GLOBAL): """### Combo focus: Media + Global
- Prioritise authority, citation quality, freshness, and global audience usefulness.
- Include prompts for quick updates, deep analysis, and topic reliability checks.
- Compare editorial depth vs speed across global sources.""",
        ("media", LocalityTier.NATIONAL): """### Combo focus: Media + National
- Prioritise national relevance, local context depth, and trustworthy interpretation.
- Include prompts around domestic policy/news understanding and practical takeaways.
- Compare against national competitors for depth, neutrality, and timeliness.""",
        ("media", LocalityTier.HYPER_LOCAL): """### Combo focus: Media + Hyper-local
- Prioritise neighborhood/city relevance, utility, and credibility of local reporting.
- Include prompts about events, openings, local business discovery, and city-life decisions.
- Compare nearby/local sources on signal-to-noise and practical usefulness.""",
        ("education", LocalityTier.GLOBAL): """### Combo focus: Education + Global
- Prioritise remote learning quality, cohort diversity, and career transferability.
- Include prompts on outcomes, mentor quality, flexibility, and global employability.
- Compare to international alternatives by practical ROI and support.""",
        ("education", LocalityTier.NATIONAL): """### Combo focus: Education + National
- Prioritise local recognition, language fit, and country-specific career value.
- Include prompts for students and professionals evaluating cost/outcomes trade-offs.
- Compare national options on credibility, pedagogy, and job relevance.""",
        ("education", LocalityTier.HYPER_LOCAL): """### Combo focus: Education + Hyper-local
- Prioritise proximity, schedule fit, on-site experience, and local opportunities.
- Include prompts around neighborhood convenience, commute, and local placement potential.
- Compare nearby options with practical constraints and quality signals.""",
    }

    default_specs = {
        LocalityTier.HYPER_LOCAL: """### Combo focus: Generic + Hyper-local
- Bias towards nearby intent, local trust, and practical convenience.
- Include strong city/district framing in discovery and comparison prompts.""",
        LocalityTier.NATIONAL: """### Combo focus: Generic + National
- Bias towards country-wide relevance, consistency, and remote confidence.
- Include regional comparison while keeping national purchase intent.""",
        LocalityTier.GLOBAL: """### Combo focus: Generic + Global
- Bias towards universal use cases and globally comparable decision criteria.
- Keep levels 1-3 non-local and broadly relatable.""",
    }

    return combo_specs.get((btype, tier), default_specs[tier])


def _build_business_context_block(business: AuditRequest) -> str:
    """Build a maximal, structured context block with all known business data."""
    locality = (business.localityTier or LocalityTier.GLOBAL).value
    payload = {
        "identity": {
            "businessName": business.businessName,
            "businessUrl": business.businessUrl,
            "businessType": business.businessType,
            "category": business.category,
            "description": business.description,
            "language": business.language,
            "localityTier": locality,
        },
        "location": {
            "country": business.country,
            "region": business.region,
            "city": business.city,
            "neighborhood": business.neighborhood,
            "street": business.street,
        },
        "offer": {
            "servicesOrProducts": business.servicesOrProducts,
            "targetKeywords": business.targetKeywords,
            "uniqueSellingPoints": business.uniqueSellingPoints,
            "targetAudience": business.targetAudience,
            "priceRange": business.priceRange,
            "yearFounded": business.yearFounded,
            "certifications": business.certifications,
        },
        "market": {
            "competitorNames": business.competitorNames,
            "competitorUrls": business.competitorUrls,
            "subUrls": business.subUrls,
            "socialMediaUrls": business.socialMediaUrls,
        },
        "customFields": business.customFields or {},
    }
    return json.dumps(payload, ensure_ascii=False, indent=2)


def _build_geo_instructions(business: AuditRequest) -> str:
    """Build geography instructions calibrated to the locality tier."""

    tier = business.localityTier or LocalityTier.GLOBAL

    # Collect location parts
    parts = []
    if business.neighborhood:
        parts.append(f"Neighborhood: {business.neighborhood}")
    if business.city:
        parts.append(f"City: {business.city}")
    if business.region:
        parts.append(f"Region: {business.region}")
    if business.country:
        parts.append(f"Country: {business.country}")
    location_block = "\n".join(f"- {p}" for p in parts) if parts else "(No location data provided)"

    if tier == LocalityTier.HYPER_LOCAL:
        return f"""## Geography — HYPER-LOCAL business
Location data:
{location_block}

Geography rules for prompt generation:
- Levels 1-2: Use neighborhood names, street references, or city districts. NEVER use country alone.
  Example (FR): "un bon coffee shop vers Belleville pour bosser ?" NOT "un bon coffee shop en France ?"
  Example (EN): "decent coffee near Shoreditch with wifi?" NOT "good coffee in the UK?"
- Level 3: Can widen to city level ("dans Paris", "in London")
- Levels 4-5: Can mention city or wider area alongside specific business details
- At least 30% of Level 1-2 prompts must reference a specific neighborhood or district"""

    elif tier == LocalityTier.NATIONAL:
        return f"""## Geography — NATIONAL business
Location data:
{location_block}

Geography rules for prompt generation:
- Level 1: Use country-level references ("in France", "en Allemagne")
- Level 2-3: Can use region or city ("Ile-de-France", "based in Berlin")
- Levels 4-5: Mix of country + specific business characteristics
- NEVER use neighborhood-level specificity — this business serves the whole country"""

    else:  # GLOBAL
        return f"""## Geography — GLOBAL business
Location data:
{location_block}

Geography rules for prompt generation:
- Levels 1-3: NO geographic filter at all. Prompts should be location-agnostic.
  Example: "best project management tool for remote teams?" NOT "best project management tool in France?"
- Levels 4-5: May reference the brand's country of origin as a descriptive detail, not a filter
- NEVER force geographic terms into prompts — this business serves a global audience"""


def _build_system_prompt(business: AuditRequest) -> str:
    """Build the comprehensive system prompt for the LLM prompt generator."""

    lang_instruction = "French" if business.language == "fr" else "English"
    business_context_block = _build_business_context_block(business)
    geo_instructions = _build_geo_instructions(business)
    type_playbook = _business_type_playbook(business)
    combo_playbook = _business_type_tier_combo_playbook(business)

    # Build language-specific tone examples
    if business.language == "fr":
        tone_examples = """
BAD (robotic): "Quels sont les meilleurs cafes de specialite en France ?"
GOOD (human): "Je bosse en remote dans le 11e, tu connais un bon coffee avec du wifi ?"

BAD (robotic): "Recommandez des plateformes e-commerce de chaussures artisanales en cuir"
GOOD (human): "C'est bientot l'anniv de ma copine, je cherche des bottines en cuir faites en France, t'as des idees ?"

BAD (robotic): "Quel est le meilleur restaurant japonais de Paris ?"
GOOD (human): "On sort entre potes ce soir, un bon japonais pas trop cher vers Bastille ?"

BAD (robotic): "Comparez les solutions SaaS de gestion de projet"
GOOD (human): "On est une petite equipe de 5, on galere avec Notion, c'est quoi les alternatives ?"
"""
    else:
        tone_examples = """
BAD (robotic): "What are the best specialty coffee cafes in France?"
GOOD (human): "I'm working remotely in the 11th, need a good coffee spot with wifi — any ideas?"

BAD (robotic): "Recommend artisanal leather shoe e-commerce platforms"
GOOD (human): "My girlfriend's birthday is coming up, I want nice leather boots made in France — where should I look?"

BAD (robotic): "What is the best Japanese restaurant in Paris?"
GOOD (human): "Going out with friends tonight, any good Japanese spots near Bastille that aren't too pricey?"

BAD (robotic): "Compare SaaS project management solutions"
GOOD (human): "We're a small team of 5, struggling with Notion — what are the alternatives?"
"""

    total = app_config.PROMPT_COUNT
    per_level = total // 5
    ultra_broad = max(1, per_level // 4)  # ~25% of level 1
    filtered = per_level - ultra_broad
    min_per_category = max(2, total // 6 - 2)  # generous floor

    # Build ID ranges per level
    def _range(lvl: int) -> str:
        start = (lvl - 1) * per_level + 1
        end = lvl * per_level
        return f"{start}-{end}"

    return f"""You are an expert in GEO (Generative Engine Optimization). Generate exactly {total} prompts
to test the visibility of a business in AI engine responses.

## Business Metadata
- Business Name: {business.businessName}
- Website URL: {business.businessUrl}
- Business Type: {business.businessType}
- Category: {business.category}
- Description: {business.description}
- Locality Tier: {(business.localityTier or LocalityTier.GLOBAL).value}

## Structured Business Intelligence (use this heavily)
```json
{business_context_block}
```

Rules for context usage:
- Use ONLY facts from the metadata above; never invent unsupported details.
- Reuse competitor names/URLs, services/products, audience, pricing cues, certifications, and location signals when present.
- If a field is null/empty, do not fabricate it; adapt the prompt style accordingly.
- Make prompts feel naturally varied while still grounded in this business context.

## Language
Generate ALL prompts in: {lang_instruction}

## Mandatory Step 0 (Web Research Before Writing)
- First, perform web research to identify the business precisely using:
  - the business name
  - the primary website URL
  - any provided sub-URLs and competitor references
- Use this research to refine terminology, offerings, positioning, and realistic comparison context.
- If web findings conflict with provided metadata, trust provided metadata as source of truth.
- Do not output the research process. Only output the final JSON prompt list.

## CRITICAL: TONE — Write like a real human, not a textbook

Every prompt must sound like something a real person would actually type into ChatGPT or Perplexity.
Real people are casual, specific about their situation, and often include context about WHY they're asking.

{tone_examples}

### Mandatory rules for natural tone:
1. Use contractions, informal language, filler words ("actually", "honestly", "kinda")
2. Include real-life REASONS: "for a date", "to work from", "before my meeting", "with friends", "for my mom's birthday"
3. Use at least 5 DIFFERENT PERSONAS across the {total} prompts:
   - Local resident looking for a spot
   - Tourist or visitor exploring the area
   - Student on a budget
   - Remote worker needing a workspace
   - Parent looking for family-friendly options
   - Foodie or enthusiast seeking quality
   - Someone planning a special occasion (date, birthday, anniversary)
   - Professional looking for business meetings
4. NEVER use marketing language: "premium", "top-rated", "best-in-class", "leading"
5. Vary sentence structure: questions, incomplete sentences, conversational fragments
   OK: "good coffee near me with outlets?"
   OK: "I need a spot to work from this afternoon, somewhere chill with decent coffee"
   OK: "know any places like [competitor] but less crowded?"

{geo_instructions}

{type_playbook}

{combo_playbook}

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
These sound like "I heard about this place that does X in Y..."

### Level 5 — DIRECT ({per_level} prompts, IDs {_range(5)})
Queries that EXPLICITLY NAME the business or URL. Vary formulations: direct question, opinion request, info request.
These sound like someone who found the name and wants to know more before committing.

## Intent Categories (6 types)
Each prompt MUST be tagged with ONE intent category:
- discovery: Would the AI recommend this business? ("know any good X?")
- comparison: Comparison with competitors ("X vs Y", "something like X but...")
- reputation: Reviews/reliability/trust ("has anyone tried X?", "is X legit?")
- product: Knowledge of products/services ("what do they serve at X?", "does X have Y?")
- alternative: The business as an alternative to a competitor ("something like [competitor] but...")
- trust: Security/reliability of purchase ("safe to order from X?", "do they deliver on time?")

Distribute categories EVENLY across the {total} prompts. Each category must appear at least {min_per_category} times.

## OUTPUT FORMAT

CRITICAL: Your response MUST be EXCLUSIVELY valid JSON.
Return NO text outside the JSON. No markdown, no explanation, no comments, no ```json```.
Only raw JSON.

Expected format:
[
  {{"id": 1, "level": 1, "category": "discovery", "question": "I need a good spot to work from this afternoon, somewhere with decent wifi and coffee — any ideas?"}},
  {{"id": 2, "level": 1, "category": "comparison", "question": "what's better for remote work, a coworking space or just finding a nice cafe?"}}
]

VERIFY:
- Exactly {total} prompts (id 1 to {total})
- {per_level} prompts per level (level 1 to 5)
- Each prompt has id, level, category, question
- Categories are well distributed (min {min_per_category} per category)
- Level 1: {ultra_broad} ultra-broad (id 1-{ultra_broad}) + {filtered} filtered (id {ultra_broad + 1}-{per_level})
- Level 5: all {per_level} explicitly mention the business name or URL
- ALL prompts sound natural and human — reject anything that sounds like a textbook query
- The JSON is valid and parsable"""


def _strip_markdown_code_blocks(text: str) -> str:
    """Remove markdown code block wrappers if present."""
    text = text.strip()
    if text.startswith("```json"):
        text = text[7:]
    elif text.startswith("```"):
        text = text[3:]
    if text.endswith("```"):
        text = text[:-3]
    return text.strip()


def _validate_prompts(prompts: list[dict]) -> list[str]:
    """Validate the generated prompts. Returns list of errors (empty = valid)."""
    errors = []
    total = app_config.PROMPT_COUNT
    per_level = total // 5
    min_per_category = max(2, total // 6 - 2)

    if len(prompts) != total:
        errors.append(f"Expected {total} prompts, got {len(prompts)}")
        return errors  # Can't validate further

    # Check IDs
    ids = [p.get("id") for p in prompts]
    expected_ids = list(range(1, total + 1))
    if sorted(ids) != expected_ids:
        errors.append(f"IDs should be 1-{total}, got: {sorted(ids)[:5]}...{sorted(ids)[-5:]}")

    # Check levels: exactly per_level per level
    for level in range(1, 6):
        level_prompts = [p for p in prompts if p.get("level") == level]
        if len(level_prompts) != per_level:
            errors.append(f"Level {level} has {len(level_prompts)} prompts, expected {per_level}")

    # Check categories: each at least min_per_category
    valid_categories = {"discovery", "comparison", "reputation", "product", "alternative", "trust"}
    cat_counts = Counter(p.get("category") for p in prompts)
    for cat in valid_categories:
        count = cat_counts.get(cat, 0)
        if count < min_per_category:
            errors.append(f"Category '{cat}' has {count} prompts, minimum {min_per_category} required")

    # Check invalid categories
    for cat in cat_counts:
        if cat not in valid_categories:
            errors.append(f"Invalid category: '{cat}'")

    # Check all required fields
    for p in prompts:
        missing = [f for f in ("id", "level", "category", "question") if f not in p]
        if missing:
            errors.append(f"Prompt {p.get('id', '?')} missing fields: {missing}")
            break  # One is enough

    return errors


def _generate_mock_prompts(business: AuditRequest) -> list[GeneratedPrompt]:
    """Generate deterministic fake prompts without any AI calls."""
    total = app_config.PROMPT_COUNT
    per_level = total // 5
    categories = list(app_config.VALID_CATEGORIES)

    templates = {
        "discovery": "What is the best {category_label} for {name}?",
        "comparison": "How does {name} compare to other options in {btype}?",
        "reputation": "Is {name} a good choice for {btype} services?",
        "product": "What products does {name} offer in {btype}?",
        "alternative": "What are some alternatives to {name} in {btype}?",
        "trust": "Can I trust {name} for {btype} services?",
    }

    prompts = []
    for i in range(1, total + 1):
        level = (i - 1) // per_level + 1
        level = min(level, 5)
        cat = categories[(i - 1) % len(categories)]
        template = templates[cat]
        question = template.format(
            name=business.businessName,
            btype=business.businessType or "business",
            category_label=business.category or "services",
        )
        prompts.append(GeneratedPrompt(id=i, level=level, category=cat, question=question))

    logger.info(f"[MOCK] Generated {len(prompts)} fake prompts (no AI calls)")
    return prompts


async def generate_prompts(business: AuditRequest) -> list[GeneratedPrompt]:
    """
    Generate tailored prompts for the business using a high-end LLM.

    Count is determined by config.PROMPT_COUNT (default 100).
    Raises RuntimeError if generation fails after retries.
    """
    import asyncio

    if app_config.MOCK_AI:
        return _generate_mock_prompts(business)

    system_prompt = _build_system_prompt(business)

    if app_config.LOCAL_AI_MODE:
        api_key = "ollama-local"
        caller = call_ollama_api
        model = app_config.OLLAMA_MODEL
        caller_kwargs = {
            "base_url": app_config.OLLAMA_BASE_URL,
            "max_tokens": PROMPT_GENERATION_MAX_TOKENS,
            "temperature": 0.7,
        }
        logger.info(f"Prompt generation using local Ollama model: {model}")
    elif app_config.CLAUDE_CODE_LOCAL_MODE:
        api_key = "claude-code-local"
        caller = call_claude_code_cli
        model = "claude-code-local"
        caller_kwargs = {}
        logger.info("Prompt generation using local claude CLI (subscription)")
    else:
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise RuntimeError("OPENAI_API_KEY not set — cannot generate prompts")
        caller = call_openai_api
        model = "gpt-5.4"
        caller_kwargs = {
            "max_tokens": PROMPT_GENERATION_MAX_TOKENS,
            "temperature": 0.7,
            "use_web_search": True,
        }

    last_error = ""

    for attempt in range(MAX_ATTEMPTS):
        message = system_prompt
        if attempt > 0 and last_error:
            message += f"\n\n## RETRY — Previous attempt had errors:\n{last_error}\nPlease fix these issues."

        logger.info(f"Generating prompts (attempt {attempt + 1}/{MAX_ATTEMPTS})...")

        result = await asyncio.to_thread(
            caller,
            api_key,
            message,
            model,
            **caller_kwargs,
        )

        if not result["success"]:
            last_error = result.get("error", "Unknown API error")
            logger.warning(f"Prompt generation API call failed: {last_error}")
            continue

        raw_text = result["response"]
        if not raw_text:
            last_error = "Empty response from LLM"
            continue

        # Parse JSON
        clean_text = _strip_markdown_code_blocks(raw_text)
        try:
            prompts_data = json.loads(clean_text)
        except json.JSONDecodeError as e:
            last_error = f"JSON parse error: {e}"
            logger.warning(f"Failed to parse prompt JSON: {e}")
            continue

        if not isinstance(prompts_data, list):
            last_error = "Response is not a JSON array"
            continue

        # Validate
        validation_errors = _validate_prompts(prompts_data)
        if validation_errors:
            last_error = "; ".join(validation_errors)
            logger.warning(f"Prompt validation failed: {last_error}")
            continue

        # Success — convert to GeneratedPrompt models
        generated = [
            GeneratedPrompt(
                id=p["id"],
                level=p["level"],
                category=p["category"],
                question=p["question"],
            )
            for p in prompts_data
        ]

        logger.info(f"Successfully generated {len(generated)} prompts")
        return generated

    raise RuntimeError(f"Failed to generate valid prompts after {MAX_ATTEMPTS} attempts: {last_error}")
