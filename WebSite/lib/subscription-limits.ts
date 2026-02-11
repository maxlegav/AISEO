import mongoose from 'mongoose';
import Business from '@/models/Business';
import User from '@/models/User';

export type SubscriptionTier = 'none' | 'basic' | 'pro' | 'premium';

export interface TierLimits {
  projects: number;
  competitors: number;
  canCompareHistory: boolean;
}

export const TIER_LIMITS: Record<SubscriptionTier, TierLimits> = {
  none: { projects: 0, competitors: 0, canCompareHistory: false },
  basic: { projects: 1, competitors: 1, canCompareHistory: false },
  pro: { projects: 1, competitors: 5, canCompareHistory: true },
  premium: { projects: 10, competitors: Infinity, canCompareHistory: true },
};

export function getLimits(tier: SubscriptionTier): TierLimits {
  return TIER_LIMITS[tier] || TIER_LIMITS.none;
}

export function getCompetitorLimit(tier: SubscriptionTier): number {
  return getLimits(tier).competitors;
}

/**
 * Check if user can create a new project based on their tier.
 * Returns { allowed: true } or { allowed: false, reason: string }.
 */
export async function canCreateProject(userId: string | mongoose.Types.ObjectId): Promise<{ allowed: boolean; reason?: string; currentCount?: number; maxCount?: number }> {
  const user = await User.findById(userId);
  if (!user) {
    return { allowed: false, reason: 'User not found' };
  }

  const tier = user.subscriptionTier as SubscriptionTier;
  const limits = getLimits(tier);

  if (limits.projects === 0) {
    return { allowed: false, reason: 'A subscription is required to create projects', currentCount: 0, maxCount: 0 };
  }

  const currentCount = await Business.countDocuments({
    userId: user._id,
    deletedAt: null,
  });

  if (currentCount >= limits.projects) {
    return {
      allowed: false,
      reason: `You have reached the maximum of ${limits.projects} project(s) for your ${tier} plan. Upgrade to create more.`,
      currentCount,
      maxCount: limits.projects,
    };
  }

  return { allowed: true, currentCount, maxCount: limits.projects };
}
