/**
 * Score computation for the monitoring pipeline.
 *
 * Pure functions: given the raw per-prompt results of a run, produce the
 * per-LLM weekly scores (presence rate, average position, delta vs. previous
 * week) and the aggregated global score. No DB / IO here.
 */

import { LLMId, LLM_ORDER, ENGINE_WEIGHTS } from "./types";

/** One captured result for a (prompt × LLM) pair in a run. */
export interface ResultInput {
  llm: LLMId;
  brandMentioned: boolean;
  brandPosition: number | null;
}

export interface LLMScoreValue {
  llm: LLMId;
  /** % of prompts where the brand was cited, 0-100. */
  presenceRate: number;
  /** Average position when cited (1 = first). null if never cited. */
  avgPosition: number | null;
  /** Number of prompts evaluated for this LLM in the run. */
  sampleSize: number;
}

function round(n: number, decimals = 0): number {
  const f = 10 ** decimals;
  return Math.round(n * f) / f;
}

/** Compute the per-LLM scores for a single run's results. */
export function computeLLMScores(results: ResultInput[]): LLMScoreValue[] {
  return LLM_ORDER.map((llm) => {
    const forLLM = results.filter((r) => r.llm === llm);
    const sampleSize = forLLM.length;
    const mentioned = forLLM.filter((r) => r.brandMentioned);
    const presenceRate = sampleSize === 0 ? 0 : round((mentioned.length / sampleSize) * 100);

    const positions = mentioned
      .map((r) => r.brandPosition)
      .filter((p): p is number => typeof p === "number" && p > 0);
    const avgPosition =
      positions.length === 0
        ? null
        : round(positions.reduce((a, b) => a + b, 0) / positions.length, 1);

    return { llm, presenceRate, avgPosition, sampleSize };
  }).filter((s) => s.sampleSize > 0);
}

/**
 * Global visibility score (0-100): the presence rates of the evaluated engines,
 * weighted by their approximate usage share (`ENGINE_WEIGHTS`). Weights are
 * re-normalised over the engines actually present so a project that tracks only
 * a subset of engines still scores on a 0-100 scale. Being cited on a widely
 * used engine (ChatGPT) therefore moves the score more than a niche one.
 */
export function computeGlobalScore(scores: LLMScoreValue[]): number {
  if (scores.length === 0) return 0;
  const totalWeight = scores.reduce((acc, s) => acc + ENGINE_WEIGHTS[s.llm], 0);
  if (totalWeight === 0) {
    // Degenerate guard: fall back to a plain mean if no weight is known.
    const sum = scores.reduce((acc, s) => acc + s.presenceRate, 0);
    return round(sum / scores.length);
  }
  const weighted = scores.reduce(
    (acc, s) => acc + s.presenceRate * ENGINE_WEIGHTS[s.llm],
    0,
  );
  return round(weighted / totalWeight);
}

/**
 * Delta (in percentage points) between a current and a previous presence rate.
 * Returns the current value when there is no previous data point.
 */
export function computeDelta(current: number, previous: number | null | undefined): number {
  if (previous === null || previous === undefined) return 0;
  return round(current - previous);
}
