"""
Health check endpoint for AISEO scraping service.

Used by Docker healthcheck and container orchestration
to verify service availability.
"""

from fastapi import APIRouter

router = APIRouter(tags=["Health"])


@router.get("/health")
async def health_check() -> dict:
    """
    Health check endpoint.

    Returns service status for monitoring and orchestration.
    No authentication required — used by Docker HEALTHCHECK and load balancers.
    """
    return {
        "success": True,
        "data": {
            "status": "healthy",
            "service": "aiseo-scraper",
        },
    }
