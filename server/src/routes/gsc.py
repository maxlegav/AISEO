"""
Google Search Console analysis endpoint — standalone route.

Accepts an OAuth2 access token from the caller and returns GSC data
(top queries, country breakdown, URL indexing status) for the given site.
"""

import logging
from typing import Annotated

from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse

from auth import verify_bearer_token
from models.business import GscAnalysisRequest
import config as app_config
from services.gsc_analyzer import fetch_gsc_data

logger = logging.getLogger(__name__)

router = APIRouter(tags=["GSC"])

GSC_TIMEOUT = 60  # seconds


@router.post("/gsc-analysis", status_code=200)
async def gsc_analysis(
    gsc_request: GscAnalysisRequest,
    _token: Annotated[str, Depends(verify_bearer_token)],
) -> JSONResponse:
    """
    Fetch and analyse Google Search Console data for a site.

    Returns top queries, country breakdown, and URL index status.
    Partial results are returned even when individual API calls fail
    (see `errors[]` in the response).
    """
    if app_config.MOCK_GSC:
        from models.audit import GscAnalysisResult, GscQuery, GscCountryData, GscIndexStatus
        mock_result = GscAnalysisResult(
            siteUrl=gsc_request.siteUrl,
            startDate="2025-01-01",
            endDate="2025-01-28",
            topQueries=[
                GscQuery(query="mock query 1", clicks=120, impressions=800, ctr=0.15, position=3.2),
                GscQuery(query="mock query 2", clicks=80, impressions=500, ctr=0.16, position=4.1),
            ],
            countryBreakdown=[
                GscCountryData(countryCode="fra", clicks=150, impressions=900, ctr=0.167, position=3.5),
                GscCountryData(countryCode="usa", clicks=50, impressions=400, ctr=0.125, position=5.0),
            ],
            indexStatus=GscIndexStatus(
                inspectedUrl=gsc_request.primaryUrl,
                indexingState="INDEXING_ALLOWED",
                robotsTxtState="ALLOWED",
                pageFetchState="SUCCESSFUL",
            ),
            totalClicks=200,
            totalImpressions=1300,
            avgCtr=0.154,
            avgPosition=3.65,
            primaryGeography="fra",
            geoRelevanceScore=75.0,
            errors=[],
            processingTimeMs=42,
        )
        return JSONResponse(
            status_code=200,
            content={"success": True, "data": mock_result.model_dump()},
        )

    try:
        logger.info(f"Starting GSC analysis for: {gsc_request.siteUrl}")

        result = await fetch_gsc_data(
            access_token=gsc_request.accessToken,
            site_url=gsc_request.siteUrl,
            primary_url=gsc_request.primaryUrl,
            locality_tier=gsc_request.localityTier,
            country=gsc_request.country,
            days_back=gsc_request.daysBack,
        )

        logger.info(
            f"GSC analysis complete for {gsc_request.siteUrl} — "
            f"errors: {len(result.errors)}"
        )

        return JSONResponse(
            status_code=200,
            content={"success": True, "data": result.model_dump()},
        )

    except Exception as e:
        logger.error(f"GSC analysis failed for {gsc_request.siteUrl}: {e}", exc_info=True)
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": "GSC_ANALYSIS_FAILED",
                "message": "An internal error occurred during the GSC analysis",
            },
        )
