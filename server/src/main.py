"""
ShowYourBrand Scraping Service - FastAPI Application

Main entry point for the Docker-based processing service.
Provides REST API for website scraping and AI analysis.
"""

import logging
import os
from contextlib import asynccontextmanager

from typing import Annotated, Any
from auth import verify_bearer_token, get_api_key

from dotenv import load_dotenv
from fastapi import FastAPI, Depends, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from starlette.middleware.base import BaseHTTPMiddleware

from routes.health import router as health_router
from routes.audit import router as audit_router
from routes.html_scan import router as html_scan_router
from routes.gsc import router as gsc_router

import config as app_config

# Load environment variables
load_dotenv()

# Rate limiter (per-IP)
limiter = Limiter(key_func=get_remote_address)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan handler.

    Handles startup and shutdown events for the FastAPI application.
    """
    # Startup
    logger.info("ShowYourBrand Scraping Service starting up...")

    # Validate required environment variables
    missing = app_config.validate_env()
    if missing:
        logger.error(f"Missing required environment variables: {missing}")
        raise RuntimeError(f"Missing required environment variables: {missing}")

    logger.info("Environment validated successfully")

    # Connect to MongoDB and verify
    try:
        db = app_config.get_db()
        await db.command("ping")
        logger.info("MongoDB connection established (database: ShowYourBrand)")

        # Create indexes on audits collection
        await db.audits.create_index([("businessId", 1), ("createdAt", -1)])
        await db.audits.create_index([("userId", 1), ("status", 1)])
        await db.audits.create_index([("status", 1), ("createdAt", -1)])
        logger.info("MongoDB indexes created on audits collection")
    except Exception as e:
        logger.error(f"MongoDB connection failed: {e}")
        raise RuntimeError(f"MongoDB connection failed: {e}")

    logger.info("Service ready to accept requests on port 8080")

    yield

    # Shutdown
    logger.info("ShowYourBrand Scraping Service shutting down...")
    await app_config.close_db()


# Create FastAPI application
# Docs enabled — service is already behind bearer token auth
app = FastAPI(
    title="ShowYourBrand Scraping Service",
    description="Docker-based processing service for website scraping and AI analysis",
    version="0.2.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# ---------------------------------------------------------------------------
# Silent-drop middleware: reject all requests without valid Bearer token.
# No response body, no headers, no status hint — just an empty 444 close.
# ---------------------------------------------------------------------------
class SilentAuthMiddleware(BaseHTTPMiddleware):
    """Drop any request that does not carry a valid Bearer token."""

    async def dispatch(self, request: Request, call_next):
        auth_header = request.headers.get("authorization", "")
        if not auth_header.lower().startswith("bearer "):
            return Response(status_code=444)

        token = auth_header.split(" ", 1)[1]
        try:
            expected = get_api_key()
        except RuntimeError:
            return Response(status_code=444)

        if token != expected:
            return Response(status_code=444)

        return await call_next(request)


app.add_middleware(SilentAuthMiddleware)

# Rate limiter setup
app.state.limiter = limiter


@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(
        status_code=429,
        content={"success": False, "error": "RATE_LIMITED", "message": "Too many requests"},
    )


# Configure CORS for Next.js frontend
_cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:3000")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in _cors_origins.split(",") if o.strip()],
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["Authorization", "Content-Type"],
)

# Include routers
app.include_router(health_router)
app.include_router(audit_router)
app.include_router(html_scan_router)
app.include_router(gsc_router)


@app.get("/")
async def root(
    _token: Annotated[str, Depends(verify_bearer_token)]
):
    """Root endpoint - service info."""

    return {
        "success": True,
        "data": {
            "service": "ShowYourBrand-scraper",
            "version": "0.2.0",
            "docs": "/docs",
        },
    }
