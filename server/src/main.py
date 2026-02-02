"""
AISEO Scraping Service - FastAPI Application

Main entry point for the Docker-based processing service.
Provides REST API for website scraping and AI analysis.
"""

import logging
import os
from contextlib import asynccontextmanager

from typing import Annotated, Any
from auth import verify_bearer_token

from dotenv import load_dotenv
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware

from routes.health import router as health_router
from routes.audit import router as audit_router

# Load environment variables
load_dotenv()

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
    logger.info("AISEO Scraping Service starting up...")

    # Validate required environment variables
    required_vars = ["PROCESSING_SERVICE_API_KEY"]
    missing = [var for var in required_vars if not os.getenv(var)]
    if missing:
        logger.error(f"Missing required environment variables: {missing}")
        raise RuntimeError(f"Missing required environment variables: {missing}")

    logger.info("Environment validated successfully")
    logger.info("Service ready to accept requests on port 8080")

    yield

    # Shutdown
    logger.info("AISEO Scraping Service shutting down...")


# Create FastAPI application
# Note: In production, set docs_url=None to disable OpenAPI docs
app = FastAPI(
    title="AISEO Scraping Service",
    description="Docker-based processing service for website scraping and AI analysis",
    version="0.1.0",
    lifespan=lifespan,
    docs_url=None, # Disable docs (Swagger UI)
    redoc_url=None, # Disable redoc
)

# Configure CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Next.js dev server
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["Authorization", "Content-Type"],
)

# Include routers
app.include_router(health_router)
app.include_router(audit_router)


@app.get("/")
async def root(
    _token: Annotated[str, Depends(verify_bearer_token)]
):
    """Root endpoint - service info."""
    
    return {
        "success": True,
        "data": {
            "service": "aiseo-scraper",
            "version": "0.1.0",
            "docs": "/docs",
        },
    }
    