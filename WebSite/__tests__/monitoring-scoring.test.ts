import { describe, it, expect } from "vitest";
import {
  computeLLMScores,
  computeGlobalScore,
  computeDelta,
  ResultInput,
} from "@/lib/monitoring/scoring";
import { isoWeek } from "@/lib/monitoring/week";

describe("computeLLMScores", () => {
  it("computes presence rate and average position per engine", () => {
    const results: ResultInput[] = [
      { llm: "perplexity", brandMentioned: true, brandPosition: 1 },
      { llm: "perplexity", brandMentioned: true, brandPosition: 3 },
      { llm: "perplexity", brandMentioned: false, brandPosition: null },
      { llm: "claude", brandMentioned: false, brandPosition: null },
    ];
    const scores = computeLLMScores(results);
    const px = scores.find((s) => s.llm === "perplexity")!;
    expect(px.presenceRate).toBe(67); // 2/3 rounded
    expect(px.avgPosition).toBe(2); // (1+3)/2
    const cl = scores.find((s) => s.llm === "claude")!;
    expect(cl.presenceRate).toBe(0);
    expect(cl.avgPosition).toBeNull();
  });

  it("omits engines with no sampled results", () => {
    const scores = computeLLMScores([{ llm: "chatgpt", brandMentioned: true, brandPosition: 1 }]);
    expect(scores.map((s) => s.llm)).toEqual(["chatgpt"]);
  });
});

describe("computeGlobalScore", () => {
  it("averages per-LLM presence rates equally", () => {
    const scores = computeLLMScores([
      { llm: "chatgpt", brandMentioned: true, brandPosition: 1 },
      { llm: "claude", brandMentioned: false, brandPosition: null },
    ]);
    expect(computeGlobalScore(scores)).toBe(50); // (100 + 0) / 2
  });

  it("returns 0 with no scores", () => {
    expect(computeGlobalScore([])).toBe(0);
  });
});

describe("computeDelta", () => {
  it("returns the point difference vs the previous week", () => {
    expect(computeDelta(60, 45)).toBe(15);
    expect(computeDelta(40, 55)).toBe(-15);
  });

  it("returns 0 when there is no previous data", () => {
    expect(computeDelta(60, null)).toBe(0);
    expect(computeDelta(60, undefined)).toBe(0);
  });
});

describe("isoWeek", () => {
  it("keys weeks as YYYY-Www", () => {
    expect(isoWeek(new Date("2026-07-16T00:00:00Z"))).toMatch(/^2026-W\d{2}$/);
  });

  it("is stable within the same ISO week", () => {
    const mon = isoWeek(new Date("2026-07-13T00:00:00Z"));
    const sun = isoWeek(new Date("2026-07-19T00:00:00Z"));
    expect(mon).toBe(sun);
  });
});
