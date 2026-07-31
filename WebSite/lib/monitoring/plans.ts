/**
 * SYB v2 monitoring plans: the single source of truth for per-plan *limits*
 * (how many projects, how many engines, which frequencies, branded PDF).
 *
 * Prices come from `config.monitoring` (the authoritative pricing source); this
 * file only owns the product rules that gate the monitoring pipeline. Keep it
 * free of Node/Mongo/React imports so it can be used from both server and
 * client code.
 */
import appConfig from "@/config";
import type { MonitoringFrequency } from "@/lib/monitoring/types";
import type { SubscriptionTier } from "@/lib/subscription-limits";

export type MonitoringPlanId = "solo" | "pro" | "agency";

export interface MonitoringPlan {
  id: MonitoringPlanId;
  name: string;
  /** Monthly price in EUR (from config.monitoring). */
  price: number;
  /** Max monitored projects. `Infinity` means unlimited. */
  projects: number;
  /** Max distinct engines that can be enabled per project (5 exist). */
  maxLLMs: number;
  /** Monitoring frequencies this plan may select. */
  frequencies: MonitoringFrequency[];
  /** Branded PDF export (agency white-label). */
  brandedPdf: boolean;
}

export const MONITORING_PLANS: Record<MonitoringPlanId, MonitoringPlan> = {
  solo: {
    id: "solo",
    name: appConfig.monitoring.solo.name,
    price: appConfig.monitoring.solo.price,
    projects: 2,
    maxLLMs: 3,
    frequencies: ["weekly"],
    brandedPdf: false,
  },
  pro: {
    id: "pro",
    name: appConfig.monitoring.pro.name,
    price: appConfig.monitoring.pro.price,
    projects: 10,
    maxLLMs: 5,
    frequencies: ["weekly", "daily"],
    brandedPdf: false,
  },
  agency: {
    id: "agency",
    name: appConfig.monitoring.agency.name,
    price: appConfig.monitoring.agency.price,
    projects: Infinity,
    maxLLMs: 5,
    frequencies: ["weekly", "daily"],
    brandedPdf: true,
  },
};

/**
 * Map a Stripe subscription tier to a monitoring plan. During the transition,
 * the legacy one-shot tiers (`none`/`data`/`starter`) map to `solo` so users in
 * the market-validation phase can create and run projects. The recurring tiers
 * map straight through.
 */
export function planForTier(tier: SubscriptionTier): MonitoringPlan {
  switch (tier) {
    case "pro":
      return MONITORING_PLANS.pro;
    case "agency":
      return MONITORING_PLANS.agency;
    case "solo":
    case "none":
    case "data":
    case "starter":
    default:
      return MONITORING_PLANS.solo;
  }
}

export function planAllowsFrequency(
  plan: MonitoringPlan,
  frequency: MonitoringFrequency,
): boolean {
  return plan.frequencies.includes(frequency);
}
