"""
Health check endpoint for AISEO scraping service.

Used by Docker healthcheck and container orchestration
to verify service availability.
"""

from typing import Annotated

from fastapi import APIRouter, Depends

from auth import verify_bearer_token

router = APIRouter(tags=["Health"])


@router.get("/health")
async def health_check(
    _token: Annotated[str, Depends(verify_bearer_token)],
) -> dict:
    """
    Health check endpoint.

    Returns service status for monitoring and orchestration.
    Requires valid Bearer token authentication.
    """
    return {
        "success": True,
        "data": {
            "status": "healthy",
            "service": "aiseo-scraper",
        },
    }
