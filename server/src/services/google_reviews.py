"""
Google Reviews Service — fetches review data from Google Places API (New).

Contextual data only (not part of GEO Score). Follows the same graceful
degradation pattern as the GSC analyzer: never raises, all errors captured
in result.errors.
"""

import logging
import time

import httpx

import config as app_config
from models.audit import GoogleReviewSample, GoogleReviewsResult

logger = logging.getLogger(__name__)

_PLACES_SEARCH_URL = "https://places.googleapis.com/v1/places:searchText"
_PLACES_DETAILS_URL = "https://places.googleapis.com/v1/places/{place_id}"


def _mock_result() -> GoogleReviewsResult:
    """Return deterministic mock data for testing."""
    return GoogleReviewsResult(
        placeId="ChIJMOCKPLACEID123",
        rating=4.3,
        totalReviews=127,
        businessNameOnGoogle="Mock Business",
        reviewSamples=[
            GoogleReviewSample(
                authorName="Alice M.",
                rating=5,
                relativeTime="2 weeks ago",
                text="Excellent service, highly recommend!",
            ),
            GoogleReviewSample(
                authorName="Bob K.",
                rating=4,
                relativeTime="1 month ago",
                text="Good quality products. Will come back.",
            ),
            GoogleReviewSample(
                authorName="Claire D.",
                rating=3,
                relativeTime="3 months ago",
                text="Decent experience, nothing extraordinary.",
            ),
        ],
        processingTimeMs=50,
    )


async def _search_place_id(
    client: httpx.AsyncClient,
    business_name: str,
    city: str | None,
    country: str | None,
    errors: list[str],
) -> str | None:
    """Search for a Place ID using the Places API textSearch."""
    query_parts = [business_name]
    if city:
        query_parts.append(city)
    if country:
        query_parts.append(country)
    text_query = " ".join(query_parts)

    try:
        resp = await client.post(
            _PLACES_SEARCH_URL,
            headers={
                "X-Goog-Api-Key": app_config.GOOGLE_PLACES_API_KEY,
                "X-Goog-FieldMask": "places.id,places.displayName",
                "Content-Type": "application/json",
            },
            json={"textQuery": text_query},
        )
        resp.raise_for_status()
        data = resp.json()
        places = data.get("places", [])
        if not places:
            return None
        return places[0].get("id")
    except Exception as exc:
        errors.append(f"Place search failed: {exc}")
        return None


async def _fetch_place_details(
    client: httpx.AsyncClient,
    place_id: str,
    errors: list[str],
) -> dict | None:
    """Fetch place details (rating, review count, reviews) by Place ID."""
    url = _PLACES_DETAILS_URL.format(place_id=place_id)
    try:
        resp = await client.get(
            url,
            headers={
                "X-Goog-Api-Key": app_config.GOOGLE_PLACES_API_KEY,
                "X-Goog-FieldMask": "displayName,rating,userRatingCount,reviews",
            },
        )
        resp.raise_for_status()
        return resp.json()
    except Exception as exc:
        errors.append(f"Place details fetch failed: {exc}")
        return None


async def fetch_google_reviews(
    business_name: str,
    city: str | None = None,
    country: str | None = None,
    place_id: str | None = None,
) -> GoogleReviewsResult:
    """Fetch Google Reviews data. Never raises — errors stored in result.errors."""
    start = time.time()

    if app_config.MOCK_GOOGLE_REVIEWS:
        logger.info("Google Reviews: returning mock data")
        return _mock_result()

    errors: list[str] = []

    async with httpx.AsyncClient(timeout=30.0) as client:
        # Auto-detect Place ID if not provided
        if place_id is None:
            place_id = await _search_place_id(
                client, business_name, city, country, errors
            )

        if place_id is None:
            return GoogleReviewsResult(
                warning="NO_GOOGLE_PLACE_FOUND",
                errors=errors,
                processingTimeMs=int((time.time() - start) * 1000),
            )

        details = await _fetch_place_details(client, place_id, errors)

    if details is None:
        return GoogleReviewsResult(
            placeId=place_id,
            errors=errors,
            processingTimeMs=int((time.time() - start) * 1000),
        )

    # Parse reviews into samples
    review_samples: list[GoogleReviewSample] = []
    for review in details.get("reviews", [])[:5]:
        review_samples.append(
            GoogleReviewSample(
                authorName=review.get("authorAttribution", {}).get("displayName", ""),
                rating=review.get("rating", 0),
                relativeTime=review.get("relativePublishTimeDescription", ""),
                text=(review.get("text", {}).get("text", "") if isinstance(review.get("text"), dict) else review.get("text", "")),
            )
        )

    display_name = details.get("displayName", {})
    biz_name = display_name.get("text", "") if isinstance(display_name, dict) else str(display_name)

    return GoogleReviewsResult(
        placeId=place_id,
        rating=details.get("rating"),
        totalReviews=details.get("userRatingCount"),
        businessNameOnGoogle=biz_name,
        reviewSamples=review_samples,
        errors=errors,
        processingTimeMs=int((time.time() - start) * 1000),
    )
