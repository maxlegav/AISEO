# AISEO Scraping Service — API Server

FastAPI-based processing service for website scraping, AI analysis (GEO audits), and HTML scanning. Runs inside Docker with Chromium, vnu.jar (W3C validator), and Lychee (link checker).

## Prerequisites

- **Docker** & **Docker Compose** installed
- API keys for: OpenAI, Anthropic, Google Gemini, Perplexity
- A MongoDB Atlas connection string (or local MongoDB)

## Environment Setup

Create a `.env` file in this directory (`server/.env`):

```bash
# AI API Keys
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GEMINI_API_KEY=AIza...
PERPLEXITY_API_KEY=pplx-...
DEEPSEEK_API_KEY=...          # optional
GROK_API_KEY=...              # optional

# Authentication
PROCESSING_SERVICE_API_KEY="your-secret-bearer-token"

# MongoDB
MONGODB_URI="mongodb+srv://user:pass@cluster.mongodb.net/ShowYourBrand"

# CORS (optional, defaults to http://localhost:3000)
CORS_ORIGINS="http://localhost:3000"
```

### Required variables

| Variable | Description |
|---|---|
| `OPENAI_API_KEY` | OpenAI API key |
| `ANTHROPIC_API_KEY` | Anthropic (Claude) API key |
| `GEMINI_API_KEY` | Google Gemini API key |
| `PERPLEXITY_API_KEY` | Perplexity API key |
| `MONGODB_URI` | MongoDB connection string (database: `ShowYourBrand`) |
| `PROCESSING_SERVICE_API_KEY` | Shared secret used as Bearer token for all API requests |

## Running with Docker Compose (recommended)

From the **repo root** (`AISEO/`):

```bash
# Build and start the service
docker compose up --build

# Run in background
docker compose up --build -d

# View logs
docker compose logs -f scraper

# Stop
docker compose down
```

The API will be available at **http://localhost:8080**.

Docker Compose provides:
- Hot reload (source files mounted as volume)
- 4 GB memory / 2 CPU limit
- Health check every 30s
- Auto-restart on failure

## Running with Docker directly

```bash
cd server

# Build the image
docker build -t aiseo-scraper .

# Run the container
docker run -d \
  --name aiseo-scraper \
  -p 8080:8080 \
  --env-file .env \
  aiseo-scraper
```

## Running locally (without Docker)

> **Note:** This requires Python 3.11+, Java JRE (for vnu.jar), Chromium, and Lychee installed on your machine. Docker is strongly recommended instead.

```bash
cd server

# Create virtual environment
python3 -m venv venv
source venv/bin/activate   # macOS/Linux
# venv\Scripts\activate    # Windows

# Install dependencies
pip install -r requirements.txt

# Download NLTK data
python -c "import nltk; nltk.download('stopwords')"

# Start the server (with hot reload)
uvicorn src.main:app --host 0.0.0.0 --port 8080 --reload
```

You will also need to manually install and configure:
- **vnu.jar** — [W3C Nu HTML Checker](https://github.com/validator/validator)
- **Chromium** + **ChromeDriver** — set `CHROME_BIN` and `CHROMEDRIVER_PATH` env vars
- **Lychee** — [link checker](https://github.com/lycheeverse/lychee)

## API Endpoints

All endpoints (except `/health`) require a Bearer token in the `Authorization` header:

```
Authorization: Bearer <PROCESSING_SERVICE_API_KEY>
```

### Health Check

```
GET /health
```

Returns `{"success": true, "data": {"status": "healthy"}}`.

### Run GEO Audit

```
POST /audit
Content-Type: application/json

{
  "businessName": "Acme Corp",
  "businessUrl": "https://acme.com",
  "subUrls": ["https://acme.com/about"],
  "competitorUrls": ["https://competitor.com"],
  "competitorNames": ["Competitor Inc"],
  "category": "discovery",
  "description": "Cloud hosting provider",
  "targetKeywords": ["cloud hosting", "VPS"],
  "businessType": "SaaS",
  "auditId": "<existing-audit-mongo-id>",
  "businessId": "<business-mongo-id>",
  "userId": "<user-mongo-id>"
}
```

Runs the full 10-step audit pipeline: prompt generation, parallel AI engine queries (ChatGPT, Claude, Perplexity, Gemini), mention detection, scoring, and HTML scanning. Results are written to MongoDB and returned as a summary.

### HTML Scan (standalone)

```
POST /html-scan
Content-Type: application/json

{
  "url": "https://example.com",
  "subUrls": ["https://example.com/about"],
  "language": "en"
}
```

Runs HTML analysis independently: W3C validation, link checking, schema.org detection, meta tags, headings, alt text, and keyword analysis.

### Root

```
GET /
```

Returns service name and version.

## Project Structure

```
server/
├── Dockerfile              # Multi-stage build (vnu.jar + Lychee + Python)
├── requirements.txt        # Python dependencies
├── .env                    # Environment variables (not committed)
└── src/
    ├── main.py             # FastAPI app entry point
    ├── auth.py             # Bearer token authentication
    ├── config.py           # Env validation, MongoDB client, constants
    ├── models/
    │   ├── audit.py        # Audit request/response models
    │   └── business.py     # Business request models
    ├── routes/
    │   ├── health.py       # GET /health
    │   ├── audit.py        # POST /audit
    │   └── html_scan.py    # POST /html-scan
    ├── services/
    │   ├── ai_executor.py      # Parallel AI engine execution
    │   ├── html_scanner.py     # HTML analysis + W3C validation
    │   ├── mention_detector.py # Business mention detection
    │   ├── prompt_generator.py # LLM prompt generation
    │   └── scoring.py          # Score calculation
    └── utils/
        └── dbal/
            └── ai_api_wrapper.py  # AI API integration layer
```

## Troubleshooting

**Container won't start / health check fails:**
- Check logs: `docker compose logs scraper`
- Verify all required env vars are set in `.env`
- Ensure MongoDB URI is reachable from the container

**Audit takes too long or times out:**
- Default timeout is 10 minutes (`AUDIT_TIMEOUT_SECONDS=600`)
- Ensure the container has enough memory (4 GB recommended)

**Chromium errors:**
- The Docker image includes Chromium. If running locally, install it and set `CHROME_BIN`/`CHROMEDRIVER_PATH`

**MongoDB connection refused:**
- If using Atlas, make sure your IP is whitelisted
- Check the connection string format in `MONGODB_URI`
