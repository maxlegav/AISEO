import { describe, it, expect } from "vitest";
import { measureImpact, type ScorePoint } from "@/lib/monitoring/measured-impact";

function point(scope: ScorePoint["scope"], week: string, presenceRate: number): ScorePoint {
  return { scope, week, presenceRate };
}

describe("measureImpact", () => {
  it("reports the observed movement between the latest and baseline week", () => {
    const points: ScorePoint[] = [
      point("global", "2026-W01", 40),
      point("global", "2026-W02", 45),
      point("global", "2026-W03", 55),
      point("chatgpt", "2026-W01", 50),
      point("chatgpt", "2026-W03", 70),
    ];
    const impact = measureImpact(points, 4);
    expect(impact.latestWeek).toBe("2026-W03");
    expect(impact.baselineWeek).toBe("2026-W01");
    expect(impact.hasHistory).toBe(true);
    expect(impact.global).toMatchObject({ baseline: 40, latest: 55, delta: 15, trend: "up" });
    const chatgpt = impact.engines.find((e) => e.scope === "chatgpt")!;
    expect(chatgpt).toMatchObject({ baseline: 50, latest: 70, delta: 20, trend: "up" });
  });

  it("clamps the baseline to the earliest available week", () => {
    const points: ScorePoint[] = [
      point("global", "2026-W05", 30),
      point("global", "2026-W06", 60),
    ];
    const impact = measureImpact(points, 4);
    expect(impact.baselineWeek).toBe("2026-W05");
    expect(impact.global?.delta).toBe(30);
  });

  it("marks a downward and flat movement correctly", () => {
    const points: ScorePoint[] = [
      point("global", "2026-W01", 60),
      point("global", "2026-W02", 40),
      point("perplexity", "2026-W01", 50),
      point("perplexity", "2026-W02", 50),
    ];
    const impact = measureImpact(points, 4);
    expect(impact.global).toMatchObject({ delta: -20, trend: "down" });
    const px = impact.engines.find((e) => e.scope === "perplexity")!;
    expect(px).toMatchObject({ delta: 0, trend: "flat" });
  });

  it("has no history when there is only a single week", () => {
    const points: ScorePoint[] = [point("global", "2026-W03", 42)];
    const impact = measureImpact(points, 4);
    expect(impact.hasHistory).toBe(false);
    expect(impact.baselineWeek).toBe(impact.latestWeek);
    expect(impact.global).toMatchObject({ baseline: 42, latest: 42, delta: 0, trend: "flat" });
  });
});
