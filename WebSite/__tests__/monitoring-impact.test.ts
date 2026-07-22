import { describe, it, expect } from "vitest";
import { computeImpact } from "@/lib/monitoring/impact";
import type { ScoreSnapshot } from "@/models/GeoAction";

function snap(
  globalScore: number,
  engines: Record<string, number>,
  prompt?: { citing: number; total: number },
): ScoreSnapshot {
  return {
    week: "2026-W20",
    globalScore,
    engines: Object.entries(engines).map(([llm, presenceRate]) => ({
      llm: llm as ScoreSnapshot["engines"][number]["llm"],
      presenceRate,
    })),
    promptEnginesCiting: prompt?.citing ?? null,
    promptEnginesTotal: prompt?.total ?? null,
    capturedAt: new Date(),
  };
}

describe("computeImpact", () => {
  it("computes per-engine and global deltas", () => {
    const before = snap(40, { chatgpt: 50, perplexity: 80, claude: 10, gemini: 20 });
    const after = snap(52, { chatgpt: 60, perplexity: 80, claude: 40, gemini: 28 });

    const r = computeImpact(before, after);
    expect(r.global).toEqual({ before: 40, after: 52, delta: 12 });

    const claude = r.engines.find((e) => e.llm === "claude");
    expect(claude).toEqual({ llm: "claude", before: 10, after: 40, delta: 30 });

    const perplexity = r.engines.find((e) => e.llm === "perplexity");
    expect(perplexity?.delta).toBe(0);
    expect(r.noChange).toBe(false);
  });

  it("flags noChange when nothing moved", () => {
    const s = snap(47, { chatgpt: 57, perplexity: 86, claude: 14, gemini: 29 });
    const r = computeImpact(s, snap(47, { chatgpt: 57, perplexity: 86, claude: 14, gemini: 29 }));
    expect(r.noChange).toBe(true);
    expect(r.global.delta).toBe(0);
    expect(r.engines.every((e) => e.delta === 0)).toBe(true);
  });

  it("tracks the target query's engine gain", () => {
    const before = snap(40, { chatgpt: 50 }, { citing: 1, total: 3 });
    const after = snap(45, { chatgpt: 60 }, { citing: 3, total: 3 });
    const r = computeImpact(before, after);
    expect(r.prompt).toEqual({ before: 1, after: 3, total: 3, delta: 2 });
    expect(r.noChange).toBe(false);
  });

  it("reports a negative delta (a regression)", () => {
    const before = snap(60, { chatgpt: 80, gemini: 40 });
    const after = snap(50, { chatgpt: 60, gemini: 40 });
    const r = computeImpact(before, after);
    expect(r.global.delta).toBe(-10);
    const chatgpt = r.engines.find((e) => e.llm === "chatgpt");
    expect(chatgpt?.delta).toBe(-20);
  });

  it("handles a missing target query (no prompt tracked)", () => {
    const before = snap(40, { chatgpt: 50 });
    const after = snap(40, { chatgpt: 50 });
    const r = computeImpact(before, after);
    expect(r.prompt).toBeNull();
    expect(r.noChange).toBe(true);
  });
});
