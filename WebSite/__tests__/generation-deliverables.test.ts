import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  generateDeliverable,
  externalSourceDomains,
  deliverableNeedsPrompt,
  DELIVERABLE_KINDS,
  type DeliverableContext,
} from "@/lib/generation/deliverables";

const LLM_KEYS = [
  "OPENAI_API_KEY",
  "ANTHROPIC_API_KEY",
  "GEMINI_API_KEY",
  "PERPLEXITY_API_KEY",
];

const ctx: DeliverableContext = {
  brandName: "Bioburger",
  websiteUrl: "https://www.bioburger.fr",
  category: "chaîne de burgers bio à Paris",
  competitors: ["Big Fernand", "Blend", "PNY"],
  prompt: "meilleurs burgers bio à Paris",
  sourceDomains: ["reddit.com", "www.bioburger.fr", "sortiraparis.com"],
};

describe("generateDeliverable (mock fallback, key-free)", () => {
  const saved: Record<string, string | undefined> = {};

  beforeEach(() => {
    // Force the key-free path so tests are deterministic and offline.
    for (const k of LLM_KEYS) {
      saved[k] = process.env[k];
      delete process.env[k];
    }
  });

  afterEach(() => {
    for (const k of LLM_KEYS) {
      if (saved[k] === undefined) delete process.env[k];
      else process.env[k] = saved[k];
    }
  });

  it("returns an explicit mock for every kind, tagged mock:true", async () => {
    for (const kind of DELIVERABLE_KINDS) {
      const r = await generateDeliverable(kind, ctx);
      expect(r.mock, `${kind} should be mock`).toBe(true);
      expect(r.content.length, `${kind} content`).toBeGreaterThan(20);
      expect(r.note.toLowerCase()).toContain("mode local");
    }
  });

  it("bakes the brand name into the content (not a generic template)", async () => {
    const llms = await generateDeliverable("llms_txt", ctx);
    expect(llms.content).toContain("Bioburger");
    expect(llms.content).not.toMatch(/décrivez ici/i);

    const answer = await generateDeliverable("answer_page", ctx);
    expect(answer.content).toContain("meilleurs burgers bio à Paris");
    expect(answer.content).toContain("Bioburger");
  });

  it("produces valid JSON for the JSON-LD deliverables", async () => {
    const faq = await generateDeliverable("faq_jsonld", ctx);
    const faqDoc = JSON.parse(faq.content);
    expect(faqDoc["@type"]).toBe("FAQPage");
    expect(Array.isArray(faqDoc.mainEntity)).toBe(true);
    expect(faqDoc.mainEntity.length).toBeGreaterThan(0);

    const org = await generateDeliverable("org_jsonld", ctx);
    const orgDoc = JSON.parse(org.content);
    expect(orgDoc["@type"]).toBe("Organization");
    expect(orgDoc.name).toBe("Bioburger");
    expect(orgDoc.url).toBe("https://www.bioburger.fr");
  });

  it("throws when a query-specific deliverable has no prompt", async () => {
    await expect(
      generateDeliverable("answer_page", { ...ctx, prompt: undefined }),
    ).rejects.toThrow();
    expect(deliverableNeedsPrompt("answer_page")).toBe(true);
    expect(deliverableNeedsPrompt("llms_txt")).toBe(false);
  });
});

describe("externalSourceDomains", () => {
  it("drops the brand's own domain and deduplicates", () => {
    const out = externalSourceDomains("https://www.bioburger.fr", [
      "reddit.com",
      "www.bioburger.fr",
      "bioburger.fr",
      "reddit.com",
      "sortiraparis.com",
    ]);
    expect(out).toEqual(["reddit.com", "sortiraparis.com"]);
  });
});
