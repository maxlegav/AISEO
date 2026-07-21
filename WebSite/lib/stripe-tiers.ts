/**
 * Single source of truth for mapping Stripe price IDs → subscription tiers and
 * their expected billing mode. Shared by the checkout API and the Stripe
 * webhook so the two can never diverge.
 *
 * SYB v2 recurring *monitoring* prices (`config.monitoring`) are the current
 * product and take precedence. The legacy one-shot / audit prices
 * (`config.stripe`) are kept until billing is fully migrated.
 */
import appConfig from "@/config";
import type { SubscriptionTier } from "@/lib/subscription-limits";

export type BillingMode = "subscription" | "payment";

/** Recurring monitoring price → tier (the SYB v2 product). */
function monitoringTier(priceId: string): SubscriptionTier | null {
  if (!priceId) return null;
  if (priceId === appConfig.monitoring.solo.priceId) return "solo";
  if (priceId === appConfig.monitoring.pro.priceId) return "pro";
  if (priceId === appConfig.monitoring.agency.priceId) return "agency";
  return null;
}

/** Legacy one-shot / audit price → tier. */
function auditTier(priceId: string): SubscriptionTier | null {
  if (!priceId) return null;
  if (priceId === appConfig.stripe.data.priceId) return "data";
  if (priceId === appConfig.stripe.starter.priceId) return "starter";
  if (priceId === appConfig.stripe.pro.priceId) return "pro";
  if (priceId === appConfig.stripe.agency.priceId) return "agency";
  return null;
}

/** True when the price belongs to a recurring monitoring plan. */
export function isMonitoringPriceId(priceId: string): boolean {
  return monitoringTier(priceId) !== null;
}

/**
 * Resolve a Stripe price ID to a subscription tier. Monitoring prices win over
 * legacy audit prices. Throws on unknown IDs so we never provision the wrong
 * tier from an arbitrary attacker-supplied price (see review C2 / M1).
 */
export function getTierFromPriceId(priceId: string): SubscriptionTier {
  const tier = monitoringTier(priceId) ?? auditTier(priceId);
  if (!tier) {
    throw new Error(`Unknown priceId: ${priceId}`);
  }
  return tier;
}

/**
 * Billing mode a given price must be checked out with. Monitoring plans are all
 * recurring; among legacy tiers only `data`/`starter`/`agencyExtraAudit` are
 * one-shot payments.
 */
export function expectedModeForPriceId(priceId: string): BillingMode {
  if (isMonitoringPriceId(priceId)) return "subscription";
  if (priceId === appConfig.stripe.data.priceId) return "payment";
  if (priceId === appConfig.stripe.starter.priceId) return "payment";
  if (priceId === appConfig.stripe.agencyExtraAudit.priceId) return "payment";
  return "subscription";
}
