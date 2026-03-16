"""
Audit Pydantic models matching the MongoDB schema from audit-engine-spec.md section 11.

Used for validation, serialization, and as the contract between services.
When writing to MongoDB: call .model_dump()
When reading: _id is an ObjectId — convert with str()

Schema version 2: slim top-level fields + single `results` JSON blob.
"""

from typing import Annotated, Any

from bson import ObjectId
from pydantic import BaseModel, BeforeValidator, ConfigDict


def _validate_object_id(v: Any) -> ObjectId:
    if isinstance(v, ObjectId):
        return v
    try:
        return ObjectId(v)
    except Exception:
        raise ValueError(f"Invalid ObjectId: {v!r}")


PyObjectId = Annotated[ObjectId, BeforeValidator(_validate_object_id)]


class EngineResult(BaseModel):
    """Single engine response for one prompt."""

    mentioned: bool = False
    quality: int = 0  # 0-3
    position: int = 0  # rank in response (0 = not mentioned)
    rawResponse: str = ""
    responseTime: int = 0  # milliseconds
    error: str | None = None
    citations: list[dict] = []  # [{"url": str, "title": str|None}, ...]
    targetCited: bool = False  # True if target business URL found in citations


class CitationStats(BaseModel):
    """Aggregated citation statistics across all prompts and engines."""

    totalCitations: int = 0          # Total citation entries across all prompts/engines
    uniqueUrls: int = 0              # Count of unique URLs cited
    targetCitationRate: float = 0.0  # Fraction of prompt/engine pairs where target URL was cited
    topDomains: list[dict] = []      # [{"domain": str, "count": int}] top 10 cited domains
    byEngine: dict[str, dict] = {}   # {engine: {"totalCitations": int, "targetCitationRate": float}}


class GeneratedPrompt(BaseModel):
    """A single generated prompt (part of the 100)."""

    id: int  # 1-100
    level: int  # 1-5
    category: str  # discovery, comparison, reputation, product, alternative, trust
    question: str


class PromptResult(BaseModel):
    """Result for one prompt across all engines."""

    promptId: int  # 1-100
    level: int  # 1-5
    category: str
    question: str
    engines: dict[str, EngineResult] = {}  # {"chatgpt": ..., "claude": ..., etc.}
    promptScore: float = 0.0  # 0.0-1.0
    mentionRate: float = 0.0  # 0.0-1.0


class CategoryScore(BaseModel):
    """Aggregated score for one category."""

    score: float = 0.0
    promptCount: int = 0
    avgMentionRate: float = 0.0


class LevelScore(BaseModel):
    """Aggregated score for one specificity level."""

    score: float = 0.0
    promptCount: int = 0
    avgMentionRate: float = 0.0


class CompetitorResult(BaseModel):
    """Competitor mention analysis using the same 100 prompts."""

    competitorUrl: str
    competitorName: str
    auditEngineScore: float = 0.0
    mentionRate: float = 0.0
    categoryScores: dict[str, float] = {}
    levelScores: dict[str, float] = {}


class DiscoverabilityThreshold(BaseModel):
    """The minimum specificity level at which the business is discovered."""

    level: int | None = None  # 1-5 or None if invisible
    description: str = ""


class BusinessSnapshot(BaseModel):
    """Snapshot of business data at audit time (historical accuracy)."""

    name: str
    primaryUrl: str
    subUrls: list[str] = []
    competitorUrls: list[str] = []
    competitorNames: list[str] = []
    category: str
    description: str
    targetKeywords: list[str] = []
    businessType: str
    localityTier: str | None = None  # hyper_local / national / global
    allMetadata: dict = {}  # Full metadata dump for historical record


class HtmlScanResult(BaseModel):
    """Complete HTML scan results for a website."""

    url: str
    w3cValidation: dict = {}  # vnu.jar results
    linkCheck: dict = {}  # Lychee results
    schemaOrg: dict = {}  # extruct results (JSON-LD, microdata, RDFa, OG)
    metaTags: dict = {}  # title, description, OG, Twitter Cards
    headingStructure: dict = {}  # H1-H6 hierarchy analysis
    imageAltText: dict = {}  # alt text audit
    keywords: list[dict] = []  # top 30 keywords by frequency
    aiBotAccessibility: dict = {}  # AI bot HEAD-request results
    robotsTxtAnalysis: dict = {}  # robots.txt parsing results
    sitemapAnalysis: dict = {}  # sitemap.xml parsing and validation results
    legalPages: dict = {}  # legal page presence check results
    llmsTxtAnalysis: dict = {}  # llms.txt presence and content analysis
    htmlScannerScore: float = 0.0  # 0-100
    scanCompleteness: dict[str, bool] = {}  # which analysis tools ran successfully
    scanErrors: list[str] = []
    hasBlockedUrls: bool = False  # True if any URL was rejected for security reasons
    subPagesScanned: list[dict] | None = None  # [{url, score}] if sub-URLs were scanned


class GscQuery(BaseModel):
    """Single GSC search query row."""

    query: str
    clicks: int
    impressions: int
    ctr: float        # 0.0–1.0 (raw fraction from API)
    position: float   # average rank position


class GscCountryData(BaseModel):
    """GSC traffic breakdown for one country."""

    countryCode: str  # ISO 3166-1 alpha-3, GSC format (e.g. "fra", "usa")
    clicks: int
    impressions: int
    ctr: float
    position: float


class GscIndexStatus(BaseModel):
    """URL Inspection API result for a single URL."""

    inspectedUrl: str
    indexingState: str           # "INDEXING_ALLOWED" | "BLOCKED_BY_META_TAG" | etc.
    robotsTxtState: str | None = None
    pageFetchState: str | None = None
    lastCrawlTime: str | None = None
    googleCanonical: str | None = None
    coverageState: str | None = None


class GscAnalysisResult(BaseModel):
    """Aggregated GSC analysis result stored inside ResultsBlob.gscData."""

    siteUrl: str
    startDate: str
    endDate: str
    topQueries: list[GscQuery] = []
    countryBreakdown: list[GscCountryData] = []
    indexStatus: GscIndexStatus | None = None
    totalClicks: int = 0
    totalImpressions: int = 0
    avgCtr: float = 0.0
    avgPosition: float = 0.0
    primaryGeography: str | None = None  # Top country code by clicks
    geoRelevanceScore: float | None = None  # 0–100
    errors: list[str] = []
    processingTimeMs: int = 0


class GoogleReviewSample(BaseModel):
    """Single review from Places API (up to 5 returned)."""

    authorName: str = ""
    rating: int = 0  # 1-5
    relativeTime: str = ""  # e.g. "2 months ago"
    text: str = ""


class GoogleReviewsResult(BaseModel):
    """Google Reviews data — contextual only, not included in GEO Score."""

    placeId: str | None = None
    rating: float | None = None  # 1.0-5.0 average
    totalReviews: int | None = None  # userRatingCount
    businessNameOnGoogle: str | None = None
    reviewSamples: list[GoogleReviewSample] = []  # up to 5 from API
    warning: str | None = None  # "NO_GOOGLE_PLACE_FOUND" etc.
    errors: list[str] = []
    processingTimeMs: int = 0


class DetectedIssue(BaseModel):
    """A single issue detected by the deterministic issue detector."""

    id: str                       # e.g. "no_robots_txt"
    type: str                     # technical | schema | meta | content | accessibility
    severity: str                 # critical | high | medium | low
    title: str
    description: str
    aiImpact: str | None = None
    source: str = "detector"      # "scanner" or "detector"


class IssuesSummary(BaseModel):
    """Aggregated counts by severity."""

    criticalCount: int = 0
    highCount: int = 0
    mediumCount: int = 0
    lowCount: int = 0
    totalCount: int = 0


class PromptGap(BaseModel):
    """A prompt where the business is not mentioned — a gap in AI visibility."""

    promptId: int
    question: str
    level: int                    # 1-5
    category: str                 # discovery, comparison, etc.
    mentionRate: float = 0.0


class PromptGapsSummary(BaseModel):
    """Summary of prompt gap analysis."""

    totalGaps: int = 0
    prioritizedCount: int = 0
    weakestCategories: list[str] = []


class ResultsBlob(BaseModel):
    """All audit data that lives inside the `results` field in MongoDB.

    Keeps the top-level document slim (only queryable metadata) while
    storing everything else in a single JSON blob.
    """

    businessSnapshot: BusinessSnapshot | None = None
    localityTier: str | None = None
    generatedPrompts: list[GeneratedPrompt] = []
    promptResults: list[PromptResult] = []

    categoryScores: dict[str, CategoryScore] = {}
    levelScores: dict[str, LevelScore] = {}
    auditEngineScore: float | None = None

    htmlScan: HtmlScanResult | None = None
    htmlScannerScore: float | None = None
    gscData: GscAnalysisResult | None = None
    googleReviews: GoogleReviewsResult | None = None

    citationStats: CitationStats | None = None
    citationVisibilityScore: float | None = None  # 0-100

    issues: list[DetectedIssue] = []
    issuesSummary: IssuesSummary | None = None
    promptGaps: list[PromptGap] = []
    promptGapsSummary: PromptGapsSummary | None = None
    llmsTxtContent: str | None = None

    discoverabilityThreshold: DiscoverabilityThreshold | None = None
    competitorResults: list[CompetitorResult] = []
    llmHijackPrompt: str | None = None

    originalRequest: dict = {}  # Stored so Phase 2 can reconstruct AuditRequest without the HTTP call

    enginesUsed: list[str] = []
    enginesSucceeded: list[str] = []
    totalPromptsProcessed: int = 0
    totalResponsesReceived: int = 0
    processingTimeMs: int = 0


class AuditDocument(BaseModel):
    """Full audit document structure for MongoDB (schema version 2).

    Top-level: only queryable metadata + geoScore.
    Everything else lives in the `results` blob.
    """

    model_config = ConfigDict(arbitrary_types_allowed=True)

    businessId: PyObjectId
    userId: PyObjectId
    businessName: str = ""
    status: str = "pending"
    # pending → processing → awaiting_prompt_approval → processing → review_pending / failed
    geoScore: float | None = None
    schemaVersion: int = 2

    results: ResultsBlob = ResultsBlob()

    createdAt: str = ""  # ISO 8601
    completedAt: str | None = None
