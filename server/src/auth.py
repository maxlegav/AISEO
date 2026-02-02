"""
Bearer token authentication module for AISEO scraping service.

Validates PROCESSING_SERVICE_API_KEY for secure communication
between Next.js and the Docker processing service.
"""

import os
from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

security = HTTPBearer(auto_error=False)


def get_api_key() -> str:
    """Get the API key from environment, fail if not set."""
    api_key = os.getenv("PROCESSING_SERVICE_API_KEY")
    if not api_key:
        raise RuntimeError(
            "PROCESSING_SERVICE_API_KEY environment variable is not set. "
            "This is required for secure service communication."
        )
    return api_key


async def verify_bearer_token(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(security)],
) -> str:
    """
    FastAPI dependency to verify Bearer token authentication.

    Returns the validated token on success.
    Raises HTTPException with standardized error format on failure.
    """
    # Check if Authorization header is present
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "success": False,
                "error": "UNAUTHORIZED",
                "message": "Missing or invalid authorization header",
            },
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Validate the token
    expected_token = get_api_key()
    if credentials.credentials != expected_token:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "success": False,
                "error": "FORBIDDEN",
                "message": "Invalid authentication token",
            },
        )

    return credentials.credentials
