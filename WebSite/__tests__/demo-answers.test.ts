import { describe, expect, it } from "vitest";
import { demoProfileFor, authoredAnswer, authoredText } from "@/lib/llm/demo-answers";
import { detectBrand } from "@/lib/monitoring/brand-detection";
import { LLM_ORDER } from "@/lib/monitoring/types";

/**
 * These guard three mistakes that each silently inflated the demo scores while
 * looking perfectly fine on screen. They share one root cause: brand detection
 * scans the answer text, so anything echoed into that text counts as a citation.
 */
describe("authored demo answers", () => {
  const bioburger = demoProfileFor("Bioburger");
  const chandelles = demoProfileFor("Les Chandelles");

  it("only covers the showcase brands", () => {
    expect(bioburger).not.toBeNull();
    expect(chandelles).not.toBeNull();
    expect(demoProfileFor("Une marque quelconque")).toBeNull();
  });

  it("never echoes the query back into the answer", () => {
    // Otherwise every brand-name search scores as a citation, including the ones
    // where the engine answered nothing at all.
    const answer = authoredAnswer(bioburger!, "bioburger avis", "claude");
    expect(authoredText(answer)).not.toContain("bioburger avis");
  });

  it("keeps source URLs out of the answer text", () => {
    // "bioburger.fr" contains the brand: rendering it would mark the brand as
    // cited on every answer that merely links to its own site.
    const answer = authoredAnswer(bioburger!, "burger bio paris", "perplexity");
    const text = authoredText(answer);
    expect(text).not.toMatch(/https?:\/\//);
    expect(answer.sources.some((s) => s.includes("bioburger.fr"))).toBe(true);
  });

  it("marks the brand absent when the engine names someone else", () => {
    const answer = authoredAnswer(bioburger!, "meilleur burger paris", "claude");
    const text = authoredText(answer);
    if (!answer.named.includes("Bioburger")) {
      expect(detectBrand(text, "Bioburger").found).toBe(false);
    }
  });

  it("matches query families on whole words", () => {
    // "bio" must not capture "bioburger", or brand queries land in the wrong
    // family and get scored against the wrong competitive set.
    const brandQuery = authoredAnswer(bioburger!, "bioburger horaires", "chatgpt");
    expect(brandQuery.sources.some((s) => s.includes("wikipedia"))).toBe(true);

    const bioQuery = authoredAnswer(bioburger!, "burger bio paris", "chatgpt");
    expect(bioQuery.sources.some((s) => s.includes("happycow"))).toBe(true);
  });

  it("answers brand-name lookups even in a category an engine avoids", () => {
    // Claude hedges on this category, but a direct lookup on the name is still
    // answered — reticence must not swallow a brand search.
    const answer = authoredAnswer(chandelles!, "les chandelles horaires", "claude");
    expect(answer.named).toContain("Les Chandelles");
  });

  it("is deterministic, so week-to-week scores stay comparable", () => {
    for (const llm of LLM_ORDER) {
      const a = authoredAnswer(chandelles!, "club libertin paris", llm);
      const b = authoredAnswer(chandelles!, "club libertin paris", llm);
      expect(a.named).toEqual(b.named);
    }
  });

  it("lets the niche brand win its family and lose the generic query", () => {
    const rate = (prompts: string[]) => {
      let hits = 0;
      let total = 0;
      for (const p of prompts) {
        for (const llm of LLM_ORDER) {
          total++;
          if (authoredAnswer(bioburger!, p, llm).named.includes("Bioburger")) hits++;
        }
      }
      return hits / total;
    };

    const organic = rate(["burger bio paris", "fast food bio paris", "burger vegan paris"]);
    const generic = rate(["meilleur burger paris", "bon burger paris", "burger paris"]);

    expect(organic).toBeGreaterThan(0.6);
    expect(generic).toBeLessThan(0.4);
  });
});
