import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/models/User", () => ({ default: { findById: vi.fn() } }));
vi.mock("@/models/Business", () => ({ default: { countDocuments: vi.fn() } }));

import User from "@/models/User";
import Business from "@/models/Business";
import {
  TIER_LIMITS,
  getLimits,
  getCompetitorLimit,
  canCreateProject,
  type SubscriptionTier,
} from "@/lib/subscription-limits";

const mockedUser = vi.mocked(User) as unknown as { findById: ReturnType<typeof vi.fn> };
const mockedBusiness = vi.mocked(Business) as unknown as {
  countDocuments: ReturnType<typeof vi.fn>;
};

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

describe("canCreateProject", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("denies when the user does not exist", async () => {
    mockedUser.findById.mockResolvedValue(null);
    const res = await canCreateProject("507f1f77bcf86cd799439011");
    expect(res.allowed).toBe(false);
    expect(res.reason).toMatch(/not found/i);
  });

  it("denies with UPGRADE_REQUIRED when tier has no slots and no credits", async () => {
    mockedUser.findById.mockResolvedValue({
      _id: "u1",
      subscriptionTier: "none",
      auditCredits: 0,
    });
    const res = await canCreateProject("u1");
    expect(res.allowed).toBe(false);
    expect(res.errorCode).toBe("UPGRADE_REQUIRED");
    expect(res.maxCount).toBe(0);
  });

  it("allows an agency user under the 15-project limit", async () => {
    mockedUser.findById.mockResolvedValue({
      _id: "u2",
      subscriptionTier: "agency",
      auditCredits: 0,
    });
    mockedBusiness.countDocuments.mockResolvedValue(3);
    const res = await canCreateProject("u2");
    expect(res.allowed).toBe(true);
    expect(res.maxCount).toBe(15);
    expect(res.currentCount).toBe(3);
  });

  it("treats audit credits as extra project slots beyond the tier limit", async () => {
    // 'data' tier = 1 project slot; +2 credits => 3 total slots
    mockedUser.findById.mockResolvedValue({
      _id: "u3",
      subscriptionTier: "data",
      auditCredits: 2,
    });
    mockedBusiness.countDocuments.mockResolvedValue(2);
    const res = await canCreateProject("u3");
    expect(res.allowed).toBe(true);
    expect(res.maxCount).toBe(3);
  });

  it("denies when the user has reached their combined slot limit", async () => {
    mockedUser.findById.mockResolvedValue({
      _id: "u4",
      subscriptionTier: "starter",
      auditCredits: 0,
    });
    mockedBusiness.countDocuments.mockResolvedValue(1); // 1 slot, already used
    const res = await canCreateProject("u4");
    expect(res.allowed).toBe(false);
    expect(res.errorCode).toBe("UPGRADE_REQUIRED");
    expect(res.maxCount).toBe(1);
  });
});
