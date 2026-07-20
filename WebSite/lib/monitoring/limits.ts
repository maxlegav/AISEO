import type { SubscriptionTier } from "@/lib/subscription-limits";
import type { MonitoringFrequency } from "@/lib/monitoring/types";
import { planForTier, planAllowsFrequency } from "@/lib/monitoring/plans";

/**
 * Per-plan monitoring limits, derived from `lib/monitoring/plans.ts` (the single
 * source of truth for Solo / Pro / Agence). Legacy Stripe tiers map to Solo
 * during the transition (see `planForTier`).
 */
export function getProjectLimit(tier: SubscriptionTier): number {
  return planForTier(tier).projects;
}

export function getMaxLLMs(tier: SubscriptionTier): number {
  return planForTier(tier).maxLLMs;
}

export function isFrequencyAllowed(
  tier: SubscriptionTier,
  frequency: MonitoringFrequency,
): boolean {
  return planAllowsFrequency(planForTier(tier), frequency);
}
