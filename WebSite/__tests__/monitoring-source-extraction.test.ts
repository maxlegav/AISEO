import { describe, it, expect } from "vitest";
import { extractSources, domainOf } from "@/lib/monitoring/source-extraction";

describe("domainOf", () => {
  it("extracts the registrable host and drops www", () => {
    expect(domainOf("https://www.g2.com/categories/crm")).toBe("g2.com");
    expect(domainOf("https://reddit.com/r/sales")).toBe("reddit.com");
  });
});

describe("extractSources", () => {
  it("extracts bare URLs", () => {
    const s = extractSources("Voir https://www.g2.com/x et https://reddit.com/r/sales.");
    expect(s.map((x) => x.domain).sort()).toEqual(["g2.com", "reddit.com"]);
  });

  it("extracts markdown links using the href, not the label", () => {
    const s = extractSources("Consultez [G2](https://www.g2.com/categories).");
    expect(s).toHaveLength(1);
    expect(s[0]!.url).toBe("https://www.g2.com/categories");
    expect(s[0]!.domain).toBe("g2.com");
  });

  it("merges provider citations and de-duplicates by URL", () => {
    const s = extractSources("Texte https://youtube.com/watch?v=1", [
      "https://youtube.com/watch?v=1",
      "https://capterra.fr/x",
    ]);
    expect(s.map((x) => x.domain).sort()).toEqual(["capterra.fr", "youtube.com"]);
  });

  it("strips trailing punctuation from URLs", () => {
    const s = extractSources("Source: https://g2.com/x.");
    expect(s[0]!.url).toBe("https://g2.com/x");
  });

  it("returns nothing when there are no URLs", () => {
    expect(extractSources("Aucune source ici.")).toEqual([]);
  });
});
