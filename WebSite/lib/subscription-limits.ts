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
 * Check if user can create a new project based on their tier + audit credits.
 * Each audit credit acts as an extra project slot beyond the subscription tier limit.
 * Returns { allowed: true } or { allowed: false, reason: string, errorCode: string }.
 */
export async function canCreateProject(userId: string | mongoose.Types.ObjectId): Promise<{
  allowed: boolean;
  reason?: string;
  errorCode?: string;
  currentCount?: number;
  maxCount?: number;
}> {
  const user = await User.findById(userId);
  if (!user) {
    return { allowed: false, reason: 'User not found' };
  }

  const tier = user.subscriptionTier as SubscriptionTier;
  const limits = getLimits(tier);
  const credits = user.auditCredits || 0;

  // Total slots = subscription slots + one-shot audit credits
  const maxProjects = limits.projects + credits;

  if (maxProjects === 0) {
    return {
      allowed: false,
      reason: 'A subscription or audit credits are required to create projects.',
      errorCode: 'UPGRADE_REQUIRED',
      currentCount: 0,
      maxCount: 0,
    };
  }

  const currentCount = await Business.countDocuments({
    userId: user._id,
    deletedAt: null,
  });

  if (currentCount >= maxProjects) {
    return {
      allowed: false,
      reason: credits > 0
        ? `You have used all your available slots (${limits.projects} from your ${tier} plan + ${credits} audit credit(s)). Purchase more credits or upgrade your plan.`
        : `You have reached the maximum of ${limits.projects} project(s) for your ${tier} plan. Upgrade or purchase audit credits to create more.`,
      errorCode: 'UPGRADE_REQUIRED',
      currentCount,
      maxCount: maxProjects,
    };
  }

  return { allowed: true, currentCount, maxCount: maxProjects };
}
