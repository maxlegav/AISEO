/**
 * Spend guard for the LLM APIs.
 *
 * Cost scales as `prompts × engines × runs`, and nothing in the plan limits
 * caps that product: `maxLLMs` and `projects` are bounded, but the question
 * count and the daily frequency multiply freely. One project at 150 questions
 * on four engines running daily is ~34 € a month — more than the whole Pro
 * budget, for one of the ten projects that plan advertises.
 *
 * Budgets are set so the LLM bill stays under a third of the plan price, which
 * on Solo means 8,50 € against 29 € — inside the 5-10 € the business asked for,
 * and enough for 150 questions per project (405 without Perplexity).
 *
 * ⚠️ These are a **business decision**, not a technical one. Re-derive them
 * from real invoices; override without a deploy via
 * `MONITORING_BUDGET_SOLO_EUR` / `_PRO_EUR` / `_AGENCY_EUR`.
 */
import mongoose from "mongoose";
import LLMResult from "@/models/LLMResult";
import Project from "@/models/Project";
import { planForTier } from "@/lib/monitoring/plans";
import type { SubscriptionTier } from "@/lib/subscription-limits";
import type { LLMId, MonitoringFrequency } from "@/lib/monitoring/types";
import { isLLMId } from "@/lib/monitoring/types";
import { callCostUEur, monthlyCostUEur, runCostUEur, formatEur } from "@/lib/monitoring/cost";

/**
 * Monthly LLM budget per plan, in euros.
 *
 * Sized from the promise made to the business rather than a round number:
 * Solo must fund 150 questions on two weekly projects, which costs 8,15 € on
 * the worst engine mix — hence 8,50 € and not 8, which would have refused the
 * advertised configuration by 2 %. Same reasoning for Agence and its 20
 * projects. All three sit under a third of the plan price.
 */
const DEFAULT_BUDGET_EUR: Record<string, number> = {
  solo: 8.5,
  pro: 22,
  agency: 45,
};

/** Monthly budget for a tier, in micro-euros. */
export function monthlyBudgetUEur(tier: SubscriptionTier): number {
  const plan = planForTier(tier);
  const override = Number(process.env[`MONITORING_BUDGET_${plan.id.toUpperCase()}_EUR`]);
  const eur =
    Number.isFinite(override) && override > 0
      ? override
      : (DEFAULT_BUDGET_EUR[plan.id] ?? DEFAULT_BUDGET_EUR.solo!);
  return Math.round(eur * 1_000_000);
}

/** First instant of the current month, UTC — the counter resets here. */
export function startOfMonth(now: Date = new Date()): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

export interface UsageStatus {
  /** Actually spent since the start of the month, micro-euros. */
  usedUEur: number;
  /** What the active configurations will spend over a full month. */
  projectedUEur: number;
  budgetUEur: number;
  remainingUEur: number;
  /** Spend as a share of the budget, 0-1+ (can exceed 1). */
  ratio: number;
  /** True once the month's budget is spent: runs must stop. */
  exceeded: boolean;
  /** True past 80 %: worth warning about before it bites. */
  nearLimit: boolean;
  /** Pre-formatted for display, so the UI never re-derives the division. */
  used: string;
  projected: string;
  budget: string;
}

function buildStatus(usedUEur: number, projectedUEur: number, budgetUEur: number): UsageStatus {
  return {
    usedUEur,
    projectedUEur,
    budgetUEur,
    remainingUEur: Math.max(0, budgetUEur - usedUEur),
    ratio: budgetUEur === 0 ? 0 : usedUEur / budgetUEur,
    exceeded: usedUEur >= budgetUEur,
    nearLimit: budgetUEur > 0 && usedUEur / budgetUEur >= 0.8,
    used: formatEur(usedUEur),
    projected: formatEur(projectedUEur),
    budget: formatEur(budgetUEur),
  };
}

/**
 * Actual + projected spend for an organization this month.
 *
 * `used` is derived from the stored `LLMResult` documents — one per API call —
 * grouped by engine, so an expensive Perplexity call is not counted like a
 * cheap Gemini one. Mock results count too: they stand for calls that *would*
 * be paid once keys are configured, which is the point of sizing the guard
 * before that happens.
 */
export async function getUsage(
  organizationId: string,
  tier: SubscriptionTier,
): Promise<UsageStatus> {
  const budgetUEur = monthlyBudgetUEur(tier);

  const projects = await Project.find({ organizationId })
    .select("prompts llms frequency active")
    .lean<
      { prompts: string[]; llms: LLMId[]; frequency: MonitoringFrequency; active: boolean }[]
    >();

  const projectedUEur = projects
    .filter((p) => p.active)
    .reduce(
      (acc, p) =>
        acc +
        monthlyCostUEur({
          prompts: p.prompts.length,
          engines: p.llms,
          frequency: p.frequency,
        }),
      0,
    );

  const ids = (await Project.find({ organizationId }).distinct(
    "_id",
  )) as mongoose.Types.ObjectId[];

  let usedUEur = 0;
  if (ids.length > 0) {
    const byEngine = await LLMResult.aggregate<{ _id: string; count: number }>([
      { $match: { projectId: { $in: ids }, capturedAt: { $gte: startOfMonth() } } },
      { $group: { _id: "$llm", count: { $sum: 1 } } },
    ]);
    for (const row of byEngine) {
      if (isLLMId(row._id)) usedUEur += row.count * callCostUEur(row._id);
    }
  }

  return buildStatus(usedUEur, projectedUEur, budgetUEur);
}

/**
 * Can this organization afford one more run?
 *
 * Checked before spending, not after: a run that would cross the ceiling is
 * skipped whole rather than truncated halfway through a question set, which
 * would leave the week's score computed on a different sample than the week
 * before — destroying the only thing the product sells, comparability.
 */
export function canAffordRun(
  usage: UsageStatus,
  prompts: number,
  engines: LLMId[],
): boolean {
  return usage.usedUEur + runCostUEur(prompts, engines) <= usage.budgetUEur;
}

/** Human-readable reason, for the API response and the run log. */
export function budgetMessage(usage: UsageStatus): string {
  return (
    `Budget d'analyse épuisé pour ce mois : ${usage.used} consommés sur ${usage.budget}. ` +
    `Réduisez le nombre de requêtes, désactivez un moteur (Perplexity représente ~2/3 du coût), ` +
    `passez en hebdomadaire, ou attendez la remise à zéro du mois prochain.`
  );
}

/** Number of active daily projects in an organization — see `dailyProjects`. */
export async function countDailyProjects(organizationId: string): Promise<number> {
  return Project.countDocuments({ organizationId, frequency: "daily", active: true });
}
