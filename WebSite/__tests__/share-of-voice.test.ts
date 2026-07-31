import { describe, expect, it } from "vitest";
import { computeShareOfVoice, type VoiceInput } from "@/lib/monitoring/share-of-voice";
import { LLM_ORDER, type LLMId } from "@/lib/monitoring/types";

const flat = (v: number): Record<LLMId, number> =>
  Object.fromEntries(LLM_ORDER.map((e) => [e, v])) as Record<LLMId, number>;

describe("computeShareOfVoice", () => {
  it("splits evenly when everyone is cited as often", () => {
    const brands: VoiceInput[] = [
      { name: "Vous", isYou: true, scores: flat(50) },
      { name: "A", scores: flat(50) },
      { name: "B", scores: flat(50) },
    ];
    const sov = computeShareOfVoice(brands);
    expect(sov.overall).toBeCloseTo(33.3, 0);
    expect(sov.parity).toBeCloseTo(33.3, 0);
    expect(sov.position).toBe(1);
  });

  it("measures the slice held, not the raw presence rate", () => {
    // 45 % presence sounds mediocre — until every rival sits at 15 %.
    const brands: VoiceInput[] = [
      { name: "Vous", isYou: true, scores: flat(45) },
      { name: "A", scores: flat(15) },
      { name: "B", scores: flat(15) },
    ];
    const sov = computeShareOfVoice(brands);
    expect(sov.overall).toBe(60);
    expect(sov.position).toBe(1);
    expect(sov.gapToLeader).toBe(0);
  });

  it("reports the gap to the leader when the brand trails", () => {
    const brands: VoiceInput[] = [
      { name: "Vous", isYou: true, scores: flat(20) },
      { name: "Leader", scores: flat(60) },
      { name: "B", scores: flat(20) },
    ];
    const sov = computeShareOfVoice(brands);
    expect(sov.position).toBe(2);
    expect(sov.overall).toBe(20);
    expect(sov.gapToLeader).toBe(40);
    expect(sov.ranking[0]?.name).toBe("Leader");
  });

  it("weights engines like the global score, so the two never contradict", () => {
    // Dominant on ChatGPT (weight 0.6), absent elsewhere: the weighted share
    // must stay well above the flat average of the four engines.
    const you: Record<LLMId, number> = { ...flat(0), chatgpt: 100 };
    const rival: Record<LLMId, number> = { ...flat(100), chatgpt: 0 };
    const sov = computeShareOfVoice([
      { name: "Vous", isYou: true, scores: you },
      { name: "Rival", scores: rival },
    ]);
    expect(sov.byEngine.chatgpt).toBe(100);
    expect(sov.byEngine.claude).toBe(0);
    expect(sov.overall).toBeGreaterThan(55);
  });

  it("ignores engines the project does not track", () => {
    const you: Record<LLMId, number> = { ...flat(0), chatgpt: 40 };
    const rival: Record<LLMId, number> = { ...flat(90), chatgpt: 40 };
    // Restricted to ChatGPT, the two are level despite the rival's other scores.
    const sov = computeShareOfVoice(
      [
        { name: "Vous", isYou: true, scores: you },
        { name: "Rival", scores: rival },
      ],
      ["chatgpt"],
    );
    expect(sov.overall).toBe(50);
  });

  it("returns zeroes rather than NaN when nobody is ever cited", () => {
    const sov = computeShareOfVoice([
      { name: "Vous", isYou: true, scores: flat(0) },
      { name: "A", scores: flat(0) },
    ]);
    expect(sov.overall).toBe(0);
    expect(Number.isNaN(sov.overall)).toBe(false);
    expect(sov.ranking).toHaveLength(2);
  });

  it("handles an empty set without throwing", () => {
    expect(computeShareOfVoice([]).overall).toBe(0);
  });
});
