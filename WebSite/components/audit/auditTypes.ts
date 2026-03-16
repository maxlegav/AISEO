// ─── Shared types for audit components ───────────────────────────────────────

export interface EngineResult {
  mentioned: boolean;
  quality: number;
  position: number;
  responseTime: number;
  error: string | null;
  rawResponse?: string;
}

export interface PromptResult {
  promptId: number;
  level: number;
  category: string;
  question: string;
  promptScore: number;
  mentionRate: number;
  engines: Record<string, EngineResult>;
}

export interface CategoryScore {
  score: number;
  promptCount: number;
  avgMentionRate: number;
}

export interface LevelScore {
  score: number;
  promptCount: number;
  avgMentionRate: number;
}

export interface CompetitorResult {
  competitorUrl: string;
  competitorName: string;
  auditEngineScore: number;
  mentionRate: number;
  categoryScores: Record<string, number>;
  levelScores: Record<string, number>;
}

export type HtmlScanRecord = Record<string, unknown>;

export interface HtmlScan {
  url?: string;
  metaTags?: HtmlScanRecord;
  schemaOrg?: HtmlScanRecord;
  headingStructure?: HtmlScanRecord;
  imageAltText?: HtmlScanRecord;
  keywords?: { word: string; count: number; tfidf?: number }[];
  aiBotAccessibility?: HtmlScanRecord;
  robotsTxtAnalysis?: HtmlScanRecord;
  sitemapAnalysis?: HtmlScanRecord;
  legalPages?: HtmlScanRecord;
  llmsTxtAnalysis?: HtmlScanRecord;
  htmlScannerScore?: number;
  scanCompleteness?: Record<string, boolean>;
  scanErrors?: string[];
  hasBlockedUrls?: boolean;
  subPagesScanned?: { url: string; score: number }[];
  w3cValidation?: {
    totalMessages?: number;
    errors?: number;
    warnings?: number;
    errorDetails?: string[];
  };
  linkCheck?: {
    total?: number;
    successful?: number;
    failed?: number;
    excluded?: number;
    timeouts?: number;
    brokenLinks?: Record<string, { url: string; status: { text: string; code: number } }[]>;
  };
}

export interface IssueItem {
  id: string;
  type: string;
  severity: "critical" | "high" | "medium" | "low";
  title: string;
  description: string;
  aiImpact: string;
  source: string;
}

export interface PromptGapItem {
  promptId: number;
  question: string;
  level: number;
  category: string;
  mentionRate: number;
}

export interface CitationStats {
  totalCitations: number;
  uniqueUrls: number;
  targetCitationRate: number;
  topDomains: string[];
  byEngine: Record<string, { totalCitations: number; targetCitationRate: number }>;
}

export interface BusinessSnapshot {
  name?: string;
  primaryUrl?: string;
  category?: string;
  description?: string;
  businessType?: string;
  localityTier?: string;
  targetKeywords?: string[];
}

export interface AuditResults {
  auditEngineScore?: number | null;
  htmlScannerScore?: number | null;
  discoverabilityThreshold?: { level: number | null; description: string };
  categoryScores?: Record<string, CategoryScore>;
  levelScores?: Record<string, LevelScore>;
  competitorResults?: CompetitorResult[];
  enginesUsed?: string[];
  enginesSucceeded?: string[];
  totalPromptsProcessed?: number;
  totalResponsesReceived?: number;
  processingTimeMs?: number;
  promptResults?: PromptResult[];
  htmlScan?: HtmlScan | null;
  businessSnapshot?: BusinessSnapshot;
  issues?: IssueItem[];
  issuesSummary?: {
    criticalCount: number;
    highCount: number;
    mediumCount: number;
    lowCount: number;
    totalCount: number;
  };
  promptGaps?: PromptGapItem[];
  promptGapsSummary?: {
    totalGaps: number;
    prioritizedCount: number;
    weakestCategories: string[];
  };
  citationStats?: CitationStats | null;
  citationVisibilityScore?: number | null;
  llmsTxtContent?: string | null;
  llmHijackPrompt?: string | null;
}

export interface AuditDoc {
  _id: string;
  businessId?: string;
  businessName?: string;
  status: string;
  geoScore?: number | null;
  createdAt?: string;
  completedAt?: string;
  error?: string;
  results?: AuditResults;
}
