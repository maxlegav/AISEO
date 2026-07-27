/**
 * Measured impact: the *observed* movement of a project's visibility over recent
 * weeks, computed from the stored WeeklyScore history. This is real data (week
 * over week), as opposed to the heuristic "estimated impact" of a recommendation
 * in `recommendations.ts`. It answers "did the actions we took actually move the
 * numbers?" rather than "how much might this action be worth?".
 *
 * Pure and unit-tested: no DB / IO here.
 */
import { LLM_ORDER, type LLMId } from "./types";

/** A single stored weekly score point (subset of WeeklyScore we need). */
export interface ScorePoint {
  scope: LLMId | "global";
  week: string;
  presenceRate: number;
}

export interface ScopeMovement {
  scope: LLMId | "global";
  /** Presence rate at the start of the window (baseline). */
  baseline: number;
  /** Presence rate at the most recent week. */
  latest: number;
  /** latest - baseline, in points. */
  delta: number;
  /** Direction of the observed movement. */
  trend: "up" | "down" | "flat";
}

export interface MeasuredImpact {
  /** Most recent week present in the series. */
  latestWeek: string;
  /** Baseline week the movement is measured from. */
  baselineWeek: string;
  /** Number of distinct weeks spanned by the window (>= 1). */
  weeksSpanned: number;
  /** Movement of the global score over the window. */
  global: ScopeMovement | null;
  /** Movement per engine over the window, engines in display order. */
  engines: ScopeMovement[];
  /** Whether at least two distinct weeks were available to compare. */
  hasHistory: boolean;
}

function movement(
  scope: LLMId | "global",
  baseline: number,
  latest: number,
): ScopeMovement {
  const delta = Math.round(latest - baseline);
  return {
    scope,
    baseline,
    latest,
    delta,
    trend: delta > 0 ? "up" : delta < 0 ? "down" : "flat",
  };
}

/**
 * Compute the observed movement of each scope between the most recent week and
 * the week `windowWeeks` earlier (clamped to the earliest week available).
 * Returns `hasHistory: false` when there is only a single week of data.
 */
export function measureImpact(
  points: ScorePoint[],
  windowWeeks = 4,
): MeasuredImpact {
  const weeks = Array.from(new Set(points.map((p) => p.week))).sort();
  const latestWeek = weeks[weeks.length - 1] ?? "";
  // Baseline week: `windowWeeks` steps back, clamped to the earliest week.
  const baselineIdx = Math.max(0, weeks.length - 1 - windowWeeks);
  const baselineWeek = weeks[baselineIdx] ?? latestWeek;
  const hasHistory = weeks.length >= 2 && baselineWeek !== latestWeek;

  const rateAt = (scope: LLMId | "global", week: string): number | null => {
    const p = points.find((x) => x.scope === scope && x.week === week);
    return p ? p.presenceRate : null;
  };

  const scopeMovement = (scope: LLMId | "global"): ScopeMovement | null => {
    const latest = rateAt(scope, latestWeek);
    if (latest === null) return null;
    const baseline = rateAt(scope, baselineWeek) ?? latest;
    return movement(scope, baseline, latest);
  };

  return {
    latestWeek,
    baselineWeek,
    weeksSpanned: Math.max(1, weeks.length ? weeks.length - baselineIdx : 1),
    global: scopeMovement("global"),
    engines: LLM_ORDER.flatMap((llm) => {
      const m = scopeMovement(llm);
      return m ? [m] : [];
    }),
    hasHistory,
  };
}
