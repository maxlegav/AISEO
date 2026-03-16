"""
ShowYourBrand Server Configuration — MongoDB connection, environment validation, constants.

Single global Motor client instance, reused across all requests.
"""

import os
import logging

from motor.motor_asyncio import AsyncIOMotorClient

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

AI_ENGINES = ["chatgpt", "claude", "perplexity", "gemini"]
PROMPT_COUNT = int(os.getenv("PROMPT_COUNT", "100"))
AUDIT_TIMEOUT_SECONDS = 600  # 10 minutes

# ---------------------------------------------------------------------------
# Local AI mode (Ollama)
# ---------------------------------------------------------------------------

LOCAL_AI_MODE = os.getenv("USE_LOCAL_AI", "false").lower() in ("true", "1", "yes")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "qwen3:4b")
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434/v1")

# Claude Code local mode — uses `claude -p` CLI (no API cost, uses subscription)
CLAUDE_CODE_LOCAL_MODE = os.getenv("USE_CLAUDE_CODE_LOCAL", "false").lower() in ("true", "1", "yes")

MOCK_AI = os.getenv("MOCK_AI", "false").lower() in ("true", "1", "yes")
MOCK_GSC = os.getenv("MOCK_GSC", "false").lower() in ("true", "1", "yes")

GOOGLE_PLACES_API_KEY = os.getenv("GOOGLE_PLACES_API_KEY")
MOCK_GOOGLE_REVIEWS = os.getenv("MOCK_GOOGLE_REVIEWS", "false").lower() in ("true", "1", "yes")

if MOCK_AI:
    MIN_ENGINES_REQUIRED = 1
    logger.info("MOCK AI MODE — no real AI calls, deterministic fake responses")
elif LOCAL_AI_MODE:
    MIN_ENGINES_REQUIRED = 1
    logger.info(
        f"LOCAL AI MODE — all engines routed to Ollama ({OLLAMA_MODEL})"
    )
elif CLAUDE_CODE_LOCAL_MODE:
    MIN_ENGINES_REQUIRED = 1
    logger.info("CLAUDE CODE LOCAL MODE — all engines routed to local claude CLI (uses subscription)")
else:
    MIN_ENGINES_REQUIRED = int(os.getenv("MIN_ENGINES_REQUIRED", "2"))

VALID_CATEGORIES = {"discovery", "comparison", "reputation", "product", "alternative", "trust"}
VALID_STATUSES = {"pending", "processing", "review_pending", "completed", "rejected", "failed"}

CATEGORY_WEIGHTS = {
    "discovery": 2.0,
    "comparison": 1.5,
    "reputation": 1.2,
    "product": 1.0,
    "alternative": 1.5,
    "trust": 1.0,
}

LEVEL_DESCRIPTIONS = {
    1: "Excellent — visible on broad queries (level 1)",
    2: "Good — visible in its niche (level 2)",
    3: "Medium — visible when characteristics are described (level 3)",
    4: "Weak — visible only with very specific hints (level 4)",
    5: "Minimal — visible only when cited by name (level 5)",
}

DISCOVERABILITY_THRESHOLD = 0.25

# ---------------------------------------------------------------------------
# Required environment variables
# ---------------------------------------------------------------------------

if MOCK_AI or LOCAL_AI_MODE or CLAUDE_CODE_LOCAL_MODE:
    REQUIRED_ENV_VARS = [
        "MONGODB_URI",
        "PROCESSING_SERVICE_API_KEY",
    ]
else:
    REQUIRED_ENV_VARS = [
        "OPENAI_API_KEY",
        "ANTHROPIC_API_KEY",
        "GEMINI_API_KEY",
        "PERPLEXITY_API_KEY",
        "MONGODB_URI",
        "PROCESSING_SERVICE_API_KEY",
    ]


def validate_env() -> list[str]:
    """Check all required env vars are set. Returns list of missing vars."""
    return [var for var in REQUIRED_ENV_VARS if not os.getenv(var)]


# ---------------------------------------------------------------------------
# MongoDB (Motor async driver)
# ---------------------------------------------------------------------------

_client: AsyncIOMotorClient | None = None


def get_client() -> AsyncIOMotorClient:
    """Get or create the global Motor client."""
    global _client
    if _client is None:
        uri = os.getenv("MONGODB_URI")
        if not uri:
            raise RuntimeError("MONGODB_URI environment variable is not set")
        _client = AsyncIOMotorClient(uri)
    return _client


def get_db():
    """Get the ShowYourBrand database."""
    return get_client().ShowYourBrand


async def close_db() -> None:
    """Close the Motor client on shutdown."""
    global _client
    if _client is not None:
        _client.close()
        _client = None
        logger.info("MongoDB connection closed")
