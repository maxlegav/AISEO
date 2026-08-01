import { describe, expect, it } from "vitest";
import {
  projectedMonthlyCalls,
  monthlyCallBudget,
  canAfford,
  startOfMonth,
  type UsageStatus,
} from "@/lib/monitoring/usage";

const usage = (used: number, budget: number): UsageStatus => ({
  used,
  projected: 0,
  budget,
  remaining: Math.max(0, budget - used),
  ratio: used / budget,
  exceeded: used >= budget,
  nearLimit: used / budget >= 0.8,
});

describe("projectedMonthlyCalls", () => {
  it("multiplies prompts by engines by runs", () => {
    expect(projectedMonthlyCalls({ prompts: 100, engines: 4, frequency: "daily" })).toBe(12_000);
    expect(projectedMonthlyCalls({ prompts: 100, engines: 4, frequency: "weekly" })).toBe(1_600);
  });

  it("shows that a single daily project can outgrow the Pro budget", () => {
    // The reason this guard exists: nothing in the plan limits caps this
    // product, so one project can consume more than the whole month's budget.
    const one = projectedMonthlyCalls({ prompts: 100, engines: 4, frequency: "daily" });
    expect(one).toBeGreaterThan(monthlyCallBudget("pro"));
  });
});

describe("monthlyCallBudget", () => {
  it("grows with the plan", () => {
    expect(monthlyCallBudget("none")).toBeLessThan(monthlyCallBudget("pro"));
    expect(monthlyCallBudget("pro")).toBeLessThan(monthlyCallBudget("agency"));
  });

  it("falls back to the Solo budget for legacy tiers", () => {
    expect(monthlyCallBudget("data")).toBe(monthlyCallBudget("solo"));
  });
});

describe("canAfford", () => {
  it("allows a run that fits exactly in what is left", () => {
    expect(canAfford(usage(9_000, 10_000), 1_000)).toBe(true);
  });

  it("refuses a run that would cross the ceiling", () => {
    // Refused whole rather than truncated: a partial prompt set would produce
    // a weekly score computed on a different sample than the week before.
    expect(canAfford(usage(9_000, 10_000), 1_001)).toBe(false);
  });

  it("refuses everything once the budget is spent", () => {
    expect(canAfford(usage(10_000, 10_000), 1)).toBe(false);
  });
});

describe("startOfMonth", () => {
  it("resets on the first day of the month, in UTC", () => {
    const d = startOfMonth(new Date("2026-08-17T23:45:00Z"));
    expect(d.toISOString()).toBe("2026-08-01T00:00:00.000Z");
  });
});
