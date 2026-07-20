import type { SubscriptionTier } from "@/lib/subscription-limits";

/**
 * How many monitored projects each plan allows.
 *
 * Bridges the current Stripe tiers (none/data/starter/pro/agency) to the SYB v2
 * monitoring plans until the pricing migration PR lands. `none` gets 1 slot so a
 * user can create their first project during the market-validation / trial phase.
 */
const PROJECT_LIMIT: Record<SubscriptionTier, number> = {
  none: 1,
  data: 2,
  starter: 2,
  pro: 10,
  agency: 1000,
};

export function getProjectLimit(tier: SubscriptionTier): number {
  return PROJECT_LIMIT[tier] ?? PROJECT_LIMIT.none;
}
