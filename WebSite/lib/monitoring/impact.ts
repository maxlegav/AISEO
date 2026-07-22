/**
 * Impact loop: capture a project's visibility snapshot and compare a "before"
 * baseline to an "after" snapshot so we can tell whether a published action
 * moved the score (per engine and globally, plus the target query).
 *
 * `computeImpact` is pure and unit-tested; `captureSnapshot` reads Mongo.
 */
import mongoose from "mongoose";
import WeeklyScore from "@/models/WeeklyScore";
import LLMResult from "@/models/LLMResult";
import { LLM_ORDER, type LLMId } from "@/lib/monitoring/types";
import type { EngineRate, ScoreSnapshot } from "@/models/GeoAction";

export interface EngineDelta {
  llm: LLMId;
  before: number;
  after: number;
  delta: number;
}

export interface ImpactResult {
  global: { before: number; after: number; delta: number };
  engines: EngineDelta[];
  /** Target query, when the action targets one. */
  prompt: {
    before: number | null;
    after: number | null;
    total: number | null;
    delta: number | null;
  } | null;
  /** No engine and no global change between the two snapshots. */
  noChange: boolean;
}

function rateOf(engines: EngineRate[], llm: LLMId): number {
  return engines.find((e) => e.llm === llm)?.presenceRate ?? 0;
}

/**
 * Compare two snapshots. Reports per-engine and global deltas (in points) and
 * the change on the target query, if any. Correlation only, not causation.
 */
export function computeImpact(
  baseline: ScoreSnapshot,
  after: ScoreSnapshot,
): ImpactResult {
  const llms = Array.from(
    new Set([
      ...baseline.engines.map((e) => e.llm),
      ...after.engines.map((e) => e.llm),
    ]),
  ).sort((a, b) => LLM_ORDER.indexOf(a) - LLM_ORDER.indexOf(b));

  const engines: EngineDelta[] = llms.map((llm) => {
    const before = rateOf(baseline.engines, llm);
    const now = rateOf(after.engines, llm);
    return { llm, before, after: now, delta: now - before };
  });

  const global = {
    before: baseline.globalScore,
    after: after.globalScore,
    delta: after.globalScore - baseline.globalScore,
  };

  let prompt: ImpactResult["prompt"] = null;
  if (
    baseline.promptEnginesTotal != null ||
    after.promptEnginesTotal != null
  ) {
    const before = baseline.promptEnginesCiting ?? null;
    const now = after.promptEnginesCiting ?? null;
    prompt = {
      before,
      after: now,
      total: after.promptEnginesTotal ?? baseline.promptEnginesTotal ?? null,
      delta: before != null && now != null ? now - before : null,
    };
  }

  const noChange =
    global.delta === 0 &&
    engines.every((e) => e.delta === 0) &&
    (prompt?.delta ?? 0) === 0;

  return { global, engines, prompt, noChange };
}

/**
 * Capture the current visibility snapshot for a project from its latest week of
 * scores. When `prompt` is given, also records how many engines currently cite
 * the brand on that query (from the latest run's LLMResult rows).
 */
export async function captureSnapshot(
  projectId: mongoose.Types.ObjectId | string,
  prompt?: string | null,
): Promise<ScoreSnapshot> {
  const latest = await WeeklyScore.findOne({ projectId })
    .sort({ week: -1 })
    .lean();
  const week = latest?.week ?? "";

  const scores = week
    ? await WeeklyScore.find({ projectId, week }).lean()
    : [];
  const engines: EngineRate[] = LLM_ORDER.flatMap((llm) => {
    const s = scores.find((x) => x.scope === llm);
    return s ? [{ llm, presenceRate: s.presenceRate }] : [];
  });
  const globalScore = scores.find((x) => x.scope === "global")?.presenceRate ?? 0;

  let promptEnginesCiting: number | null = null;
  let promptEnginesTotal: number | null = null;
  if (prompt && week) {
    const rows = await LLMResult.find({ projectId, week, prompt }).lean();
    // Keep the latest row per engine (multiple runs can share a week).
    const latestByEngine = new Map<LLMId, boolean>();
    for (const r of rows) latestByEngine.set(r.llm as LLMId, r.brandMentioned);
    promptEnginesTotal = latestByEngine.size;
    promptEnginesCiting = Array.from(latestByEngine.values()).filter(Boolean).length;
  }

  return {
    week,
    globalScore,
    engines,
    promptEnginesCiting,
    promptEnginesTotal,
    capturedAt: new Date(),
  };
}

/** True when a project has at least one run to snapshot. */
export async function hasScores(
  projectId: mongoose.Types.ObjectId | string,
): Promise<boolean> {
  const count = await WeeklyScore.countDocuments({ projectId });
  return count > 0;
}
