import { describe, it, expect } from "vitest";
import {
  detectBrand,
  brandPosition,
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

describe("brandPosition", () => {
  const text = "Les meilleurs sont Lemlist, puis Linkflow, et enfin Waalaxy.";

  it("ranks the brand by order of appearance vs competitors", () => {
    expect(brandPosition(text, "Linkflow", ["Lemlist", "Waalaxy"])).toBe(2);
  });

  it("returns 1 when the brand is cited first", () => {
    expect(brandPosition("Linkflow devance Lemlist", "Linkflow", ["Lemlist"])).toBe(1);
  });

  it("returns null when the brand is absent", () => {
    expect(brandPosition("Lemlist et Waalaxy", "Linkflow", ["Lemlist", "Waalaxy"])).toBeNull();
  });
});
