import { describe, expect, it } from "vitest";
import {
  suggestPrompts,
  groupByStyle,
  defaultSelection,
  normalizeCategory,
  pluralizeFr,
} from "@/lib/monitoring/prompt-suggestions";

const CLUB = {
  brandName: "Les Chandelles",
  category: "Club privé parisien, sélectif",
  city: "Paris",
  competitors: ["Le Set", "L'Orangerie"],
};

describe("normalizeCategory", () => {
  it("keeps the noun phrase people would actually type", () => {
    expect(normalizeCategory("Club privé parisien, sélectif")).toBe("club privé parisien");
    expect(normalizeCategory("CRM haut de gamme pour PME")).toBe("crm pour pme");
  });
});

describe("pluralizeFr", () => {
  it("agrees adjectives, not just the noun", () => {
    expect(pluralizeFr("club privé")).toBe("clubs privés");
    expect(pluralizeFr("logiciel de paie")).toBe("logiciels de paie");
  });

  it("handles the irregular endings that would otherwise read as broken French", () => {
    expect(pluralizeFr("journal local")).toBe("journaux locaux");
    expect(pluralizeFr("bureau")).toBe("bureaux");
    expect(pluralizeFr("prix")).toBe("prix");
  });
});

describe("suggestPrompts", () => {
  const suggestions = suggestPrompts(CLUB);

  it("produces the hundred-odd prompts the onboarding needs", () => {
    expect(suggestions.length).toBeGreaterThanOrEqual(100);
  });

  it("never repeats a prompt", () => {
    const seen = new Set(suggestions.map((s) => s.text.toLowerCase()));
    expect(seen.size).toBe(suggestions.length);
  });

  it("leans on short raw queries, because that is how people search", () => {
    const brute = suggestions.filter((s) => s.style === "brute");
    expect(brute.length / suggestions.length).toBeGreaterThan(0.4);

    // A raw query is a handful of words with no question mark.
    for (const s of brute) {
      expect(s.text).not.toContain("?");
      expect(s.text.split(" ").length).toBeLessThanOrEqual(6);
    }
  });

  it("covers every family so no blind spot is left", () => {
    expect(groupByStyle(suggestions).map((g) => g.style)).toEqual([
      "brute",
      "question",
      "comparaison",
      "longue",
    ]);
  });

  it("drops the city from the category instead of repeating it", () => {
    // "club privé parisien" + Paris must not yield "club privé parisien Paris".
    expect(suggestions.some((s) => /parisien\s+Paris/i.test(s.text))).toBe(false);
    expect(suggestions.some((s) => s.text === "club privé Paris")).toBe(true);
  });

  it("names each competitor and confronts it with the brand", () => {
    for (const c of CLUB.competitors) {
      expect(suggestions.some((s) => s.text === `alternative à ${c}`)).toBe(true);
      expect(
        suggestions.some((s) => s.text.includes(c) && s.text.includes(CLUB.brandName)),
      ).toBe(true);
    }
  });

  it("tests the brand name itself, to see if engines know it at all", () => {
    expect(suggestions.some((s) => s.intent === "marque")).toBe(true);
    expect(suggestions.some((s) => s.text === CLUB.brandName)).toBe(true);
  });

  it("skips the local family for a business with no city", () => {
    const online = suggestPrompts({ brandName: "Qonto", category: "banque pro en ligne" });
    expect(online.some((s) => s.intent === "local")).toBe(false);
    expect(online.length).toBeGreaterThan(40);
  });

  it("returns nothing without a category rather than emitting junk", () => {
    expect(suggestPrompts({ brandName: "X", category: "" })).toEqual([]);
  });
});

describe("defaultSelection", () => {
  it("pre-selects a realistic starter set across every family", () => {
    const picked = defaultSelection(suggestPrompts(CLUB), 40);
    expect(picked).toHaveLength(40);

    const styles = new Set(picked.map((s) => s.style));
    expect(styles.size).toBeGreaterThanOrEqual(3);

    const brute = picked.filter((s) => s.style === "brute").length;
    expect(brute).toBeGreaterThan(picked.length * 0.3);
  });
});
