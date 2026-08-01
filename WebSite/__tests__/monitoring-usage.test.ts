import { describe, expect, it } from "vitest";
import {
  monthlyBudgetUEur,
  canAffordRun,
  startOfMonth,
  type UsageStatus,
} from "@/lib/monitoring/usage";
import {
  callCostUEur,
  runCostUEur,
  monthlyCostUEur,
  affordablePrompts,
  formatEur,
} from "@/lib/monitoring/cost";
import { LLM_ORDER } from "@/lib/monitoring/types";

const status = (usedUEur: number, budgetUEur: number): UsageStatus => ({
  usedUEur,
  projectedUEur: 0,
  budgetUEur,
  remainingUEur: Math.max(0, budgetUEur - usedUEur),
  ratio: usedUEur / budgetUEur,
  exceeded: usedUEur >= budgetUEur,
  nearLimit: usedUEur / budgetUEur >= 0.8,
  used: formatEur(usedUEur),
  projected: formatEur(0),
  budget: formatEur(budgetUEur),
});

describe("per-engine cost", () => {
  it("prices Perplexity far above the others, because of its per-request fee", () => {
    // The whole reason the budget is in money and not in calls.
    expect(callCostUEur("perplexity")).toBeGreaterThan(callCostUEur("gemini") * 5);
    expect(callCostUEur("perplexity")).toBeGreaterThan(callCostUEur("chatgpt") * 20);
  });

  it("makes Perplexity about two thirds of a four-engine run", () => {
    const all = runCostUEur(1, LLM_ORDER);
    expect(callCostUEur("perplexity") / all).toBeGreaterThan(0.6);
  });

  it("charges a four-engine run about 0,0075 € per question", () => {
    expect(runCostUEur(1, LLM_ORDER)).toBeGreaterThan(7_000);
    expect(runCostUEur(1, LLM_ORDER)).toBeLessThan(8_000);
  });
});

describe("monthlyCostUEur", () => {
  it("makes daily 7.5x weekly", () => {
    const shape = { prompts: 100, engines: LLM_ORDER };
    const weekly = monthlyCostUEur({ ...shape, frequency: "weekly" });
    const daily = monthlyCostUEur({ ...shape, frequency: "daily" });
    expect(daily / weekly).toBeCloseTo(7.5, 5);
  });

  it("shows that one daily project outgrows the whole Pro budget", () => {
    // The finding that justifies capping daily to a quota of projects.
    const one = monthlyCostUEur({
      prompts: 150,
      engines: LLM_ORDER,
      frequency: "daily",
    });
    expect(one).toBeGreaterThan(monthlyBudgetUEur("pro"));
  });
});

describe("monthlyBudgetUEur", () => {
  it("holds the agreed budgets", () => {
    expect(monthlyBudgetUEur("none")).toBe(8_500_000);
    expect(monthlyBudgetUEur("pro")).toBe(22_000_000);
    expect(monthlyBudgetUEur("agency")).toBe(45_000_000);
  });

  it("falls back to Solo for legacy tiers", () => {
    expect(monthlyBudgetUEur("data")).toBe(monthlyBudgetUEur("solo"));
  });
});

describe("what the Solo budget actually buys", () => {
  const solo = monthlyBudgetUEur("solo");

  it("funds 150 questions per project on two weekly projects", () => {
    // The commitment made to the business: 29 € plan, ~8 € of API, 150 questions.
    const cost = monthlyCostUEur({
      prompts: 150,
      engines: ["chatgpt", "perplexity", "claude"],
      frequency: "weekly",
    });
    expect(cost * 2).toBeLessThanOrEqual(solo);
  });

  it("funds far more once Perplexity is off", () => {
    const withPplx = affordablePrompts(solo, ["chatgpt", "perplexity", "claude"], "weekly", 2);
    const without = affordablePrompts(solo, ["chatgpt", "claude", "gemini"], "weekly", 2);
    expect(withPplx).toBeGreaterThanOrEqual(150);
    expect(without).toBeGreaterThan(withPplx * 2.5);
  });
});

describe("canAffordRun", () => {
  const engines = LLM_ORDER;

  it("allows a run that fits in what is left", () => {
    const budget = monthlyBudgetUEur("solo");
    const cost = runCostUEur(100, engines);
    expect(canAffordRun(status(budget - cost, budget), 100, engines)).toBe(true);
  });

  it("refuses a run that would cross the ceiling", () => {
    // Refused whole, never truncated: a partial question set would score the
    // week on a different sample than the week before.
    const budget = monthlyBudgetUEur("solo");
    const cost = runCostUEur(100, engines);
    expect(canAffordRun(status(budget - cost + 1, budget), 100, engines)).toBe(false);
  });
});

describe("formatEur", () => {
  it("renders micro-euros as the customer reads them", () => {
    expect(formatEur(8_150_000)).toBe("8,15 €");
  });
});

describe("startOfMonth", () => {
  it("resets on the first day of the month, in UTC", () => {
    expect(startOfMonth(new Date("2026-08-17T23:45:00Z")).toISOString()).toBe(
      "2026-08-01T00:00:00.000Z",
    );
  });
});
