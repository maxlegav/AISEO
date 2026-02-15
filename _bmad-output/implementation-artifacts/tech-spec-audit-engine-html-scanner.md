---
title: 'AISEO Audit Engine & HTML Scanner — Python Server'
slug: 'audit-engine-html-scanner'
created: '2026-02-11'
status: 'review-complete'
stepsCompleted: [1, 2, 3, 4]
tech_stack:
  - python@3.11
  - fastapi@0.109+
  - motor@3.3+ (async MongoDB driver)
  - openai@1.10+
  - anthropic@0.18+
  - google-generativeai@0.3+
  - rapidfuzz (fuzzy matching)
  - beautifulsoup4@4.12+ (HTML parsing)
  - extruct@0.15+ (schema.org extraction)
  - nltk (stopwords for keyword extraction)
  - lychee (Rust link checker binary)
  - vnu.jar (W3C HTML validator)
  - docker + docker-compose
files_to_modify:
  - server/src/routes/audit.py (complete rewrite)
  - server/src/main.py (add MongoDB lifespan, new routers)
  - server/src/utils/dbal/ai_api_wrapper.py (fix OpenAI + Perplexity bugs)
  - server/requirements.txt (add motor, rapidfuzz, beautifulsoup4, extruct, scikit-learn, nltk, lxml, httpx)
  - server/Dockerfile (multi-stage: add vnu.jar + lychee + JRE)
  - docker-compose.yml (update resource limits)
files_to_create:
  - server/src/config.py (MongoDB connection, env validation)
  - server/src/models/__init__.py
  - server/src/models/audit.py (Pydantic models matching MongoDB schema)
  - server/src/models/business.py (flexible business metadata model)
  - server/src/services/__init__.py
  - server/src/services/prompt_generator.py (LLM-based 100-prompt generation)
  - server/src/services/ai_executor.py (parallel async AI querying)
  - server/src/services/mention_detector.py (regex + fuzzy mention detection)
  - server/src/services/scoring.py (full scoring pipeline)
  - server/src/services/html_scanner.py (W3C, Lychee, schema.org, meta, headings, alt, keywords)
  - server/src/routes/html_scan.py (HTML scanner endpoint)
code_patterns:
  - Standardized AI API response format { success, response, metadata, error }
  - Bearer token authentication via verify_bearer_token
  - FastAPI async patterns with Motor for MongoDB
  - Snapshot pattern for business data in audits
  - Service layer pattern (routes → services → DB)
  - Parallel async execution with asyncio.gather()
test_patterns:
  - pytest + pytest-asyncio for async tests
  - httpx.AsyncClient for FastAPI endpoint testing
  - Mock AI API responses for unit tests (avoid real API calls)
  - Fixture-based test data (sample business, sample prompts, sample AI responses)
---

# Tech-Spec: AISEO Audit Engine & HTML Scanner — Python Server

**Created:** 2026-02-11

## Overview

### Problem Statement

The Python server has a solid foundation (FastAPI, AI API wrappers for 6 providers, Docker, Bearer auth) but the audit pipeline is incomplete and buggy. The current `audit.py` has critical bugs (inverted logic, attribute access errors, sequential execution only), hardcodes business types (coffeeShop/restaurant), and uses static JSON question files. It needs a complete overhaul to become a production-ready audit engine that:

- Dynamically generates 100 tailored prompts via a high-end LLM for **any** business type
- Queries 4 AI engines in parallel with proper error handling
- Detects business mentions in AI responses using regex + fuzzy matching
- Calculates a comprehensive scoring pipeline (per-response, per-prompt, per-category, per-level, global)
- Analyzes website HTML for technical SEO health (schema.org, meta tags, headings, alt text, links)
- Computes the final GEO Score (auditEngine * 0.7 + htmlScanner * 0.3)
- Writes everything to MongoDB

### Solution

Build the complete audit pipeline in the Python server with 3 major components:

1. **Dynamic Prompt Generator** — Use a high-end LLM (GPT-4o or Claude Sonnet) to generate 100 prompts tailored to any business. The LLM receives rich business metadata and knows exactly which params are available. Prompts follow 5 specificity levels x 6 intent categories as defined in audit-engine-spec.md.

2. **AI Querying & Scoring Engine** — Execute 100 prompts across 4 AI engines (ChatGPT, Claude, Perplexity, Gemini) in parallel using async workers. Detect mentions via regex + fuzzy matching. Calculate quality (0-3), position, and aggregate scores at every level.

3. **HTML Scanner** — Containerized analysis using W3C validator (vnu.jar), Lychee link checker, and Python libraries (extruct, BeautifulSoup, scikit-learn) for schema.org, meta tags, heading structure, image alt text, and keyword extraction. Produces an HTML Scanner Score (0-100).

The server computes the final GEO Score and writes the complete audit document (prompts, raw responses, scores, HTML scan) to MongoDB.

### Scope

**In Scope:**
- Fix all existing bugs in audit.py (inverted logic, attribute errors, sequential-only execution)
- Fix OpenAI and Perplexity API wrappers (wrong API method: Responses API → Chat Completions API)
- Replace hardcoded business types with flexible, business-type-agnostic metadata model
- LLM-based dynamic prompt generation (high-end model) with full business context
- Parallel async AI querying (4 engines) with exponential backoff and rate limit handling
- Mention detection engine (regex exact match + URL variants + fuzzy matching)
- Full scoring pipeline: response score → prompt score → category scores → level scores → audit engine score (0-100)
- Competitor analysis (same 100 prompts, separate scoring per competitor)
- Discoverability threshold calculation
- HTML Scanner: W3C validation (vnu.jar), Lychee link checking, schema.org detection (extruct), meta tag analysis, heading structure, alt text audit, keyword extraction (TF-IDF via scikit-learn)
- HTML Scanner Score (0-100) calculation
- GEO Score calculation: auditEngineScore * 0.7 + htmlScannerScore * 0.3
- MongoDB integration via Motor async driver (write full Audit document per audit-engine-spec schema)
- Docker multi-stage build (Python + vnu.jar/JRE + Lychee binary)
- Proper async architecture with progress tracking
- Status flow: pending → processing → review_pending / failed

**Out of Scope:**
- Next.js API endpoints (separate tech-spec)
- Admin review dashboard UI
- PDF report generation
- Email notifications
- Admin validation flow (completed/rejected status transitions)
- Production deployment (AWS Lambda/ECS)
- Rate limiting with Upstash Redis (Next.js concern)

## Context for Development

### Codebase Patterns

**Existing patterns (keep):**
- AI API wrappers return standardized `{ success, response, metadata, error }` format
- Bearer token auth via `verify_bearer_token` dependency
- FastAPI with async lifespan handlers
- Environment variables for all API keys and secrets
- Docker container runs as non-root `appuser`

**New patterns (introduce):**
- Service layer: routes call services, services call DB/APIs — keeps routes thin
- Motor async MongoDB: single global `AsyncIOMotorClient`, closed on app shutdown
- `asyncio.gather()` for parallel AI engine execution (4 concurrent workers)
- Pydantic v2 models for request validation and MongoDB document structure
- Multi-stage Docker build for external tool binaries (vnu.jar, lychee)

### Files to Reference

| File | Purpose |
| ---- | ------- |
| `server/src/routes/audit.py` | Current audit endpoint — complete rewrite needed |
| `server/src/utils/dbal/ai_api_wrapper.py` | AI provider wrappers — fix OpenAI + Perplexity, keep Anthropic + Gemini |
| `server/src/main.py` | FastAPI app entry point — add Motor lifecycle + new routers |
| `server/src/auth.py` | Bearer token authentication — keep as-is |
| `server/Dockerfile` | Docker build — needs multi-stage for vnu.jar + lychee |
| `docker-compose.yml` | Local dev orchestration — update resources |
| `server/.env` | Environment variables (API keys, MongoDB URI already present) |
| `_bmad-output/planning-artifacts/audit-engine-spec.md` | **PRIMARY REFERENCE** — Authoritative spec for scoring, prompts, detection (in French) |
| `_bmad-output/planning-artifacts/architecture.md` | Architecture decisions |
| `WebSite/models/Business.ts` | Business model (reference for snapshot fields) |

### Technical Decisions

**Confirmed in investigation:**

1. **MongoDB driver**: **Motor** (async) — required for FastAPI async/await, non-blocking during long audit processing. Database name: `ShowYourBrand` (matches Next.js).

2. **Prompt generation model**: High-end (GPT-4o / Claude Sonnet) — prompt quality drives entire audit quality. ~$0.01-0.05 per generation.

3. **AI engines for querying**: ChatGPT (gpt-4o-mini), Claude (haiku), Perplexity (sonar), Gemini (flash) — cheap/fast models for the 400 queries.

4. **Business types**: Not hardcoded — flexible metadata model. LLM prompt generator receives all available params and adapts to any business.

5. **Mention detection**: Regex + fuzzy via `rapidfuzz` (faster C-based alternative to fuzzywuzzy). Not LLM-as-judge — fast, cheap, sufficient.

6. **GEO Score**: Calculated server-side in Python, stored in audit document.

7. **HTML Scanner tools**:
   - **vnu.jar** (W3C Nu Html Checker) — Java-based, run via subprocess, can also run as persistent HTTP service
   - **Lychee** — Rust binary for fast link checking, run via subprocess with JSON output
   - **extruct** — Python library, best option for schema.org (JSON-LD, microdata, RDFa, OpenGraph)
   - **BeautifulSoup + lxml** — meta tags, heading structure, image alt text analysis
   - **scikit-learn TfidfVectorizer** — keyword extraction (top 30, unigrams + bigrams)

8. **API wrapper fixes needed**:
   - **OpenAI**: Uses `client.responses.create()` (Responses API) → must change to `client.chat.completions.create()` (Chat Completions API)
   - **Perplexity**: Same bug — uses Responses API, missing model param, missing messages list → must use Chat Completions format
   - **Anthropic**: Correct as-is
   - **Gemini**: Correct as-is

### Known Bugs to Fix

| File | Line | Bug | Fix |
| ---- | ---- | --- | --- |
| `audit.py` | 77 | `businessDataArchitecture(request)` — request is dict, not unpacked | Complete rewrite (new model) |
| `audit.py` | 158-166 | Inverted logic — skips questions WITH valid params | Complete rewrite |
| `audit.py` | 171 | `business_data.question_param` — string used as attribute | Complete rewrite |
| `audit.py` | 83 | Writes to `data/raw/` which doesn't exist | Complete rewrite (use MongoDB) |
| `audit.py` | 147-153 | Only loops `generic_questions`, ignores `specific_questions` | Complete rewrite |
| `ai_api_wrapper.py` | 54-62 | OpenAI uses Responses API instead of Chat Completions | Fix to `chat.completions.create()` |
| `ai_api_wrapper.py` | 303-309 | Perplexity uses Responses API, missing model and messages | Fix to `chat.completions.create()` with messages |

---

## Implementation Plan

### Tasks

Tasks are ordered by dependency — each task builds on the previous ones.

---

#### PHASE 1: Infrastructure & Foundations

- [x] **Task 1: Update requirements.txt with all new dependencies**
  - File: `server/requirements.txt`
  - Action: Add the following packages:
    ```
    motor>=3.3.0
    rapidfuzz>=3.0.0
    beautifulsoup4>=4.12.0
    lxml>=4.9.0
    extruct>=0.15.0
    scikit-learn>=1.3.0
    nltk>=3.8.0
    httpx>=0.25.0
    pytest>=7.4.0
    pytest-asyncio>=0.23.0
    ```
  - Notes: Keep existing deps (fastapi, uvicorn, pydantic, openai, anthropic, google-generativeai, selenium, python-dotenv). Remove `progressbar` (unused).

- [x] **Task 2: Create config.py — MongoDB connection + environment validation**
  - File: `server/src/config.py` (NEW)
  - Action: Create centralized config module with:
    - Motor `AsyncIOMotorClient` initialization from `MONGODB_URI` env var
    - Database reference: `db = client.ShowYourBrand` (must match Next.js database name)
    - Collection references: `db.audits`, `db.businesses`, `db.users`
    - Environment validation: check all required env vars on import (`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GEMINI_API_KEY`, `PERPLEXITY_API_KEY`, `MONGODB_URI`, `PROCESSING_SERVICE_API_KEY`)
    - `close_db()` async function for shutdown cleanup
    - Constants: `AI_ENGINES` list, `PROMPT_COUNT = 100`, `MIN_ENGINES_REQUIRED = 2`, `AUDIT_TIMEOUT_SECONDS = 600`
  - Notes: Single global client instance, reused across all requests. Connection pooling is handled by Motor internally.

- [x] **Task 3: Create business metadata Pydantic model (flexible, type-agnostic)**
  - File: `server/src/models/business.py` (NEW)
  - File: `server/src/models/__init__.py` (NEW)
  - Action: Create `AuditRequest` Pydantic model that accepts any business type. The model should include:
    ```python
    class AuditRequest(BaseModel):
        # Required fields — every business must provide these
        auditId: str                          # MongoDB ObjectId string, created by Next.js
        businessId: str                       # MongoDB ObjectId string
        userId: str                           # MongoDB ObjectId string

        # Core business identity
        businessName: str                     # Brand/business name (e.g., "MaisonCuir")
        businessUrl: str                      # Primary website URL
        businessType: str                     # Free-text type (e.g., "coffee-shop", "e-commerce", "saas", "restaurant", "dentist")
        category: str                         # Business category (e.g., "artisanal leather shoes", "specialty coffee")
        description: str                      # Business description (2-5 sentences)
        language: str = "fr"                  # Language for prompts ("fr" or "en")

        # Location (optional — for local businesses)
        city: str | None = None
        neighborhood: str | None = None
        street: str | None = None
        country: str | None = None
        region: str | None = None

        # Business details (optional — enriches prompt quality)
        subUrls: list[str] = []              # Sub-pages to analyze (e.g., /blog, /shop)
        competitorUrls: list[str] = []       # Competitor URLs (max 5)
        competitorNames: list[str] = []      # Competitor brand names
        targetKeywords: list[str] = []       # SEO target keywords
        uniqueSellingPoints: list[str] = []  # What makes the business special
        targetAudience: str | None = None    # Who the business serves
        priceRange: str | None = None        # Budget/mid/premium
        yearFounded: int | None = None       # When business was established
        servicesOrProducts: list[str] = []   # Main offerings
        certifications: list[str] = []       # Organic, fair-trade, ISO, etc.
        socialMediaUrls: list[str] = []      # Social presence

        # Any additional custom fields the business provides
        customFields: dict = {}              # Catch-all for business-specific data
    ```
  - Notes: The `customFields` dict allows ANY business to pass extra data. The prompt generator LLM receives ALL fields and adapts. Be creative with what you accept — the more data, the better the prompts. The LLM system prompt must list ALL available fields so it knows what it can use.

- [x] **Task 4: Create audit Pydantic models matching MongoDB schema**
  - File: `server/src/models/audit.py` (NEW)
  - Action: Create Pydantic models that match the MongoDB Audit schema from `audit-engine-spec.md` section 11. Key models:
    ```python
    class EngineResult(BaseModel):
        mentioned: bool = False
        quality: int = 0              # 0-3
        position: int = 0             # rank in response (0 = not mentioned)
        rawResponse: str = ""
        responseTime: int = 0         # milliseconds
        error: str | None = None

    class PromptResult(BaseModel):
        promptId: int                 # 1-100
        level: int                    # 1-5
        category: str                 # discovery, comparison, reputation, product, alternative, trust
        question: str
        engines: dict[str, EngineResult]  # {"chatgpt": ..., "claude": ..., etc.}
        promptScore: float = 0.0      # 0.0-1.0
        mentionRate: float = 0.0      # 0.0-1.0

    class CategoryScore(BaseModel):
        score: float = 0.0
        promptCount: int = 0
        avgMentionRate: float = 0.0

    class LevelScore(BaseModel):
        score: float = 0.0
        promptCount: int = 0
        avgMentionRate: float = 0.0

    class CompetitorResult(BaseModel):
        competitorUrl: str
        competitorName: str
        auditEngineScore: float = 0.0
        mentionRate: float = 0.0
        categoryScores: dict[str, float] = {}
        levelScores: dict[str, float] = {}

    class DiscoverabilityThreshold(BaseModel):
        level: int | None = None      # 1-5 or None if invisible
        description: str = ""

    class GeneratedPrompt(BaseModel):
        id: int                       # 1-100
        level: int                    # 1-5
        category: str                 # one of 6 categories
        question: str

    class BusinessSnapshot(BaseModel):
        name: str
        primaryUrl: str
        subUrls: list[str] = []
        competitorUrls: list[str] = []
        competitorNames: list[str] = []
        category: str
        description: str
        targetKeywords: list[str] = []
        businessType: str
        # Include all provided metadata for historical record
        allMetadata: dict = {}

    class HtmlScanResult(BaseModel):
        url: str
        w3cValidation: dict = {}       # vnu.jar results
        linkCheck: dict = {}           # Lychee results
        schemaOrg: dict = {}           # extruct results (JSON-LD, microdata, RDFa, OG)
        metaTags: dict = {}            # title, description, OG, Twitter Cards
        headingStructure: dict = {}    # H1-H6 hierarchy analysis
        imageAltText: dict = {}        # alt text audit
        keywords: list[dict] = []     # top 30 TF-IDF keywords
        htmlScannerScore: float = 0.0  # 0-100
        scanErrors: list[str] = []

    class AuditDocument(BaseModel):
        """Full audit document structure for MongoDB."""
        businessId: str
        userId: str
        status: str = "pending"       # pending, processing, review_pending, completed, rejected, failed
        businessSnapshot: BusinessSnapshot
        generatedPrompts: list[GeneratedPrompt] = []
        promptResults: list[PromptResult] = []
        categoryScores: dict[str, CategoryScore] = {}
        levelScores: dict[str, LevelScore] = {}
        auditEngineScore: float | None = None
        htmlScan: HtmlScanResult | None = None
        htmlScannerScore: float | None = None
        geoScore: float | None = None
        discoverabilityThreshold: DiscoverabilityThreshold | None = None
        competitorResults: list[CompetitorResult] = []
        enginesUsed: list[str] = []
        enginesSucceeded: list[str] = []
        totalPromptsProcessed: int = 0
        totalResponsesReceived: int = 0
        processingTimeMs: int = 0
        createdAt: str = ""           # ISO 8601
        completedAt: str | None = None
    ```
  - Notes: These models are used for validation and serialization. When writing to MongoDB, call `.model_dump()` to convert to dict. When reading from MongoDB, the `_id` field is an ObjectId — convert with `str()`.

- [x] **Task 5: Update main.py — MongoDB lifecycle + new routers**
  - File: `server/src/main.py`
  - Action:
    - Import `config` module in lifespan handler
    - On startup: validate MongoDB connection with `await config.db.command("ping")`, create indexes on `audits` collection
    - On shutdown: call `config.close_db()`
    - Add `MONGODB_URI` to required env vars list
    - Import and include new routers: `html_scan_router`
    - Keep existing routers (health, audit)
  - Notes: Indexes to create:
    ```python
    await config.db.audits.create_index([("businessId", 1), ("createdAt", -1)])
    await config.db.audits.create_index([("userId", 1), ("status", 1)])
    await config.db.audits.create_index([("status", 1), ("createdAt", -1)])
    ```

---

#### PHASE 2: Fix AI API Wrappers

- [x] **Task 6: Fix OpenAI wrapper — Responses API → Chat Completions API**
  - File: `server/src/utils/dbal/ai_api_wrapper.py`
  - Action: In `call_openai_api()` (lines 44-78), replace:
    ```python
    # BEFORE (wrong — Responses API):
    response = client.responses.create(
        model=model,
        tools=[{ "type": "web_search" }],
        input=message,
        **kwargs
    )
    assistant_message = response.output_text

    # AFTER (correct — Chat Completions API):
    messages = conversation_history.copy() if conversation_history else []
    messages.append({"role": "user", "content": message})
    response = client.chat.completions.create(
        model=model,
        messages=messages,
        **kwargs
    )
    assistant_message = response.choices[0].message.content
    ```
    Also fix metadata extraction: `response.choices[0].finish_reason` (this part was actually correct but inconsistent with the Responses API usage above).
    Remove the web_search tool (OpenAI Chat Completions doesn't support it natively).
  - Notes: The `use_web_search` param should be ignored for OpenAI (add a comment). Keep the standardized return format.

- [x] **Task 7: Fix Perplexity wrapper — Responses API → Chat Completions API**
  - File: `server/src/utils/dbal/ai_api_wrapper.py`
  - Action: In `call_perplexity_api()` (lines 293-335), replace:
    ```python
    # BEFORE (wrong — Responses API, missing model + messages):
    response = client.responses.create(
        input=message,
        **kwargs
    )
    assistant_message = response.output_text

    # AFTER (correct — Chat Completions API):
    messages = conversation_history.copy() if conversation_history else []
    messages.append({"role": "user", "content": message})
    response = client.chat.completions.create(
        model=model,
        messages=messages,
        **kwargs
    )
    assistant_message = response.choices[0].message.content
    messages.append({"role": "assistant", "content": assistant_message})
    ```
    Fix metadata: use `response.choices[0].finish_reason`, `response.usage.prompt_tokens`, etc.
  - Notes: Perplexity web search is activated by using "online" model variants (e.g., `llama-3.1-sonar-large-128k-online`), not via a parameter. The `use_web_search` flag can select between online/offline models.

---

#### PHASE 3: Dynamic Prompt Generator

- [x] **Task 8: Create prompt_generator.py — LLM-based 100-prompt generation**
  - File: `server/src/services/prompt_generator.py` (NEW)
  - File: `server/src/services/__init__.py` (NEW)
  - Action: Create service that generates 100 prompts via a high-end LLM. Implementation:
    1. Build a comprehensive **system prompt** that:
       - Explains the 5 specificity levels (Large, Niche, Quasi-direct, Semi-direct, Direct) with exactly 20 prompts each — see `audit-engine-spec.md` sections 3-4 for full descriptions
       - Explains the 6 intent categories (discovery, comparison, reputation, product, alternative, trust) — minimum 10 prompts per category
       - **Lists ALL available business metadata fields** and their values so the LLM knows what it can use in prompts
       - Specifies the JSON output format: `[{ "id": 1, "level": 1, "category": "discovery", "question": "..." }, ...]`
       - Includes the language preference for prompt generation
       - Includes examples per level (from audit-engine-spec.md section 3)
    2. Call the high-end LLM (GPT-4o via `call_openai_api` or Claude Sonnet via `call_anthropic_api`)
    3. Parse the JSON response
    4. **Validate** the generated prompts:
       - Exactly 100 prompts (IDs 1-100)
       - Exactly 20 per level (levels 1-5)
       - Each category has at least 10 prompts
       - Level 1: first 5 are ultra-broad, next 15 are category-filtered
       - Level 5: all 20 mention the business name or URL explicitly
       - All required fields present (id, level, category, question)
    5. If validation fails, retry once with error feedback
    6. Return `list[GeneratedPrompt]`

    Key function signature:
    ```python
    async def generate_prompts(business: AuditRequest) -> list[GeneratedPrompt]:
        """Generate 100 tailored prompts for the business using a high-end LLM."""
    ```

    The system prompt must explicitly tell the LLM which parameters are available. Example template (adapt from `audit-engine-spec.md` section 12):
    ```
    You are an expert in GEO (Generative Engine Optimization). Generate exactly 100 prompts
    to test the visibility of a business in AI engine responses.

    ## Business Metadata (all fields available for use in prompts)
    - Business Name: {businessName}
    - Website URL: {businessUrl}
    - Business Type: {businessType}
    - Category: {category}
    - Description: {description}
    - City: {city} (if provided)
    - Neighborhood: {neighborhood} (if provided)
    - Region: {region} (if provided)
    - Country: {country} (if provided)
    - Target Keywords: {targetKeywords} (if provided)
    - Unique Selling Points: {uniqueSellingPoints} (if provided)
    - Target Audience: {targetAudience} (if provided)
    - Price Range: {priceRange} (if provided)
    - Services/Products: {servicesOrProducts} (if provided)
    - Competitors: {competitorNames} (if provided)
    - Certifications: {certifications} (if provided)
    - Year Founded: {yearFounded} (if provided)
    - Custom Fields: {customFields} (if provided)

    ## Language
    Generate all prompts in: {language}

    ## Structure: 5 levels × 20 prompts each
    [... full level descriptions from audit-engine-spec.md section 3 ...]

    ## Categories (6 intent types)
    [... full category descriptions from audit-engine-spec.md section 4 ...]

    ## Output format
    Return ONLY valid JSON, no markdown, no explanation.
    [{ "id": 1, "level": 1, "category": "discovery", "question": "..." }, ...]
    ```
  - Notes: Use `json.loads()` to parse. If the LLM wraps in markdown code blocks, strip them first. The system prompt template is in `audit-engine-spec.md` section 12 (line 645+) — adapt it to include ALL the metadata fields.

---

#### PHASE 4: AI Execution Engine

- [x] **Task 9: Create ai_executor.py — parallel async AI querying**
  - File: `server/src/services/ai_executor.py` (NEW)
  - Action: Create service that sends 100 prompts to 4 AI engines in parallel. Implementation:
    1. Define the 4 engine configs:
       ```python
       ENGINES = [
           {"name": "chatgpt",    "caller": call_openai_api,      "model": "gpt-4o-mini",                      "key_env": "OPENAI_API_KEY"},
           {"name": "claude",     "caller": call_anthropic_api,    "model": "claude-haiku-4-5-20251001",        "key_env": "ANTHROPIC_API_KEY"},
           {"name": "perplexity", "caller": call_perplexity_api,   "model": "sonar",                            "key_env": "PERPLEXITY_API_KEY"},
           {"name": "gemini",     "caller": call_google_api,       "model": "gemini-2.0-flash-lite",            "key_env": "GEMINI_API_KEY"},
       ]
       ```
    2. Create `async def execute_engine(engine_config, prompts, business_name)` that:
       - Runs 100 prompts **sequentially** against one engine (to respect rate limits)
       - Implements **exponential backoff** on rate limit errors (1s → 2s → 4s → 8s, max 4 retries)
       - Timeout per request: 30 seconds
       - Records `responseTime` for each call
       - Returns list of `{promptId, rawResponse, responseTime, error}` per prompt
       - Catches all exceptions gracefully — a failed prompt returns `error` string, not a crash
    3. Create `async def execute_all_engines(prompts, business_name)` that:
       - Runs 4 engines **in parallel** using `asyncio.gather(*tasks, return_exceptions=True)`
       - Global timeout: 600 seconds (10 minutes)
       - Checks minimum 2/4 engines succeeded (at least 50+ responses each)
       - If fewer than 2 engines succeed, raise an error → audit status = `failed`
       - Returns dict: `{"chatgpt": [...results], "claude": [...results], ...}`
    4. The existing AI wrapper functions are synchronous — wrap them with `asyncio.to_thread()` or `loop.run_in_executor()` to make them non-blocking
  - Notes: The wrappers in `ai_api_wrapper.py` are sync functions. Use `await asyncio.to_thread(call_openai_api, api_key, message, model, use_web_search=True)` to run them in a thread pool without blocking the event loop. Each engine processes its 100 prompts sequentially within its thread, but all 4 engines run in parallel.

- [x] **Task 10: Create mention_detector.py — regex + fuzzy mention detection**
  - File: `server/src/services/mention_detector.py` (NEW)
  - Action: Implement mention detection per `audit-engine-spec.md` section 6. Functions:
    1. `generate_url_variants(url: str) -> list[str]` — Generate URL variants for matching:
       ```
       Input: "https://www.maisoncuir.fr"
       Output: ["maisoncuir.fr", "www.maisoncuir.fr", "https://maisoncuir.fr",
                "https://www.maisoncuir.fr", "maisoncuir"]
       ```
    2. `detect_mention(response: str, business_name: str, business_url: str) -> EngineResult` — Core detection:
       - Exact name match (case-insensitive): `business_name.lower() in response.lower()`
       - URL variant match: any variant found in response
       - Fuzzy match: `rapidfuzz.fuzz.partial_ratio(business_name.lower(), response.lower()) > 85`
       - If mentioned, calculate **quality (0-3)**:
         - 0 = not mentioned
         - 1 = mentioned in passing (name appears once, not in a structured list)
         - 2 = recommended among others (name in a numbered/bulleted list)
         - 3 = recommended first or response is focused on the business
       - Calculate **position** (rank in response):
         - Parse response for list patterns (numbered items, bullet points, paragraphs)
         - Determine which "slot" the business appears in
         - Position 1 = first mentioned, 2 = second, etc.
       - Return `EngineResult(mentioned=True/False, quality=0-3, position=N, rawResponse=response)`
    3. `calculate_quality(response: str, business_name: str) -> int` — Detect list structures (numbered: `1.`, `2.`; bullets: `-`, `•`, `*`) and determine if business is in a recommendation context
    4. `calculate_position(response: str, business_name: str) -> int` — Find rank of business in the response's recommendation list
  - Notes: See `audit-engine-spec.md` sections 6-7 for the exact algorithms. Quality detection uses regex to find list patterns. Position detection parses the response into segments and finds where the business name/URL first appears. For fuzzy matching, use `rapidfuzz.fuzz.partial_ratio` (C-based, much faster than `fuzzywuzzy`).

- [x] **Task 11: Create scoring.py — full scoring pipeline**
  - File: `server/src/services/scoring.py` (NEW)
  - Action: Implement the complete scoring pipeline per `audit-engine-spec.md` sections 7-9, 13. Functions:
    1. `calculate_response_score(quality: int, position: int) -> float` — Per-response score:
       ```
       responseScore = quality × positionMultiplier
       Position multipliers: rank 1 = ×1.5, rank 2-3 = ×1.0, rank 4+ = ×0.7, not mentioned = ×0.0
       Max score per response = 3 × 1.5 = 4.5
       ```
    2. `calculate_prompt_score(engine_results: dict[str, EngineResult]) -> tuple[float, float]` — Per-prompt aggregation:
       ```
       promptScore = Σ(responseScore per engine) / (engines_responded × 4.5)
       mentionRate = engines_that_mentioned / engines_responded
       Returns: (promptScore: 0.0-1.0, mentionRate: 0.0-1.0)
       ```
    3. `calculate_category_scores(prompt_results: list[PromptResult]) -> dict[str, CategoryScore]` — Group by category, average promptScore and mentionRate
    4. `calculate_level_scores(prompt_results: list[PromptResult]) -> dict[str, LevelScore]` — Group by level, average promptScore and mentionRate
    5. `calculate_audit_engine_score(category_scores: dict) -> float` — Weighted average per `audit-engine-spec.md` section 8.4:
       ```
       Category weights: discovery=2.0, comparison=1.5, reputation=1.2, product=1.0, alternative=1.5, trust=1.0
       auditEngineScore = Σ(categoryScore × weight) / Σ(weights) × 100
       Result: 0-100
       ```
    6. `calculate_discoverability_threshold(level_scores: dict) -> DiscoverabilityThreshold` — Find the lowest level where `avgMentionRate >= 0.25` (per section 13)
    7. `calculate_geo_score(audit_engine_score: float, html_scanner_score: float) -> float` — Final GEO Score:
       ```
       geoScore = auditEngineScore × 0.70 + htmlScannerScore × 0.30
       If html_scanner_score is None (scan failed): geoScore = auditEngineScore
       ```
    8. `score_competitor(prompt_results: list, competitor_name: str, competitor_url: str) -> CompetitorResult` — Run mention detection + scoring for a competitor across the same prompt results
  - Notes: All formulas are defined in `audit-engine-spec.md` sections 7-9. The category weights are critical — discovery is weighted 2x because "recommend me an X" is the #1 use case.

---

#### PHASE 5: HTML Scanner

- [x] **Task 12: Create html_scanner.py — complete HTML analysis service**
  - File: `server/src/services/html_scanner.py` (NEW)
  - Action: Create service that fetches a website and performs comprehensive HTML analysis. Functions:
    1. `async def fetch_page(url: str) -> str` — Fetch HTML content using `httpx` async client with:
       - User-agent: `"AISEO-Bot/1.0 (+https://aiseo.com)"` (per FR77)
       - Timeout: 30 seconds
       - Follow redirects
       - Respect robots.txt (check before fetching)
    2. `def validate_html_w3c(html: str) -> dict` — Run vnu.jar via subprocess:
       ```python
       result = subprocess.run(
           ['java', '-jar', '/app/vnu.jar', '--format', 'json', '-'],
           input=html, capture_output=True, text=True, timeout=30
       )
       ```
       Parse JSON output: count errors, warnings, info messages.
    3. `def check_links_lychee(url: str) -> dict` — Run Lychee via subprocess:
       ```python
       result = subprocess.run(
           ['lychee', '--format', 'json', '--timeout', '10', url],
           capture_output=True, text=True, timeout=60
       )
       ```
       Parse JSON: count total links, successful, failed, excluded.
    4. `def extract_schema_org(html: str, base_url: str) -> dict` — Use `extruct.extract()`:
       - Extract JSON-LD, microdata, RDFa, OpenGraph
       - Identify detected schema types (Organization, Product, FAQPage, BreadcrumbList, etc.)
       - Identify missing but recommended schema types
    5. `def analyze_meta_tags(html: str) -> dict` — Use BeautifulSoup:
       - Extract `<title>`, `<meta name="description">`, `<meta name="keywords">`
       - Extract OpenGraph tags (`og:title`, `og:description`, `og:image`, `og:type`, `og:url`)
       - Extract Twitter Card tags (`twitter:card`, `twitter:title`, `twitter:description`, `twitter:image`)
       - Extract canonical URL, robots meta
       - Flag missing/empty required tags
    6. `def analyze_headings(html: str) -> dict` — Use BeautifulSoup:
       - Extract all H1-H6 tags with their text content
       - Check: exactly 1 H1, H1 is first heading, no skipped levels (H1→H3 without H2)
       - Return: heading count per level, hierarchy analysis, issues list
    7. `def audit_images(html: str) -> dict` — Use BeautifulSoup:
       - Find all `<img>` tags
       - Check for: missing alt attribute, empty alt, generic alt ("image", "photo")
       - Return: total images, images with alt, compliance percentage, issues list
    8. `def extract_keywords(html: str, language: str = "fr") -> list[dict]` — Use scikit-learn TfidfVectorizer:
       - Strip `<script>`, `<style>`, `<nav>`, `<footer>` tags first
       - Get text content, apply stopwords (French + English via NLTK)
       - TF-IDF with unigrams + bigrams, top 30 keywords
       - Return: `[{"term": "chaussures artisanales", "score": 0.45}, ...]`
    9. `def calculate_html_scanner_score(scan_result: dict) -> float` — Weighted scoring (0-100):
       ```
       Components and weights:
       - W3C validation: 10% (fewer errors = higher score)
       - Link health: 10% (% of working links)
       - Schema.org: 20% (detected types / recommended types)
       - Meta tags: 20% (completeness of title, desc, OG, Twitter)
       - Heading structure: 15% (proper H1, no skipped levels)
       - Image alt text: 15% (% with proper alt text)
       - Keyword richness: 10% (diversity and relevance)
       ```
    10. `async def scan_website(url: str, sub_urls: list[str], language: str) -> HtmlScanResult` — Orchestrator:
        - Fetch primary URL + up to 5 sub-URLs
        - Run all analyses on each page
        - Aggregate results
        - Calculate overall HTML Scanner Score
        - Return `HtmlScanResult`
  - Notes: The scanner should be fault-tolerant — if vnu.jar or lychee fail, continue with other analyses and note the error. If the website is unreachable, return score 0 with error message. `subprocess.run` calls should always have `timeout` to prevent hanging.

- [x] **Task 13: Create html_scan route endpoint**
  - File: `server/src/routes/html_scan.py` (NEW)
  - Action: Create a standalone HTML scan endpoint for independent use:
    ```python
    @router.post("/html-scan")
    async def scan_html(
        _token: Annotated[str, Depends(verify_bearer_token)],
        request: HtmlScanRequest,  # { url: str, subUrls: list[str], language: str }
    ) -> JSONResponse:
    ```
    This endpoint runs the HTML scanner independently (useful for testing or on-demand scans without a full audit).
  - Notes: The main audit endpoint will also call the HTML scanner as part of the full pipeline. This standalone endpoint is for flexibility.

---

#### PHASE 6: Main Audit Pipeline (Rewrite audit.py)

- [x] **Task 14: Rewrite audit.py — complete audit pipeline endpoint**
  - File: `server/src/routes/audit.py` (COMPLETE REWRITE)
  - Action: Replace the entire file. The new endpoint orchestrates the full audit pipeline:
    ```python
    @router.post("/audit")
    async def run_audit(
        _token: Annotated[str, Depends(verify_bearer_token)],
        request: AuditRequest,
    ) -> JSONResponse:
    ```
    Pipeline steps (in order):
    1. **Update status** → `processing` in MongoDB:
       ```python
       await config.db.audits.update_one(
           {"_id": ObjectId(request.auditId)},
           {"$set": {"status": "processing"}}
       )
       ```
    2. **Create business snapshot** from request data (capture all metadata at audit time)
    3. **Generate 100 prompts** via `prompt_generator.generate_prompts(request)`
    4. **Store generated prompts** in audit document immediately (so admin can see them even if execution fails)
    5. **Execute AI queries in parallel** via `ai_executor.execute_all_engines(prompts, request.businessName)`
       - Run in parallel with HTML scan (step 6) using `asyncio.gather()`
    6. **Run HTML scanner** via `html_scanner.scan_website(request.businessUrl, request.subUrls, request.language)`
       - Runs in parallel with AI queries (step 5)
    7. **Detect mentions** for each prompt × each engine via `mention_detector.detect_mention()`
    8. **Detect competitor mentions** — for each competitor, run mention detection on all 400 responses
    9. **Calculate scores** via `scoring.py`:
       - Per-prompt scores and mention rates
       - Category scores (6 categories)
       - Level scores (5 levels)
       - Audit engine score (0-100)
       - HTML scanner score (0-100)
       - Competitor scores
       - Discoverability threshold
       - **GEO Score** = auditEngineScore × 0.7 + htmlScannerScore × 0.3
    10. **Write complete results** to MongoDB audit document:
        ```python
        await config.db.audits.update_one(
            {"_id": ObjectId(request.auditId)},
            {"$set": {
                "status": "review_pending",
                "businessSnapshot": snapshot.model_dump(),
                "generatedPrompts": [p.model_dump() for p in prompts],
                "promptResults": [r.model_dump() for r in prompt_results],
                "categoryScores": {k: v.model_dump() for k, v in cat_scores.items()},
                "levelScores": {k: v.model_dump() for k, v in level_scores.items()},
                "auditEngineScore": engine_score,
                "htmlScan": html_result.model_dump(),
                "htmlScannerScore": html_result.htmlScannerScore,
                "geoScore": geo_score,
                "discoverabilityThreshold": threshold.model_dump(),
                "competitorResults": [c.model_dump() for c in competitor_results],
                "enginesUsed": engines_used,
                "enginesSucceeded": engines_succeeded,
                "totalPromptsProcessed": 100,
                "totalResponsesReceived": total_responses,
                "processingTimeMs": processing_time,
                "completedAt": datetime.utcnow().isoformat(),
            }}
        )
        ```
    11. **Return success** with summary (auditId, geoScore, status)

    **Error handling:**
    - Wrap entire pipeline in try/except
    - On any unrecoverable error, update audit status to `failed` with error message
    - Log all errors with structured logging
    - If prompt generation fails → status = `failed` (can't continue without prompts)
    - If <2 engines succeed → status = `failed`
    - If HTML scan fails → continue (use auditEngineScore as geoScore)
  - Notes: Delete the old `coffeeShopData`, `restaurantData` classes, the `make_ai_questions` function, and all static question file loading. Remove `progressbar` import. The entire audit.py is a fresh start.

---

#### PHASE 7: Docker & Infrastructure

- [x] **Task 15: Update Dockerfile — multi-stage build with vnu.jar + lychee**
  - File: `server/Dockerfile`
  - Action: Rewrite as multi-stage build:
    ```dockerfile
    # Stage 1: Download vnu.jar
    FROM eclipse-temurin:11-jre-jammy AS vnu-stage
    RUN apt-get update && apt-get install -y wget && \
        wget -O /vnu.jar https://github.com/validator/validator/releases/download/latest/vnu.jar

    # Stage 2: Build lychee from pre-built binary
    FROM debian:bookworm-slim AS lychee-stage
    RUN apt-get update && apt-get install -y wget && \
        wget -O /usr/local/bin/lychee https://github.com/lycheeverse/lychee/releases/latest/download/lychee-x86_64-unknown-linux-gnu && \
        chmod +x /usr/local/bin/lychee

    # Stage 3: Final Python image
    FROM python:3.11-slim

    ENV PYTHONDONTWRITEBYTECODE=1 \
        PYTHONUNBUFFERED=1

    # Install JRE for vnu.jar + system deps
    RUN apt-get update && apt-get install -y --no-install-recommends \
        default-jre-headless \
        chromium \
        chromium-driver \
        libnss3 libxss1 libasound2 libatk-bridge2.0-0 libgtk-3-0 libgbm1 \
        curl \
        && rm -rf /var/lib/apt/lists/*

    # Copy tools from build stages
    COPY --from=vnu-stage /vnu.jar /app/vnu.jar
    COPY --from=lychee-stage /usr/local/bin/lychee /usr/local/bin/lychee

    # Create non-root user
    RUN useradd --create-home --shell /bin/bash appuser

    WORKDIR /app

    # Install Python dependencies
    COPY requirements.txt .
    RUN pip install --no-cache-dir -r requirements.txt

    # Download NLTK stopwords
    RUN python -c "import nltk; nltk.download('stopwords', download_dir='/usr/local/nltk_data')"

    # Copy source
    COPY src/ ./src/

    RUN chown -R appuser:appuser /app
    USER appuser

    EXPOSE 8080

    HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
        CMD curl -f http://localhost:8080/health || exit 1

    CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8080"]
    ```
  - Notes: The image will be larger (~800MB-1GB) due to JRE + Chromium + lychee. This is acceptable for a processing service. Start period increased to 15s for JRE warmup. Health check now hits `/health` instead of `/` (which requires auth).

- [x] **Task 16: Update docker-compose.yml — increase resources**
  - File: `docker-compose.yml`
  - Action: Update resource limits for the heavier processing:
    ```yaml
    deploy:
      resources:
        limits:
          memory: 4G    # was 2G — need more for JRE + Chromium + AI processing
          cpus: '2.0'   # was 1.0 — parallel AI execution benefits from more CPU
    ```
  - Notes: The 4 parallel AI workers + HTML scanning + JRE need more resources than before.

---

### Acceptance Criteria

#### Audit Engine

- [x] AC1: Given a valid `AuditRequest` with any business type, when POST `/audit` is called, then 100 prompts are generated by a high-end LLM tailored to that specific business, with exactly 20 per level (1-5) and at least 10 per category (6 categories).

- [x] AC2: Given 100 generated prompts, when the AI execution runs, then all 4 engines (ChatGPT, Claude, Perplexity, Gemini) are queried **in parallel** (not sequentially), and the total execution time is ~5-10 minutes (not 20-30 minutes).

- [x] AC3: Given an AI engine rate-limits a request, when exponential backoff is applied (1s → 2s → 4s → 8s, max 4 retries), then the request is retried automatically without crashing the pipeline.

- [x] AC4: Given fewer than 2 out of 4 AI engines return successful responses, when the minimum threshold check runs, then the audit status is set to `failed` with an explanatory error message.

- [x] AC5: Given an AI response that mentions the business name or URL, when mention detection runs, then `mentioned=true` with correct `quality` (0-3) and `position` (rank) values are returned.

- [x] AC6: Given a business name "MaisonCuir" and a response containing "Maison Cuir" (with space), when fuzzy matching runs with threshold >85, then the mention is detected.

- [x] AC7: Given all prompt results with mention data, when the scoring pipeline runs, then `promptScore`, `categoryScores`, `levelScores`, `auditEngineScore` (0-100), `discoverabilityThreshold`, and `competitorResults` are all calculated correctly per the formulas in `audit-engine-spec.md`.

- [x] AC8: Given a completed audit with `auditEngineScore=65` and `htmlScannerScore=40`, when GEO Score is calculated, then `geoScore = 65*0.7 + 40*0.3 = 57.5`.

- [x] AC9: Given a successful audit pipeline completion, when results are written to MongoDB, then the audit document matches the schema in `audit-engine-spec.md` section 11, with all fields populated, and status is set to `review_pending`.

- [x] AC10: Given an error during the audit pipeline (e.g., prompt generation fails), when the error handler catches it, then the audit status is updated to `failed` in MongoDB with an error description, and no partial/corrupted data is left.

#### HTML Scanner

- [x] AC11: Given a valid website URL, when the HTML scanner runs, then W3C validation (vnu.jar), link checking (Lychee), schema.org extraction (extruct), meta tag analysis, heading structure analysis, image alt text audit, and keyword extraction (TF-IDF top 30) all execute and return structured results.

- [x] AC12: Given an HTML page with missing meta description and no FAQ schema, when the scanner analyzes it, then these are correctly flagged in the results as issues.

- [x] AC13: Given all HTML scan sub-scores, when `htmlScannerScore` is calculated, then it returns a value 0-100 using the weighted formula (W3C 10%, links 10%, schema 20%, meta 20%, headings 15%, alt text 15%, keywords 10%).

- [x] AC14: Given the HTML scanner fails (website unreachable), when the audit pipeline continues, then `geoScore = auditEngineScore` (100% weight on engine score) and the scan error is logged.

#### API Wrappers

- [x] AC15: Given the OpenAI wrapper is called with `call_openai_api(key, "test message", "gpt-4o-mini")`, when it executes, then it uses `client.chat.completions.create()` with proper `messages` list format and returns the standardized response dict.

- [x] AC16: Given the Perplexity wrapper is called with `call_perplexity_api(key, "test", "sonar")`, when it executes, then it uses `client.chat.completions.create()` with `model` and `messages` parameters and returns the standardized response dict.

#### Infrastructure

- [x] AC17: Given `docker-compose up --build` is run, when the container starts, then the FastAPI server connects to MongoDB, vnu.jar is available at `/app/vnu.jar`, lychee is available at `/usr/local/bin/lychee`, and the `/health` endpoint returns 200.

- [x] AC18: Given the server starts, when MongoDB indexes are checked, then the 3 required indexes exist on the `audits` collection.

---

## Additional Context

### Dependencies

**Python packages (new):**
- `motor>=3.3.0` — async MongoDB driver
- `rapidfuzz>=3.0.0` — fast fuzzy string matching (C-based)
- `beautifulsoup4>=4.12.0` — HTML parsing
- `lxml>=4.9.0` — fast HTML/XML parser (BeautifulSoup backend)
- `extruct>=0.15.0` — schema.org structured data extraction
- `scikit-learn>=1.3.0` — TF-IDF keyword extraction
- `nltk>=3.8.0` — stopwords for keyword extraction
- `httpx>=0.25.0` — async HTTP client (for fetching web pages)
- `pytest>=7.4.0` — test framework
- `pytest-asyncio>=0.23.0` — async test support

**External tools (Docker):**
- `vnu.jar` — W3C Nu Html Checker (requires JRE 11+)
- `lychee` — Rust-based link checker binary

**API keys (already in .env):**
- `OPENAI_API_KEY` — ChatGPT querying + prompt generation
- `ANTHROPIC_API_KEY` — Claude querying
- `GEMINI_API_KEY` — Gemini querying
- `PERPLEXITY_API_KEY` — Perplexity querying
- `MONGODB_URI` — MongoDB Atlas (database: ShowYourBrand)
- `PROCESSING_SERVICE_API_KEY` — Bearer token auth

### MongoDB Schema

The Audit document follows the schema defined in `audit-engine-spec.md` section 11 (lines 466-632). Key collections:
- `audits` — main audit documents (~300-600KB each)

Required indexes:
- `{ businessId: 1, createdAt: -1 }` — audit history per business
- `{ userId: 1, status: 1 }` — user dashboard queries
- `{ status: 1, createdAt: -1 }` — admin pending-audits list

### Testing Strategy

**Unit Tests (no real API calls):**
- `test_mention_detector.py` — Test regex, URL variants, fuzzy matching, quality scoring, position detection with known inputs/outputs
- `test_scoring.py` — Test all scoring formulas with pre-computed expected values matching `audit-engine-spec.md` examples
- `test_prompt_validator.py` — Test prompt validation logic (100 prompts, 20/level, 10+/category)
- `test_html_scanner_scoring.py` — Test HTML scanner scoring formula with known HTML inputs

**Integration Tests (mock AI APIs):**
- `test_audit_pipeline.py` — Full pipeline with mocked AI responses: request → prompts → mocked AI results → mention detection → scoring → MongoDB write → verify document
- `test_html_scanner_integration.py` — Test scanner with a known HTML file (no network calls)

**Manual Testing:**
1. Build and start Docker: `docker-compose up --build`
2. Call `/health` endpoint — verify 200
3. Call `/audit` with a test business — verify complete pipeline
4. Check MongoDB for the audit document — verify all fields populated
5. Call `/html-scan` with a known URL — verify scan results
6. Test with a business that has competitors — verify competitor scoring

### Notes

- **Primary reference**: `audit-engine-spec.md` (in French) — contains ALL scoring formulas, prompt level definitions, category descriptions, and detection algorithms. The dev agent MUST read this file.
- Current static question files (`fr/generic.json`, `fr/coffee_shop.json`, `fr/restaurant.json`) are **deprecated** — delete or ignore them. LLM generates prompts dynamically.
- The OpenAI wrapper uses the Responses API (wrong) — must be fixed to Chat Completions API.
- The Perplexity wrapper has the same bug plus missing model parameter.
- Business metadata should be as rich as possible — the prompt generator LLM system prompt must list ALL available fields so it knows what to work with.
- Docker image will be ~800MB-1GB due to JRE + Chromium + lychee. Acceptable for a processing service.
- Consider running vnu.jar as a persistent HTTP service (`java -jar vnu.jar --port 8888`) to avoid JVM startup cost per validation — but for MVP, subprocess is fine.
- The `server/.env` already has `MONGODB_URI` pointing to Atlas (database: ShowYourBrand).
- Existing `auth.py` and `routes/health.py` should NOT be modified — they work correctly.
- The audit assumes `auditId` is created by Next.js BEFORE calling this server. The Python server receives the auditId and updates the existing document (not creates a new one).
