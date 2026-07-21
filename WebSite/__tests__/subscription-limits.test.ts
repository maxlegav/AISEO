import { describe, it, expect } from "vitest";

import {
  TIER_LIMITS,
  getLimits,
  getCompetitorLimit,
  type SubscriptionTier,
} from "@/lib/subscription-limits";

describe("getLimits", () => {
  it("returns the canonical limits for each tier", () => {
    expect(getLimits("none")).toEqual({ projects: 0, competitors: 0, canCompareHistory: false });
    expect(getLimits("data")).toEqual({ projects: 1, competitors: 3, canCompareHistory: false });
    expect(getLimits("starter")).toEqual({ projects: 1, competitors: 3, canCompareHistory: false });
    expect(getLimits("pro")).toEqual({ projects: 1, competitors: 3, canCompareHistory: true });
    expect(getLimits("agency")).toEqual({ projects: 15, competitors: 3, canCompareHistory: true });
  });

  it("falls back to the 'none' tier for an unknown tier", () => {
    expect(getLimits("enterprise" as SubscriptionTier)).toEqual(TIER_LIMITS.none);
  });

  it("only 'pro' and 'agency' can compare history", () => {
    const canCompare = (Object.keys(TIER_LIMITS) as SubscriptionTier[]).filter(
      (t) => TIER_LIMITS[t].canCompareHistory,
    );
    expect(canCompare.sort()).toEqual(["agency", "pro"]);
  });
});

describe("getCompetitorLimit", () => {
  it("returns 0 for 'none' and 3 for paid tiers", () => {
    expect(getCompetitorLimit("none")).toBe(0);
    expect(getCompetitorLimit("data")).toBe(3);
    expect(getCompetitorLimit("agency")).toBe(3);
  });
});
