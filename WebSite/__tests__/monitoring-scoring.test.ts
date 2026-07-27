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
  it("weights per-LLM presence rates by engine usage share", () => {
    const scores = computeLLMScores([
      { llm: "chatgpt", brandMentioned: true, brandPosition: 1 },
      { llm: "claude", brandMentioned: false, brandPosition: null },
    ]);
    // chatgpt (0.6) at 100, claude (0.1) at 0 → 60 / 0.7 ≈ 86,
    // not the equal-weight 50: being cited on the dominant engine matters more.
    expect(computeGlobalScore(scores)).toBe(86);
  });

  it("re-normalises weights over only the evaluated engines", () => {
    const scores = computeLLMScores([
      { llm: "chatgpt", brandMentioned: true, brandPosition: 1 },
    ]);
    expect(computeGlobalScore(scores)).toBe(100);
  });

  it("ranks a widely-used engine above a niche one at equal presence", () => {
    const heavyOnChatgpt = computeLLMScores([
      { llm: "chatgpt", brandMentioned: true, brandPosition: 1 },
      { llm: "claude", brandMentioned: false, brandPosition: null },
    ]);
    const heavyOnClaude = computeLLMScores([
      { llm: "chatgpt", brandMentioned: false, brandPosition: null },
      { llm: "claude", brandMentioned: true, brandPosition: 1 },
    ]);
    expect(computeGlobalScore(heavyOnChatgpt)).toBeGreaterThan(
      computeGlobalScore(heavyOnClaude),
    );
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
