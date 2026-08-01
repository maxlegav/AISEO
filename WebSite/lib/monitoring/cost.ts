/**
 * What a monitoring run actually costs.
 *
 * Budgeting in "number of API calls" would be wrong here: a Perplexity call
 * costs 27× a Gemini one, because Perplexity bills a flat $5 per 1 000 requests
 * on top of tokens. A call budget would punish a customer who only uses the
 * cheap engines and under-charge one who only uses the expensive one. So the
 * unit is money.
 *
 * Costs are held in **micro-euros** (1e-6 €) as integers: a run of a few
 * thousand calls accumulates rounding errors fast in floating point, and this
 * number decides whether a customer's monitoring stops.
 *
 * Derivation (measured, not guessed — see `lib/llm/system-prompt.ts` for the
 * 156-token system prompt and ~8-token queries; answers are short by design,
 * ~300 output tokens):
 *
 *   input 165 tok · output 300 tok · USD→EUR 1.08
 *
 *   ChatGPT    gpt-4o-mini      $0.15/$0.60 per MTok            → $0.000205
 *   Gemini     gemini-2.5-flash $0.30/$2.50 per MTok            → $0.000800
 *   Claude     haiku-4.5        $1/$5 per MTok                  → $0.001665
 *   Perplexity sonar            $1/$1 per MTok + $5/1k requests → $0.005465
 *
 * Perplexity alone is 67 % of a four-engine run. Dropping it divides the bill
 * by 3.3 — which is why the engine picker is worth a customer's attention.
 *
 * Prices move. Re-derive from the vendors' pages when invoices disagree, and
 * override without a deploy via `MONITORING_COST_<ENGINE>_UEUR`.
 */
import type { LLMId, MonitoringFrequency } from "./types";

/** Cost of one call, in micro-euros. */
const DEFAULT_COST_UEUR: Record<LLMId, number> = {
  chatgpt: 190,
  gemini: 741,
  claude: 1_542,
  perplexity: 5_060,
};

/** Runs per month by frequency. Deliberately generous (30 rather than 28-31). */
export const RUNS_PER_MONTH: Record<MonitoringFrequency, number> = {
  weekly: 4,
  daily: 30,
};

export function callCostUEur(llm: LLMId): number {
  const override = Number(process.env[`MONITORING_COST_${llm.toUpperCase()}_UEUR`]);
  return Number.isFinite(override) && override > 0 ? override : DEFAULT_COST_UEUR[llm];
}

/** Cost of one run of `prompts` questions over `engines`, in micro-euros. */
export function runCostUEur(prompts: number, engines: LLMId[]): number {
  return prompts * engines.reduce((acc, llm) => acc + callCostUEur(llm), 0);
}

/** Cost of a project configuration over a full month, in micro-euros. */
export function monthlyCostUEur(input: {
  prompts: number;
  engines: LLMId[];
  frequency: MonitoringFrequency;
}): number {
  return runCostUEur(input.prompts, input.engines) * RUNS_PER_MONTH[input.frequency];
}

/** "8,15 €" — for messages the customer reads. */
export function formatEur(uEur: number): string {
  return `${(uEur / 1_000_000).toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} €`;
}

/**
 * Largest number of questions per project that stays inside `budgetUEur`,
 * for the given shape. Powers the "you can afford N questions" hint rather
 * than making the customer work it out.
 */
export function affordablePrompts(
  budgetUEur: number,
  engines: LLMId[],
  frequency: MonitoringFrequency,
  projects: number,
): number {
  const unit = runCostUEur(1, engines) * RUNS_PER_MONTH[frequency] * Math.max(1, projects);
  return unit === 0 ? 0 : Math.floor(budgetUEur / unit);
}
