---
title: "Configure Docker Compose for Local Scraping Service"
slug: "story-1-4-docker-compose-setup"
created: "2026-01-29"
status: "ready-for-dev"
stepsCompleted: [1, 2, 3, 4]
tech_stack:
  - python@3.11
  - fastapi@0.109+
  - uvicorn[standard]
  - selenium
  - chromium (apt-installed in Docker)
  - docker
  - docker-compose
  - openai (SDK for OpenAI + Perplexity + DeepSeek + xAI)
  - anthropic
  - google-generativeai
  - python-dotenv
  - pydantic
files_to_modify:
  - docker-compose.yml (CREATE)
  - server/Dockerfile (CREATE)
  - server/requirements.txt (CREATE)
  - server/src/main.py (CREATE - FastAPI app)
  - server/src/auth.py (CREATE - Bearer auth)
  - server/src/routes/health.py (CREATE)
  - server/src/routes/audit.py (CREATE - placeholder)
  - server/.env.example (UPDATE)
code_patterns:
  - fastapi-bearer-auth
  - docker-volume-mounts
  - selenium-chrome-headless
  - standardized-response-format
test_patterns:
  - health-check-endpoint
  - manual-docker-compose-up
  - curl-with-bearer-token
---

# Tech-Spec: Configure Docker Compose for Local Scraping Service

**Created:** 2026-01-29
**Story:** 1.4 (Epic 1: Project Foundation & Infrastructure)
**Status:** Implementation Complete

## Overview

### Problem Statement

The ShowYourBrand scraping service needs containerization for local development. Currently it's just a Python script (`server/src/app.py`) with no REST API, no Docker setup, and no authentication. Developers cannot run the service in a consistent, isolated environment.

### Solution

Create a Docker Compose configuration with:

- FastAPI REST server with Bearer token authentication
- Selenium + Chrome/Chromium for website HTML scraping
- AI API wrappers for prompt testing (existing code)
- Hot reload via volume mounts for development
- Health check endpoint for container orchestration

### Scope

**In Scope:**

- `docker-compose.yml` with Python + Selenium + Chrome container
- `server/Dockerfile` for the scraping service
- Convert `server/src/app.py` to FastAPI with basic endpoints (`/health`, `/audit`)
- Bearer token authentication using `PROCESSING_SERVICE_API_KEY`
- Volume mounts for hot reload in development
- Environment variables passthrough for all API keys
- `server/requirements.txt` with all Python dependencies
- Update `server/.env.example` with all required variables

**Out of Scope:**

- Full audit processing logic (Epic 4 - Audit Engine)
- AWS Lambda/ECS deployment configuration
- Integration with Next.js API routes (Story 4.x)
- 100 prompts implementation
- Parallel AI API processing optimization

## Context for Development

### Codebase Patterns

**Existing Code Structure:**

```
server/
├── src/
│   ├── app.py              # Current script (to be replaced by main.py)
│   └── utils/
│       ├── dbal/
│       │   └── ai_api_wrapper.py   # 6 AI providers, keep as-is
│       └── questions/
│           └── fr/         # Question templates for audits
├── .env                    # Local env vars (gitignored)
├── .env.example            # Template
└── server-venv/            # Local venv (not used in Docker)
```

**AI API Wrapper Pattern** (`ai_api_wrapper.py`):

- Standardized response: `{ success: bool, response: str, conversation_history: list, metadata: dict, error: str|None }`
- 6 providers: OpenAI, Anthropic, Google Gemini, Perplexity, DeepSeek, xAI
- Uses `openai` SDK for OpenAI-compatible APIs

**Bearer Token Auth Pattern** (from project-context.md):

```python
# Validate Bearer token on every request
auth_header = request.headers.get("Authorization")
if not auth_header or not auth_header.startswith("Bearer "):
    return {"error": "Missing authorization"}, 401

token = auth_header.split(" ")[1]
if token != os.getenv("PROCESSING_SERVICE_API_KEY"):
    return {"error": "Invalid token"}, 403
```

**Standardized API Response Format:**

```python
# Success
{"success": True, "data": {...}}

# Error
{"success": False, "error": "ERROR_TYPE", "message": "..."}
```

### Files to Reference

| File                                    | Purpose                                        |
| --------------------------------------- | ---------------------------------------------- |
| server/src/utils/dbal/ai_api_wrapper.py | AI API wrappers - keep as-is, import in routes |
| server/.env.example                     | Current env template - needs expansion         |
| \_bmad-output/project-context.md        | Bearer auth pattern, service communication     |
| WebSite/.env.local (if exists)          | Reference for PROCESSING_SERVICE_API_KEY       |

### Technical Decisions

1. **FastAPI over Flask**: Modern, async-first, auto-generated OpenAPI docs at `/docs`, better typing with Pydantic
2. **Port 8080**: Aligned with architecture.md and project-context.md for consistency across the codebase
3. **Selenium + Chrome**: For HTML scraping of business websites (content analysis in Epic 4)
4. **Uvicorn with --reload**: Hot reload for development
5. **Volume mounts**: Mount `server/src` to `/app/src` for live code changes (development only, not for production)
6. **Apt-installed Chromium**: Use system Chromium package for reliability in Docker (no webdriver-manager)
7. **Pydantic models**: For request/response validation (FastAPI native)
8. **Modular routes**: Separate files for `/health` and `/audit` endpoints
9. **CORS enabled**: Allow requests from `http://localhost:3000` (Next.js dev server)

## Implementation Plan

### Tasks

- [x] Task 1: Create Python requirements file
  - File: `server/requirements.txt`
  - Action: Create with all Python dependencies (FastAPI, Uvicorn, Selenium, AI SDKs, etc.)
  - Notes: Pin minimum versions for reproducibility

- [x] Task 2: Create FastAPI main application entry point
  - File: `server/src/main.py`
  - Action: Create FastAPI app with CORS, lifespan handler, and route includes
  - Notes: Import routes from modular route files, configure for hot reload
  - CORS Config: Allow origins `["http://localhost:3000"]`, methods `["GET", "POST", "PUT", "DELETE"]`, headers `["Authorization", "Content-Type"]`
  - Logging: Configure basic Python logging with INFO level (JSON format deferred to production setup)

- [x] Task 3: Create Bearer token authentication module
  - File: `server/src/auth.py`
  - Action: Implement `verify_bearer_token` dependency using `PROCESSING_SERVICE_API_KEY`
  - Notes: Return 401 for missing auth, 403 for invalid token. Use standardized error response format.

- [x] Task 4: Create Python package **init**.py files
  - Files: `server/src/routes/__init__.py`, `server/src/utils/__init__.py`, `server/src/utils/dbal/__init__.py`
  - Action: Create empty `__init__.py` files for all packages
  - Notes: Required for Python package imports when running in Docker

- [x] Task 5: Create health check endpoint
  - File: `server/src/routes/health.py`
  - Action: Create `GET /health` endpoint returning `{ success: true, data: { status: "healthy", service: "ShowYourBrand-scraper" } }`
  - Notes: Requires valid Bearer token, use `verify_bearer_token` dependency

- [x] Task 6: Create audit placeholder endpoint
  - File: `server/src/routes/audit.py`
  - Action: Create `POST /audit` placeholder returning 501 Not Implemented
  - Notes: Full implementation in Epic 4. Response: `{ success: false, error: "NOT_IMPLEMENTED", message: "Audit processing not yet available" }`

- [x] Task 7: Create Dockerfile for Python + Selenium + Chrome
  - File: `server/Dockerfile`
  - Action: Create Dockerfile with Python 3.11-slim, Chromium installation, and app setup
  - Layer order for caching: (1) apt deps, (2) requirements.txt copy+install, (3) source copy
  - System deps: `chromium`, `chromium-driver`, `libnss3`, `libxss1`, `libasound2`, `libatk-bridge2.0-0`, `libgtk-3-0`
  - Env vars: `CHROME_BIN=/usr/bin/chromium`, `CHROMEDRIVER_PATH=/usr/bin/chromedriver`
  - Security: Use non-root user (`appuser`) for running the application

- [x] Task 8: Create Docker Compose configuration
  - File: `docker-compose.yml`
  - Action: Create docker-compose.yml with scraper service, volume mounts, port 8080, and environment variables
  - Volume mount: `./server/src:/app/src` (development only - DO NOT use in production)
  - Resource limits: `mem_limit: 2g`, `cpus: '1.0'` (Chrome is memory-hungry)
  - Healthcheck: `test: ["CMD", "curl", "-f", "http://localhost:8080/health"]`, interval 30s, timeout 10s, retries 3
  - Command: `uvicorn src.main:app --host 0.0.0.0 --port 8080 --reload`
  - Env vars: Pass all API keys via environment_file (.env)

- [x] Task 9: Update environment example file
  - File: `server/.env.example`
  - Action: Add `PROCESSING_SERVICE_API_KEY` and document all required variables
  - Fix typos: Correct `ANTRHOPIC_API-KEY` → `ANTHROPIC_API_KEY` (hyphen to underscore)
  - Standardize naming: Use `{PROVIDER}_API_KEY` pattern (OPENAI_API_KEY, ANTHROPIC_API_KEY, GEMINI_API_KEY, PERPLEXITY_API_KEY, DEEPSEEK_API_KEY, XAI_API_KEY)
  - Notes: Include comments explaining each variable. Never include default values for secrets.

- [x] Task 10: Backup existing app.py
  - File: `server/src/app.py.bak`
  - Action: Rename `server/src/app.py` to `server/src/app.py.bak` for reference
  - Notes: Preserve existing code for reference during Epic 4 implementation

### Acceptance Criteria

**From Story 1.4 (epics.md):**

**Given** Docker is installed on the development machine
**When** I run `docker-compose up`
**Then** A Python + Selenium container starts successfully
**And** The container exposes a REST API on localhost:8080
**And** Bearer token authentication (PROCESSING_SERVICE_API_KEY) is configured
**And** docker-compose.yml includes environment variables for API keys
**And** Docker healthcheck passes after container starts

**Additional AC:**

**Given** the container is running
**When** I call `GET /health` with valid Bearer token
**Then** I receive `{ "success": true, "data": { "status": "healthy", "service": "ShowYourBrand-scraper" } }`

**Given** I call any endpoint without Bearer token
**When** the request is processed
**Then** I receive `401 Unauthorized` with `{ "success": false, "error": "UNAUTHORIZED", "message": "Missing or invalid authorization header" }`

**Given** I modify a Python file in `server/src/`
**When** I save the file
**Then** Uvicorn auto-reloads without manual container restart

**Given** Selenium is configured
**When** I call a route that uses the browser
**Then** Chrome runs in headless mode inside the container

## Additional Context

### Dependencies

**Python packages (requirements.txt):**

```
fastapi>=0.109.0
uvicorn[standard]>=0.27.0
python-dotenv>=1.0.0
pydantic>=2.5.0
selenium>=4.16.0
openai>=1.10.0
anthropic>=0.18.0
google-generativeai>=0.3.0
httpx>=0.25.0
```

**Docker:**

- Base image: `python:3.11-slim`
- Chromium + ChromeDriver installed via apt (system packages)
- System libraries for headless Chrome: libnss3, libxss1, libasound2, etc.

### Testing Strategy

**Manual Testing (no test framework in this story):**

**Setup:** Set `PROCESSING_SERVICE_API_KEY` in `server/.env` before testing:

```bash
echo "PROCESSING_SERVICE_API_KEY=test-key-for-local-dev" >> server/.env
```

1. **Container startup:**

   ```bash
   docker-compose up --build
   # Verify: Container starts, no errors, port 8080 exposed, healthcheck passes
   ```

2. **Health check:**

   ```bash
   curl -H "Authorization: Bearer test-key-for-local-dev" http://localhost:8080/health
   # Verify: Returns { "success": true, "data": { "status": "healthy", "service": "ShowYourBrand-scraper" } }
   ```

3. **Auth rejection:**

   ```bash
   curl http://localhost:8080/health
   # Verify: Returns 401 with { "success": false, "error": "UNAUTHORIZED", ... }
   ```

4. **Hot reload:**
   - Edit server/src/main.py (add a comment)
   - Save file
   - Verify Uvicorn reloads in container logs

5. **OpenAPI docs:**
   - Visit http://localhost:8080/docs
   - Verify Swagger UI loads
   - **Note:** `/docs` is accessible without auth (acceptable for development, consider disabling in production)

### Notes

- Current `app.py` will be preserved as `app.py.bak` for reference
- The `/audit` endpoint will be a placeholder returning 501 Not Implemented (full logic in Epic 4)
- Environment variables should NOT have defaults for API keys (fail if missing)
- PROCESSING_SERVICE_API_KEY is required, others optional until Epic 4

**Pre-mortem Risks:**

1. **Chromium/Selenium compatibility**: Using apt-installed chromium ensures version consistency. Rebuild Docker image if Selenium updates require newer Chrome.
2. **Memory usage**: Headless Chrome can consume significant memory. Container has 2GB limit configured; monitor for OOM errors.
3. **macOS Docker networking**: If port 8080 is in use, check for conflicting services with `lsof -i :8080`.

**Security Notes:**

- Volume mounts (`./server/src:/app/src`) are for development only - DO NOT use in production
- `/docs` endpoint exposes API structure without auth - disable in production via `docs_url=None` in FastAPI constructor
- Container runs as non-root user for defense in depth

**Future Considerations (Out of Scope):**

- Health check could include Selenium/Chrome readiness check (not needed for MVP)
- Structured logging with JSON format (nice-to-have for production)
- Graceful shutdown handling for in-flight requests
