"""
HTML Scanner endpoint — standalone HTML analysis route.

Runs the HTML scanner independently for testing or on-demand scans
without a full audit.
"""

import asyncio
import logging
from typing import Annotated

from fastapi import APIRouter, Depends, Request
from fastapi.responses import JSONResponse
from slowapi import Limiter
from slowapi.util import get_remote_address

from auth import verify_bearer_token
from models.business import HtmlScanRequest
from services.html_scanner import scan_website

logger = logging.getLogger(__name__)

SCAN_TIMEOUT = 120  # seconds — global endpoint timeout

router = APIRouter(tags=["HTML Scanner"])

limiter = Limiter(key_func=get_remote_address)


@router.post("/html-scan", status_code=200)
@limiter.limit("10/minute")
async def scan_html(
    request: Request,
    scan_request: HtmlScanRequest,
    _token: Annotated[str, Depends(verify_bearer_token)],
) -> JSONResponse:
    """
    Standalone HTML scan endpoint.

    Runs the full HTML scanner (W3C, links, schema.org, meta, headings, alt, keywords)
    on the provided URL and optional sub-URLs.

    Rate limited to 10 requests/minute per IP. Global timeout of 120 seconds.
    """
    try:
        logger.info(f"Starting HTML scan for: {scan_request.url}")

        result = await asyncio.wait_for(
            scan_website(
                url=str(scan_request.url),
                sub_urls=scan_request.subUrls,
                language=scan_request.language,
                business_type=scan_request.businessType,
            ),
            timeout=SCAN_TIMEOUT,
        )

        logger.info(f"HTML scan complete for {scan_request.url} — score: {result.htmlScannerScore}")

        if result.hasBlockedUrls:
            return JSONResponse(
                status_code=400,
                content={
                    "success": False,
                    "error": "BLOCKED_URL",
                    "message": "One or more URLs were rejected by security policy",
                    "data": result.model_dump(),
                },
            )

        return JSONResponse(
            status_code=200,
            content={
                "success": True,
                "data": result.model_dump(),
            },
        )

    except asyncio.TimeoutError:
        logger.error(f"HTML scan timed out for {scan_request.url} after {SCAN_TIMEOUT}s")
        return JSONResponse(
            status_code=504,
            content={
                "success": False,
                "error": "SCAN_TIMEOUT",
                "message": f"Scan timed out after {SCAN_TIMEOUT} seconds",
            },
        )

    except Exception as e:
        logger.error(f"HTML scan failed for {scan_request.url}: {e}")
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": "HTML_SCAN_FAILED",
                "message": "An internal error occurred during the HTML scan",
            },
        )
