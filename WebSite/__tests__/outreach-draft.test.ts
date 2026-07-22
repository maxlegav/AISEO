import { describe, it, expect } from "vitest";
import {
  relevanceScore,
  buildMockDraft,
  generateOutreachDraft,
  type OutreachContext,
} from "@/lib/outreach/draft";

const ctx: OutreachContext = {
  brandName: "lemlist",
  websiteUrl: "https://www.lemlist.com",
  category: "cold email B2B",
  domain: "g2.com",
  sampleUrl: "https://www.g2.com/categories/sales-engagement",
  engines: ["chatgpt", "perplexity"],
  citations: 4,
};

describe("relevanceScore", () => {
  it("grows with citations and engine coverage, capped at 100", () => {
    expect(relevanceScore(0, [])).toBe(1);
    expect(relevanceScore(4, ["chatgpt", "perplexity"])).toBe(72);
    expect(relevanceScore(20, ["chatgpt", "claude", "perplexity", "gemini"])).toBe(100);
  });

  it("deduplicates engines when scoring coverage", () => {
    expect(relevanceScore(1, ["chatgpt", "chatgpt"])).toBe(relevanceScore(1, ["chatgpt"]));
  });
});

describe("buildMockDraft", () => {
  it("is specific to the brand and target, and includes an opt-out", () => {
    const draft = buildMockDraft(ctx);
    expect(draft.subject).toContain("lemlist");
    expect(draft.body).toContain("lemlist");
    expect(draft.body).toContain("g2.com");
    expect(draft.body).toContain("ChatGPT");
    expect(draft.body).toContain("Perplexity");
    expect(draft.body.toUpperCase()).toContain("STOP");
    expect(draft.body).not.toContain("—");
    expect(draft.body).not.toMatch(/décrivez ici/i);
  });
});

describe("generateOutreachDraft", () => {
  it("falls back to the deterministic template when no LLM key is set", async () => {
    const before = {
      OPENAI_API_KEY: process.env.OPENAI_API_KEY,
      ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
      GEMINI_API_KEY: process.env.GEMINI_API_KEY,
      PERPLEXITY_API_KEY: process.env.PERPLEXITY_API_KEY,
    };
    delete process.env.OPENAI_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.GEMINI_API_KEY;
    delete process.env.PERPLEXITY_API_KEY;
    try {
      const draft = await generateOutreachDraft(ctx);
      expect(draft.mock).toBe(true);
      expect(draft.provider).toBeUndefined();
      expect(draft.subject).toContain("lemlist");
      expect(draft.body).toContain("g2.com");
    } finally {
      for (const [k, v] of Object.entries(before)) {
        if (v !== undefined) process.env[k] = v;
      }
    }
  });
});
