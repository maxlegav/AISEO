import { describe, it, expect } from "vitest";
import {
  detectBrand,
  brandPosition,
  brandProminence,
  levenshtein,
  normalize,
} from "@/lib/monitoring/brand-detection";

describe("normalize", () => {
  it("lowercases and strips accents", () => {
    expect(normalize("Café Crème")).toBe("cafe creme");
  });
});

describe("levenshtein", () => {
  it("computes edit distance", () => {
    expect(levenshtein("linkflow", "linkflow")).toBe(0);
    expect(levenshtein("linkflow", "linkflows")).toBe(1);
    expect(levenshtein("linkflow", "linkflw")).toBe(1);
  });
});

describe("detectBrand", () => {
  it("finds an exact, accent-insensitive mention", () => {
    const m = detectBrand("Nous recommandons Atelier Moreau pour ce besoin.", "Atelier Moreau");
    expect(m.found).toBe(true);
    expect(m.exact).toBe(true);
  });

  it("matches a single-word brand case-insensitively", () => {
    expect(detectBrand("LINKFLOW est une bonne option", "Linkflow").found).toBe(true);
  });

  it("fuzzy-matches a minor typo", () => {
    const m = detectBrand("essayez Linkflw, c'est top", "Linkflow");
    expect(m.found).toBe(true);
    expect(m.exact).toBe(false);
  });

  it("does not match an unrelated word", () => {
    expect(detectBrand("Salesloft et Lemlist sont cités", "Linkflow").found).toBe(false);
  });

  it("does not fuzzy-match very short words loosely", () => {
    // "cat" vs "car" (both len 3) should not match under the short-word guard.
    expect(detectBrand("the car is red", "cat", { maxDistance: 1 }).found).toBe(false);
  });

  it("respects fuzzy=false for exact-only matching", () => {
    expect(detectBrand("Linkflw here", "Linkflow", { fuzzy: false }).found).toBe(false);
  });
});

describe("brandProminence", () => {
  it("returns not-found with score 0 when the brand is absent", () => {
    const p = brandProminence("Lemlist et Waalaxy dominent", "Linkflow");
    expect(p.found).toBe(false);
    expect(p.score).toBe(0);
    expect(p.mentions).toBe(0);
  });

  it("scores an early, repeated brand higher than a late, single one", () => {
    const early = brandProminence(
      "Linkflow est excellent. Linkflow se distingue vraiment des autres solutions.",
      "Linkflow",
    );
    const late = brandProminence(
      "Beaucoup de solutions existent sur ce marché très concurrentiel, et enfin Linkflow.",
      "Linkflow",
    );
    expect(early.found).toBe(true);
    expect(late.found).toBe(true);
    expect(early.score).toBeGreaterThan(late.score);
    expect(early.mentions).toBe(2);
  });

  it("counts non-overlapping mentions", () => {
    const p = brandProminence("Linkflow, Linkflow et encore Linkflow", "Linkflow");
    expect(p.mentions).toBe(3);
  });
});

describe("brandPosition", () => {
  const text = "Les meilleurs sont Lemlist, puis Linkflow, et enfin Waalaxy.";

  it("ranks the brand by semantic prominence vs competitors", () => {
    expect(brandPosition(text, "Linkflow", ["Lemlist", "Waalaxy"])).toBe(2);
  });

  it("returns 1 when the brand is the most prominent", () => {
    expect(brandPosition("Linkflow devance Lemlist", "Linkflow", ["Lemlist"])).toBe(1);
  });

  it("ranks a repeated early brand ahead of one merely named first once", () => {
    // Lemlist appears first but only once and late-ish; Linkflow leads and repeats.
    const t =
      "Parmi les outils, Linkflow revient souvent. Linkflow est cité avant Lemlist ici.";
    expect(brandPosition(t, "Linkflow", ["Lemlist"])).toBe(1);
  });

  it("returns null when the brand is absent", () => {
    expect(brandPosition("Lemlist et Waalaxy", "Linkflow", ["Lemlist", "Waalaxy"])).toBeNull();
  });
});
