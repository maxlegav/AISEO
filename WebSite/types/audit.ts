/**
 * Placeholder Audit interface for Story 1.3.
 *
 * NOTE: This is a minimal interface for store typing only.
 * Full implementation with all fields (businessSnapshot, promptResults,
 * recommendations, htmlScan, etc.) will be added in Epic 4 (Audit Engine).
 *
 * @see architecture.md for complete Audit model specification
 */
export interface Audit {
  /** MongoDB ObjectId as string */
  _id: string;
  /** User who owns this audit */
  userId: string;
  /** Business being audited */
  businessId: string;
  /** Current audit status */
  status: 'pending' | 'processing' | 'completed' | 'failed';
  /** GEO health score (0-100), null if not yet calculated */
  geoScore: number | null;
  /** ISO 8601 date string when audit was created */
  createdAt: string;
  /** ISO 8601 date string when audit completed, null if in progress */
  completedAt: string | null;
}

/**
 * Progress information for ongoing audit processing.
 * Used for real-time UI updates during audit execution.
 */
export interface AuditProgress {
  /** Current step number */
  current: number;
  /** Total number of steps */
  total: number;
  /** Human-readable description of current stage */
  stage: string;
}
