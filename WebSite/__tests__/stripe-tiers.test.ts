import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import type * as StripeTiers from "@/lib/stripe-tiers";

// config.ts reads the price IDs from env at import time, so we stub the env and
// (re)import both config and stripe-tiers to exercise the real mapping.
const IDS = {
  monSolo: "price_mon_solo",
  monPro: "price_mon_pro",
  monAgency: "price_mon_agency",
  auditData: "price_audit_data",
  auditStarter: "price_audit_starter",
  auditPro: "price_audit_pro",
  auditAgency: "price_audit_agency",
  auditExtra: "price_audit_extra",
} as const;

let tiers: typeof StripeTiers;

beforeAll(async () => {
  vi.stubEnv("NEXT_PUBLIC_STRIPE_PRICE_ID_MONITORING_SOLO", IDS.monSolo);
  vi.stubEnv("NEXT_PUBLIC_STRIPE_PRICE_ID_MONITORING_PRO", IDS.monPro);
  vi.stubEnv("NEXT_PUBLIC_STRIPE_PRICE_ID_MONITORING_AGENCY", IDS.monAgency);
  vi.stubEnv("NEXT_PUBLIC_STRIPE_PRICE_ID_DATA", IDS.auditData);
  vi.stubEnv("NEXT_PUBLIC_STRIPE_PRICE_ID_STARTER", IDS.auditStarter);
  vi.stubEnv("NEXT_PUBLIC_STRIPE_PRICE_ID_PRO", IDS.auditPro);
  vi.stubEnv("NEXT_PUBLIC_STRIPE_PRICE_ID_AGENCY", IDS.auditAgency);
  vi.stubEnv("NEXT_PUBLIC_STRIPE_PRICE_ID_AGENCY_EXTRA", IDS.auditExtra);
  vi.resetModules();
  tiers = await import("@/lib/stripe-tiers");
});

afterAll(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("getTierFromPriceId", () => {
  it("maps monitoring prices to their tier", () => {
    expect(tiers.getTierFromPriceId(IDS.monSolo)).toBe("solo");
    expect(tiers.getTierFromPriceId(IDS.monPro)).toBe("pro");
    expect(tiers.getTierFromPriceId(IDS.monAgency)).toBe("agency");
  });

  it("maps legacy audit prices to their tier", () => {
    expect(tiers.getTierFromPriceId(IDS.auditData)).toBe("data");
    expect(tiers.getTierFromPriceId(IDS.auditStarter)).toBe("starter");
    expect(tiers.getTierFromPriceId(IDS.auditPro)).toBe("pro");
    expect(tiers.getTierFromPriceId(IDS.auditAgency)).toBe("agency");
  });

  it("throws on unknown or empty price IDs", () => {
    expect(() => tiers.getTierFromPriceId("price_nope")).toThrow();
    expect(() => tiers.getTierFromPriceId("")).toThrow();
  });
});

describe("isMonitoringPriceId", () => {
  it("is true only for monitoring plan prices", () => {
    expect(tiers.isMonitoringPriceId(IDS.monSolo)).toBe(true);
    expect(tiers.isMonitoringPriceId(IDS.monPro)).toBe(true);
    expect(tiers.isMonitoringPriceId(IDS.monAgency)).toBe(true);
    expect(tiers.isMonitoringPriceId(IDS.auditData)).toBe(false);
    expect(tiers.isMonitoringPriceId(IDS.auditPro)).toBe(false);
    expect(tiers.isMonitoringPriceId("")).toBe(false);
  });
});

describe("expectedModeForPriceId", () => {
  it("requires subscription for every monitoring plan", () => {
    expect(tiers.expectedModeForPriceId(IDS.monSolo)).toBe("subscription");
    expect(tiers.expectedModeForPriceId(IDS.monPro)).toBe("subscription");
    expect(tiers.expectedModeForPriceId(IDS.monAgency)).toBe("subscription");
  });

  it("keeps legacy one-shot audits as payment and recurring audits as subscription", () => {
    expect(tiers.expectedModeForPriceId(IDS.auditData)).toBe("payment");
    expect(tiers.expectedModeForPriceId(IDS.auditStarter)).toBe("payment");
    expect(tiers.expectedModeForPriceId(IDS.auditExtra)).toBe("payment");
    expect(tiers.expectedModeForPriceId(IDS.auditPro)).toBe("subscription");
    expect(tiers.expectedModeForPriceId(IDS.auditAgency)).toBe("subscription");
  });
});
