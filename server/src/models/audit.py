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

    discoverabilityThreshold: DiscoverabilityThreshold | None = None
    competitorResults: list[CompetitorResult] = []

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
