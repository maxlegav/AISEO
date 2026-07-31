import { describe, expect, it } from "vitest";
import { LLMS, LLM_ORDER, ENGINE_WEIGHTS, isLLMId } from "@/lib/monitoring/types";
import { LLMS as UI_LLMS, LLM_ORDER as UI_ORDER } from "@/lib/mock/monitoring";

/**
 * The engine roster is duplicated in two places by necessity: the pipeline
 * constants (`lib/monitoring/types`) and the UI metadata that adds a logo
 * (`lib/mock/monitoring`). These assertions keep the two from drifting — the
 * failure mode being an engine that scores but never renders, or vice versa.
 */
describe("monitored engines", () => {
  it("covers the five surfaces, Google AI Overview included", () => {
    expect(LLM_ORDER).toHaveLength(5);
    expect(LLM_ORDER).toContain("aio");
    expect(isLLMId("aio")).toBe(true);
    expect(LLMS.aio.name).toBe("Google AI Overview");
  });

  it("declares a weight for every engine", () => {
    for (const id of LLM_ORDER) {
      expect(ENGINE_WEIGHTS[id], `missing weight for ${id}`).toBeGreaterThan(0);
    }
    const total = LLM_ORDER.reduce((acc, id) => acc + ENGINE_WEIGHTS[id], 0);
    expect(total).toBeCloseTo(1, 5);
  });

  it("weights ChatGPT first and AI Overview second", () => {
    const ranked = [...LLM_ORDER].sort((a, b) => ENGINE_WEIGHTS[b] - ENGINE_WEIGHTS[a]);
    expect(ranked[0]).toBe("chatgpt");
    expect(ranked[1]).toBe("aio");
  });

  it("keeps the UI metadata in sync with the pipeline roster", () => {
    expect([...UI_ORDER].sort()).toEqual([...LLM_ORDER].sort());
    for (const id of LLM_ORDER) {
      expect(UI_LLMS[id], `no UI metadata for ${id}`).toBeDefined();
      expect(UI_LLMS[id].logo, `no logo for ${id}`).toMatch(/^\/logos\/.+\.svg$/);
      expect(UI_LLMS[id].name).toBe(LLMS[id].name);
    }
  });
});
