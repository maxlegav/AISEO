"""
Business metadata Pydantic models — flexible, type-agnostic.

AuditRequest accepts any business type. The prompt generator LLM receives
ALL fields and adapts prompts accordingly.
"""

from enum import Enum

from pydantic import BaseModel, ConfigDict, Field, HttpUrl

from models.audit import PyObjectId


class LocalityTier(str, Enum):
    """How geographically anchored the business is."""

    HYPER_LOCAL = "hyper_local"   # coffee shop, restaurant, barber, gym
    NATIONAL = "national"         # German shoe brand, national delivery
    GLOBAL = "global"             # SaaS, dropshipping, Amazon-style


class AuditRequest(BaseModel):
    """Request model for the /audit endpoint."""

    model_config = ConfigDict(arbitrary_types_allowed=True)

    # Required fields — every audit must have these
    auditId: str  # MongoDB ObjectId string, created by Next.js
    businessId: PyObjectId
    userId: PyObjectId

    # Core business identity
    businessName: str  # Brand/business name (e.g., "MaisonCuir")
    businessUrl: str  # Primary website URL
    businessType: str  # Free-text type (e.g., "coffee-shop", "e-commerce", "saas")
    category: str  # Business category (e.g., "artisanal leather shoes")
    description: str  # Business description (2-5 sentences)
    language: str = "fr"  # Language for prompts ("fr" or "en")

    # Locality tier (auto-classified if not provided)
    localityTier: LocalityTier | None = None

    # Location (optional — for local businesses)
    city: str | None = None
    neighborhood: str | None = None
    street: str | None = None
    country: str | None = None
    region: str | None = None

    # Business details (optional — enriches prompt quality)
    subUrls: list[str] = []  # Sub-pages to analyze (e.g., /blog, /shop)
    competitorUrls: list[str] = []  # Competitor URLs (max 5)
    competitorNames: list[str] = []  # Competitor brand names
    targetKeywords: list[str] = []  # SEO target keywords
    uniqueSellingPoints: list[str] = []  # What makes the business special
    targetAudience: str | None = None  # Who the business serves
    priceRange: str | None = None  # Budget/mid/premium
    yearFounded: int | None = None  # When business was established
    servicesOrProducts: list[str] = []  # Main offerings
    certifications: list[str] = []  # Organic, fair-trade, ISO, etc.
    socialMediaUrls: list[str] = []  # Social presence

    # Catch-all for business-specific data
    customFields: dict = {}

    # Google Search Console (optional — frontend provides OAuth2 token)
    gscAccessToken: str | None = None   # GSC OAuth2 access token
    gscSiteUrl: str | None = None       # GSC property URL (may differ from businessUrl)

    googlePlaceId: str | None = None  # Auto-detected if not provided


class GscAnalysisRequest(BaseModel):
    """Request model for the standalone /gsc-analysis endpoint."""

    accessToken: str
    siteUrl: str       # GSC property (e.g. "https://example.com/" or "sc-domain:example.com")
    primaryUrl: str    # URL to inspect via the URL Inspection API
    localityTier: str | None = None   # For geo relevance scoring
    country: str | None = None        # Business's expected country (ISO alpha-2)
    daysBack: int = 28


class HtmlScanRequest(BaseModel):
    """Request model for the /html-scan endpoint."""

    url: HttpUrl = Field(..., max_length=2048)
    subUrls: list[str] = Field(default=[], max_length=10)
    language: str = "fr"
    businessType: str | None = None  # e.g. "e-commerce", "restaurant", "news", "saas"
