"""
Google Search Console Analyzer Service.

Fetches and analyses GSC data via three parallel API calls:
  1. Top queries (search analytics, dimension: query)
  2. Country breakdown (search analytics, dimension: country)
  3. URL Inspection (index inspection)

All failures are caught per-call and appended to errors[]; partial results
are still returned (graceful degradation).
"""

import asyncio
import logging
import time
from datetime import date, timedelta

import httpx

from models.audit import (
    GscAnalysisResult,
    GscCountryData,
    GscIndexStatus,
    GscQuery,
)

logger = logging.getLogger(__name__)

_GSC_SEARCH_ANALYTICS = (
    "https://www.googleapis.com/webmasters/v3/sites/{site_url}/searchAnalytics/query"
)
_GSC_URL_INSPECTION = (
    "https://searchconsole.googleapis.com/v1/urlInspection/index:inspect"
)

# Country codes in GSC use ISO 3166-1 alpha-3 (lowercase).
# We map them to alpha-2 for comparisons where the caller passes alpha-2.
_ALPHA3_TO_ALPHA2: dict[str, str] = {
    "fra": "fr", "usa": "us", "gbr": "gb", "deu": "de", "esp": "es",
    "ita": "it", "bel": "be", "nld": "nl", "che": "ch", "can": "ca",
    "aus": "au", "bra": "br", "ind": "in", "jpn": "jp", "chn": "cn",
    "kor": "kr", "mex": "mx", "arg": "ar", "col": "co", "prt": "pt",
    "pol": "pl", "swe": "se", "nor": "no", "dnk": "dk", "fin": "fi",
    "aut": "at", "rou": "ro", "hun": "hu", "cze": "cz", "svk": "sk",
    "hrv": "hr", "bgr": "bg", "grc": "gr", "tur": "tr", "isr": "il",
    "zaf": "za", "nga": "ng", "egy": "eg", "mar": "ma", "ken": "ke",
    "idn": "id", "phl": "ph", "vnm": "vn", "tha": "th", "mys": "my",
    "pak": "pk", "bgd": "bd", "lka": "lk", "nzl": "nz", "sgp": "sg",
}


def _derive_site_url(url: str) -> str:
    """Add trailing slash to a URL if missing (GSC requires it for URL-prefix properties)."""
    url = url.rstrip("/") + "/"
    return url


def _date_range(days_back: int) -> tuple[str, str]:
    end = date.today() - timedelta(days=3)  # GSC data lags ~3 days
    start = end - timedelta(days=days_back - 1)
    return start.isoformat(), end.isoformat()


async def _fetch_search_analytics(
    client: httpx.AsyncClient,
    site_url: str,
    start_date: str,
    end_date: str,
    dimension: str,
    row_limit: int,
    errors: list[str],
) -> list[dict]:
    """Query GSC Search Analytics API for a single dimension."""
    encoded_site = httpx.URL(site_url).host  # used only for logging
    try:
        url = _GSC_SEARCH_ANALYTICS.format(site_url=httpx.URL(site_url).__str__().rstrip("/"))
        # httpx auto-encodes path, so we build it manually to preserve slashes
        url = (
            "https://www.googleapis.com/webmasters/v3/sites/"
            + httpx.URL(site_url).__str__().replace("/", "%2F").replace(":", "%3A")
            + "/searchAnalytics/query"
        )
        payload = {
            "startDate": start_date,
            "endDate": end_date,
            "dimensions": [dimension],
            "rowLimit": row_limit,
        }
        resp = await client.post(url, json=payload)
        if resp.status_code == 401:
            errors.append(f"GSC auth error ({dimension}): 401 Unauthorized — token expired or invalid")
            return []
        if resp.status_code == 403:
            errors.append(f"GSC permission error ({dimension}): 403 Forbidden — no access to {site_url}")
            return []
        if resp.status_code != 200:
            errors.append(f"GSC search analytics ({dimension}) returned HTTP {resp.status_code}: {resp.text[:200]}")
            return []
        return resp.json().get("rows", [])
    except httpx.RequestError as exc:
        errors.append(f"GSC search analytics ({dimension}) request failed: {exc}")
        return []
    except Exception as exc:
        errors.append(f"GSC search analytics ({dimension}) unexpected error: {exc}")
        return []


async def _fetch_url_inspection(
    client: httpx.AsyncClient,
    site_url: str,
    inspection_url: str,
    errors: list[str],
) -> GscIndexStatus | None:
    """Call the GSC URL Inspection API for a single URL."""
    try:
        payload = {
            "inspectionUrl": inspection_url,
            "siteUrl": site_url,
        }
        resp = await client.post(_GSC_URL_INSPECTION, json=payload)
        if resp.status_code == 401:
            errors.append("GSC URL inspection: 401 Unauthorized — token expired or invalid")
            return None
        if resp.status_code == 403:
            errors.append(f"GSC URL inspection: 403 Forbidden — no access to {site_url}")
            return None
        if resp.status_code != 200:
            errors.append(f"GSC URL inspection returned HTTP {resp.status_code}: {resp.text[:200]}")
            return None

        data = resp.json()
        result = data.get("inspectionResult", {})
        index_status = result.get("indexStatusResult", {})

        return GscIndexStatus(
            inspectedUrl=inspection_url,
            indexingState=index_status.get("indexingState", "UNKNOWN"),
            robotsTxtState=index_status.get("robotsTxtState"),
            pageFetchState=index_status.get("pageFetchState"),
            lastCrawlTime=index_status.get("lastCrawlTime"),
            googleCanonical=index_status.get("googleCanonical"),
            coverageState=index_status.get("coverageState"),
        )
    except httpx.RequestError as exc:
        errors.append(f"GSC URL inspection request failed: {exc}")
        return None
    except Exception as exc:
        errors.append(f"GSC URL inspection unexpected error: {exc}")
        return None


def _compute_geo_relevance_score(
    country_breakdown: list[GscCountryData],
    locality_tier: str | None,
    country: str | None,  # ISO alpha-2
) -> float | None:
    """Compute a 0–100 geo relevance score based on locality tier.

    HYPER_LOCAL / NATIONAL: % of total clicks from the business's country.
    GLOBAL: spread score — distinct countries with clicks / 50 × 100 (capped at 100).
    """
    if not locality_tier or not country_breakdown:
        return None

    tier = locality_tier.upper()

    if tier in ("HYPER_LOCAL", "NATIONAL"):
        if not country:
            return None
        target_alpha2 = country.lower()
        total_clicks = sum(r.clicks for r in country_breakdown)
        if total_clicks == 0:
            return 0.0
        domestic_clicks = sum(
            r.clicks for r in country_breakdown
            if _ALPHA3_TO_ALPHA2.get(r.countryCode.lower(), r.countryCode.lower()) == target_alpha2
        )
        return round(domestic_clicks / total_clicks * 100, 2)

    if tier == "GLOBAL":
        distinct_countries = sum(1 for r in country_breakdown if r.clicks > 0)
        return round(min(distinct_countries / 50 * 100, 100.0), 2)

    return None


async def fetch_gsc_data(
    access_token: str,
    site_url: str,
    primary_url: str,
    locality_tier: str | None = None,
    country: str | None = None,
    days_back: int = 28,
) -> GscAnalysisResult:
    """Fetch and analyse GSC data for a site.

    Makes three parallel API calls (top queries, country breakdown, URL inspection).
    Individual failures are caught and stored in errors[]; partial results are returned.
    """
    start_time = time.time()
    errors: list[str] = []

    # Normalise site URL
    normalised_site = _derive_site_url(site_url)
    start_date, end_date = _date_range(days_back)

    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json",
    }

    async with httpx.AsyncClient(headers=headers, timeout=30.0) as client:
        query_task = _fetch_search_analytics(
            client, normalised_site, start_date, end_date, "query", 25, errors
        )
        country_task = _fetch_search_analytics(
            client, normalised_site, start_date, end_date, "country", 50, errors
        )
        inspection_task = _fetch_url_inspection(
            client, normalised_site, primary_url, errors
        )

        query_rows, country_rows, index_status = await asyncio.gather(
            query_task,
            country_task,
            inspection_task,
            return_exceptions=False,  # individual handlers already catch exceptions
        )

    # Parse top queries
    top_queries: list[GscQuery] = []
    for row in (query_rows or []):
        keys = row.get("keys", [])
        top_queries.append(GscQuery(
            query=keys[0] if keys else "",
            clicks=int(row.get("clicks", 0)),
            impressions=int(row.get("impressions", 0)),
            ctr=float(row.get("ctr", 0.0)),
            position=float(row.get("position", 0.0)),
        ))

    # Parse country breakdown
    country_breakdown: list[GscCountryData] = []
    for row in (country_rows or []):
        keys = row.get("keys", [])
        country_breakdown.append(GscCountryData(
            countryCode=keys[0] if keys else "",
            clicks=int(row.get("clicks", 0)),
            impressions=int(row.get("impressions", 0)),
            ctr=float(row.get("ctr", 0.0)),
            position=float(row.get("position", 0.0)),
        ))

    # Compute aggregates
    total_clicks = sum(q.clicks for q in top_queries)
    total_impressions = sum(q.impressions for q in top_queries)
    avg_ctr = (sum(q.ctr for q in top_queries) / len(top_queries)) if top_queries else 0.0
    avg_position = (sum(q.position for q in top_queries) / len(top_queries)) if top_queries else 0.0

    # Primary geography (top country by clicks)
    primary_geo: str | None = None
    if country_breakdown:
        top_country = max(country_breakdown, key=lambda c: c.clicks)
        primary_geo = top_country.countryCode if top_country.clicks > 0 else None

    # Geo relevance score
    geo_relevance = _compute_geo_relevance_score(country_breakdown, locality_tier, country)

    processing_time_ms = int((time.time() - start_time) * 1000)
    logger.info(
        f"GSC analysis complete for {normalised_site} — "
        f"{len(top_queries)} queries, {len(country_breakdown)} countries, "
        f"index_status={'ok' if index_status else 'none'}, "
        f"errors={len(errors)}, time={processing_time_ms}ms"
    )

    return GscAnalysisResult(
        siteUrl=normalised_site,
        startDate=start_date,
        endDate=end_date,
        topQueries=top_queries,
        countryBreakdown=country_breakdown,
        indexStatus=index_status,
        totalClicks=total_clicks,
        totalImpressions=total_impressions,
        avgCtr=round(avg_ctr, 6),
        avgPosition=round(avg_position, 2),
        primaryGeography=primary_geo,
        geoRelevanceScore=geo_relevance,
        errors=errors,
        processingTimeMs=processing_time_ms,
    )
