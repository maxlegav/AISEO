import { describe, it, expect } from "vitest";
import { scanOnPage, analyzeLlmsTxt } from "@/lib/monitoring/onpage";

describe("scanOnPage", () => {
  it("returns scanned:false when there is no HTML", () => {
    const scan = scanOnPage(null, "Acme");
    expect(scan.scanned).toBe(false);
    expect(scan.items).toHaveLength(0);
  });

  it("extracts title, meta description, h1, OpenGraph and JSON-LD types", () => {
    const html = `
      <html><head>
        <title>Acme, la meilleure plateforme de cold email</title>
        <meta name="description" content="Acme aide les équipes commerciales à automatiser leur prospection multicanale efficacement." />
        <meta property="og:title" content="Acme" />
        <script type="application/ld+json">
          {"@context":"https://schema.org","@type":"Organization","name":"Acme"}
        </script>
        <script type="application/ld+json">
          {"@type":"FAQPage","mainEntity":[]}
        </script>
      </head><body><h1>Acme, prospection multicanale</h1></body></html>`;
    const scan = scanOnPage(html, "Acme");
    expect(scan.scanned).toBe(true);
    expect(scan.title).toContain("Acme");
    expect(scan.metaDescription).toContain("prospection");
    expect(scan.h1).toContain("Acme");
    expect(scan.openGraph).toBe(true);
    expect(scan.hasOrganizationSchema).toBe(true);
    expect(scan.hasFaqSchema).toBe(true);
    expect(scan.jsonLdTypes).toEqual(
      expect.arrayContaining(["Organization", "FAQPage"]),
    );
    // Everything present => all items OK.
    expect(scan.items.every((i) => i.status === "ok")).toBe(true);
  });

  it("flags missing title, meta description, h1 and structured data", () => {
    const scan = scanOnPage("<html><head></head><body><p>hi</p></body></html>", "Acme");
    const byLabel = Object.fromEntries(scan.items.map((i) => [i.label, i.status]));
    expect(byLabel["Balise <title>"]).toBe("missing");
    expect(byLabel["Meta description"]).toBe("missing");
    expect(byLabel["Titre H1"]).toBe("missing");
    expect(byLabel["Données structurées Organization"]).toBe("missing");
    expect(byLabel["Données structurées FAQPage"]).toBe("warn");
    expect(byLabel["Balises OpenGraph"]).toBe("warn");
  });

  it("warns on a too-short title and too-long meta description", () => {
    const longDesc = "x".repeat(200);
    const html = `<title>Acme</title><meta name="description" content="${longDesc}"><h1>Acme</h1>`;
    const scan = scanOnPage(html, "Acme");
    const byLabel = Object.fromEntries(scan.items.map((i) => [i.label, i.status]));
    expect(byLabel["Balise <title>"]).toBe("warn");
    expect(byLabel["Meta description"]).toBe("warn");
  });

  it("handles @type arrays in JSON-LD", () => {
    const html = `<script type="application/ld+json">{"@type":["WebSite","Organization"]}</script><title>Brand accueil site</title><h1>Brand</h1>`;
    const scan = scanOnPage(html, "Brand");
    expect(scan.hasOrganizationSchema).toBe(true);
  });
});

describe("analyzeLlmsTxt", () => {
  it("reports absent when null or empty", () => {
    expect(analyzeLlmsTxt(null).found).toBe(false);
    expect(analyzeLlmsTxt("   ").found).toBe(false);
  });

  it("treats an HTML soft-404 as absent", () => {
    const res = analyzeLlmsTxt("<!doctype html><html><body>Not found</body></html>");
    expect(res.found).toBe(false);
  });

  it("marks a complete llms.txt as found + complete", () => {
    const txt = ["# Acme", "", "> Acme, plateforme de cold email.", "", "## Pages", "- https://acme.com/features"].join("\n");
    const res = analyzeLlmsTxt(txt);
    expect(res.found).toBe(true);
    expect(res.complete).toBe(true);
    expect(res.missing).toHaveLength(0);
  });

  it("lists what an incomplete llms.txt is missing", () => {
    const res = analyzeLlmsTxt("# Acme\n\nSome free text without a description or pages.");
    expect(res.found).toBe(true);
    expect(res.complete).toBe(false);
    expect(res.missing.length).toBeGreaterThan(0);
  });
});
