/**
 * Spend guard for the LLM APIs.
 *
 * Every (prompt × engine) pair in a run is one paid API call, so cost scales as
 * `prompts × engines × runs`. Nothing in the plan limits caps that product:
 * `maxLLMs` and `projects` are bounded, but the prompt count and the daily
 * frequency multiply freely. A single Pro project with 100 prompts on 4 engines
 * running daily is ~12 000 calls a month — on its own, more than the plan's
 * margin can absorb.
 *
 * ⚠️ The budgets below are a **business decision**, not a technical one. They
 * are set so the LLM bill stays around a quarter of the plan price at an
 * assumed ~€0.002 per call (small models; Perplexity's search-backed calls are
 * the expensive ones and pull the average up). Re-derive them the moment real
 * invoices exist — and override without a deploy via
 * `MONITORING_BUDGET_SOLO` / `_PRO` / `_AGENCY`.
 *
 * Cost math behind the defaults:
 *   Solo    €29/mo → ~€7  of LLM  →  4 000 calls
 *   Pro     €79/mo → ~€20 of LLM  → 10 000 calls
 *   Agence €149/mo → ~€40 of LLM  → 20 000 calls
 *
 * Note what this reveals: at 100 prompts × 4 engines, Pro affords roughly
 * **one** daily project, not the ten the plan advertises. Either the prompt
 * count per project stays modest, or the daily frequency is reserved for fewer
 * projects, or the pricing moves. The guard makes that trade-off visible
 * instead of letting it surface as a surprise invoice.
 */
import mongoose from "mongoose";
import LLMResult from "@/models/LLMResult";
import Project from "@/models/Project";
import { planForTier } from "@/lib/monitoring/plans";
import type { SubscriptionTier } from "@/lib/subscription-limits";
import type { MonitoringFrequency } from "@/lib/monitoring/types";

/** Runs per month, by frequency. Deliberately generous (30 vs 28-31). */
const RUNS_PER_MONTH: Record<MonitoringFrequency, number> = {
  weekly: 4,
  daily: 30,
};

const DEFAULT_BUDGET: Record<string, number> = {
  solo: 4_000,
  pro: 10_000,
  agency: 20_000,
};

function envBudget(planId: string): number | null {
  const raw = process.env[`MONITORING_BUDGET_${planId.toUpperCase()}`];
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** Monthly API-call budget for a tier. */
export function monthlyCallBudget(tier: SubscriptionTier): number {
  const plan = planForTier(tier);
  return envBudget(plan.id) ?? DEFAULT_BUDGET[plan.id] ?? DEFAULT_BUDGET.solo!;
}

/** Calls one project configuration will consume in a month. Pure. */
export function projectedMonthlyCalls(input: {
  prompts: number;
  engines: number;
  frequency: MonitoringFrequency;
}): number {
  return input.prompts * input.engines * RUNS_PER_MONTH[input.frequency];
}

/** First instant of the current month, UTC — the counter resets here. */
export function startOfMonth(now: Date = new Date()): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

export interface UsageStatus {
  /** Calls actually made since the start of the month. */
  used: number;
  /** Calls the current project configurations will consume over a full month. */
  projected: number;
  budget: number;
  remaining: number;
  /** Consumption as a share of the budget, 0-1+ (can exceed 1). */
  ratio: number;
  /** True once the month's budget is spent: runs must stop. */
  exceeded: boolean;
  /** True past 80 %: worth warning about before it bites. */
  nearLimit: boolean;
}

/**
 * Actual + projected consumption for an organization this month.
 *
 * `used` counts stored `LLMResult` documents, which is exactly one per API
 * call, so the counter cannot drift from what was really spent. Mock results
 * are counted too: they represent calls that *would* be paid once keys are
 * configured, which is the whole point of sizing the guard before that happens.
 */
export async function getUsage(
  organizationId: string,
  tier: SubscriptionTier,
): Promise<UsageStatus> {
  const projects = await Project.find({ organizationId })
    .select("prompts llms frequency active")
    .lean<{ prompts: string[]; llms: string[]; frequency: MonitoringFrequency; active: boolean }[]>();

  const projected = projects
    .filter((p) => p.active)
    .reduce(
      (acc, p) =>
        acc +
        projectedMonthlyCalls({
          prompts: p.prompts.length,
          engines: p.llms.length,
          frequency: p.frequency,
        }),
      0,
    );

  const ids = await Project.find({ organizationId }).distinct("_id");
  const used = ids.length
    ? await LLMResult.countDocuments({
        projectId: { $in: ids as mongoose.Types.ObjectId[] },
        capturedAt: { $gte: startOfMonth() },
      })
    : 0;

  const budget = monthlyCallBudget(tier);
  const remaining = Math.max(0, budget - used);

  return {
    used,
    projected,
    budget,
    remaining,
    ratio: budget === 0 ? 0 : used / budget,
    exceeded: used >= budget,
    nearLimit: budget > 0 && used / budget >= 0.8,
  };
}

/**
 * Can this organization afford one more run of `calls` API calls?
 * Checked before spending, not after: a run that would cross the ceiling is
 * skipped whole rather than truncated halfway through a prompt set, which
 * would leave a week's score computed on a partial sample.
 */
export function canAfford(usage: UsageStatus, calls: number): boolean {
  return usage.used + calls <= usage.budget;
}

/** Human-readable reason, for the API response and the run log. */
export function budgetMessage(usage: UsageStatus): string {
  return (
    `Budget d'appels épuisé pour ce mois : ${usage.used.toLocaleString("fr-FR")} sur ` +
    `${usage.budget.toLocaleString("fr-FR")}. Réduisez le nombre de requêtes ou de ` +
    `moteurs, passez en hebdomadaire, ou attendez la remise à zéro du mois prochain.`
  );
}
