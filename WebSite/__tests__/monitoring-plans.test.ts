import { describe, it, expect } from "vitest";
import {
  MONITORING_PLANS,
  planForTier,
  planAllowsFrequency,
} from "@/lib/monitoring/plans";
import {
  getProjectLimit,
  getMaxLLMs,
  isFrequencyAllowed,
} from "@/lib/monitoring/limits";

describe("monitoring plans (Solo / Pro / Agence)", () => {
  it("encodes the PRD limits per plan", () => {
    expect(MONITORING_PLANS.solo.projects).toBe(2);
    expect(MONITORING_PLANS.solo.maxLLMs).toBe(3);
    expect(MONITORING_PLANS.solo.frequencies).toEqual(["weekly"]);
    expect(MONITORING_PLANS.solo.brandedPdf).toBe(false);

    expect(MONITORING_PLANS.pro.projects).toBe(10);
    expect(MONITORING_PLANS.pro.maxLLMs).toBe(5);
    expect(MONITORING_PLANS.pro.frequencies).toContain("daily");

    expect(MONITORING_PLANS.agency.projects).toBe(Infinity);
    expect(MONITORING_PLANS.agency.brandedPdf).toBe(true);
  });

  it("maps legacy tiers to Solo and recurring tiers straight through", () => {
    expect(planForTier("none").id).toBe("solo");
    expect(planForTier("data").id).toBe("solo");
    expect(planForTier("starter").id).toBe("solo");
    expect(planForTier("pro").id).toBe("pro");
    expect(planForTier("agency").id).toBe("agency");
  });

  it("gates frequency by plan", () => {
    expect(planAllowsFrequency(MONITORING_PLANS.solo, "weekly")).toBe(true);
    expect(planAllowsFrequency(MONITORING_PLANS.solo, "daily")).toBe(false);
    expect(planAllowsFrequency(MONITORING_PLANS.pro, "daily")).toBe(true);
  });
});

describe("limits derived from plans", () => {
  it("exposes project/engine/frequency limits per tier", () => {
    expect(getProjectLimit("none")).toBe(2); // Solo during transition
    expect(getProjectLimit("pro")).toBe(10);
    expect(getProjectLimit("agency")).toBe(Infinity);

    expect(getMaxLLMs("none")).toBe(3);
    expect(getMaxLLMs("pro")).toBe(5);

    expect(isFrequencyAllowed("none", "daily")).toBe(false);
    expect(isFrequencyAllowed("pro", "daily")).toBe(true);
  });
});
