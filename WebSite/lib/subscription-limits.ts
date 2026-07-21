export type SubscriptionTier = 'none' | 'data' | 'starter' | 'solo' | 'pro' | 'agency';

export interface TierLimits {
  projects: number;
  competitors: number;
  canCompareHistory: boolean;
}

// NOTE: these limits gate the *legacy* audit product (Business docs). SYB v2
// monitoring project/engine/frequency limits live in `lib/monitoring/limits.ts`
// (driven by `MONITORING_PLANS`). `solo` mirrors the entry monitoring plan.
export const TIER_LIMITS: Record<SubscriptionTier, TierLimits> = {
  none:    { projects: 0,  competitors: 0, canCompareHistory: false },
  data:    { projects: 1,  competitors: 3, canCompareHistory: false },
  starter: { projects: 1,  competitors: 3, canCompareHistory: false },
  solo:    { projects: 2,  competitors: 3, canCompareHistory: false },
  pro:     { projects: 1,  competitors: 3, canCompareHistory: true  },
  agency:  { projects: 15, competitors: 3, canCompareHistory: true  },
};

export function getLimits(tier: SubscriptionTier): TierLimits {
  return TIER_LIMITS[tier] || TIER_LIMITS.none;
}

export function getCompetitorLimit(tier: SubscriptionTier): number {
  return getLimits(tier).competitors;
}
