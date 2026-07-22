import { describe, it, expect } from "vitest";
import {
  analyzePrompts,
  buildSourceTargets,
  buildActionPlan,
  analyzeRobots,
  buildLlmsTxt,
  buildFaq,
  buildFaqJsonLd,
  buildTechnicalGeo,
  type ResultRow,
} from "@/lib/monitoring/recommendations";
import type { SourceRow } from "@/lib/mock/monitoring";

const brand = "Les Chandelles";
const competitors = ["Le 41", "L'Overside"];

const results: ResultRow[] = [
  // prompt A: cited by chatgpt+perplexity, absent on claude (competitor cited) & gemini
  { prompt: "meilleur club libertin paris", llm: "chatgpt", brandMentioned: true, responseText: "Les Chandelles est top", sourcesCited: [] },
  { prompt: "meilleur club libertin paris", llm: "perplexity", brandMentioned: true, responseText: "Les Chandelles", sourcesCited: [] },
  { prompt: "meilleur club libertin paris", llm: "claude", brandMentioned: false, responseText: "Le 41 est recommandé sur reddit", sourcesCited: ["https://reddit.com/r/paris/x"] },
  { prompt: "meilleur club libertin paris", llm: "gemini", brandMentioned: false, responseText: "voir la vidéo", sourcesCited: ["https://youtube.com/watch?v=1"] },
  // prompt B: nobody cites the brand (lost)
  { prompt: "restaurant coquin paris", llm: "chatgpt", brandMentioned: false, responseText: "aucune idée", sourcesCited: ["https://tripadvisor.fr/g"] },
  { prompt: "restaurant coquin paris", llm: "perplexity", brandMentioned: false, responseText: "L'Overside peut-être", sourcesCited: [] },
  { prompt: "restaurant coquin paris", llm: "claude", brandMentioned: false, responseText: "rien", sourcesCited: [] },
  { prompt: "restaurant coquin paris", llm: "gemini", brandMentioned: false, responseText: "rien", sourcesCited: [] },
  // prompt C: won everywhere
  { prompt: "les chandelles avis", llm: "chatgpt", brandMentioned: true, responseText: "Les Chandelles", sourcesCited: [] },
  { prompt: "les chandelles avis", llm: "perplexity", brandMentioned: true, responseText: "Les Chandelles", sourcesCited: [] },
  { prompt: "les chandelles avis", llm: "claude", brandMentioned: true, responseText: "Les Chandelles", sourcesCited: [] },
  { prompt: "les chandelles avis", llm: "gemini", brandMentioned: true, responseText: "Les Chandelles", sourcesCited: [] },
];

describe("analyzePrompts", () => {
  const insights = analyzePrompts(results, competitors);

  it("classifies won / partial / lost correctly", () => {
    const byPrompt = Object.fromEntries(insights.map((i) => [i.prompt, i]));
    expect(byPrompt["meilleur club libertin paris"]!.status).toBe("partial");
    expect(byPrompt["restaurant coquin paris"]!.status).toBe("lost");
    expect(byPrompt["les chandelles avis"]!.status).toBe("won");
  });

  it("detects engines citing vs missing", () => {
    const a = insights.find((i) => i.prompt === "meilleur club libertin paris")!;
    expect(a.enginesCiting.sort()).toEqual(["chatgpt", "perplexity"]);
    expect(a.enginesMissing.sort()).toEqual(["claude", "gemini"]);
  });

  it("surfaces competitors cited where brand is absent", () => {
    const a = insights.find((i) => i.prompt === "meilleur club libertin paris")!;
    expect(a.competitorsAhead).toContain("Le 41");
  });

  it("extracts the winning sources on lost/partial prompts", () => {
    const a = insights.find((i) => i.prompt === "meilleur club libertin paris")!;
    const domains = a.winningSources.map((s) => s.domain);
    expect(domains).toContain("reddit.com");
    expect(domains).toContain("youtube.com");
  });

  it("ranks partial (closest to win) before lost, then won last", () => {
    expect(insights[0]!.status).toBe("partial");
    expect(insights[insights.length - 1]!.status).toBe("won");
  });

  it("produces a non-empty, prompt-specific action for every insight", () => {
    for (const i of insights) expect(i.action.length).toBeGreaterThan(10);
  });

  it("dedupes engines when a prompt has several rows per engine (multiple runs)", () => {
    const dup: ResultRow[] = [
      { prompt: "p", llm: "chatgpt", brandMentioned: false, responseText: "x", sourcesCited: [] },
      { prompt: "p", llm: "chatgpt", brandMentioned: false, responseText: "x", sourcesCited: [] },
      { prompt: "p", llm: "claude", brandMentioned: true, responseText: "Les Chandelles", sourcesCited: [] },
      { prompt: "p", llm: "claude", brandMentioned: true, responseText: "Les Chandelles", sourcesCited: [] },
    ];
    const [insight] = analyzePrompts(dup, competitors);
    expect(insight!.enginesMissing).toEqual(["chatgpt"]);
    expect(insight!.enginesCiting).toEqual(["claude"]);
  });
});

describe("buildSourceTargets", () => {
  const sources: SourceRow[] = [
    { domain: "sortiraparis.com", url: "https://sortiraparis.com/g", llms: ["perplexity"], citesBrand: false, citations: 5 },
    { domain: "leschandelles.com", url: "https://leschandelles.com", llms: ["perplexity"], citesBrand: true, citations: 9 },
    { domain: "reddit.com", url: "https://reddit.com/r", llms: ["claude"], citesBrand: false, citations: 2 },
  ];

  it("keeps only sources that do NOT cite the brand, sorted by citations", () => {
    const targets = buildSourceTargets(sources);
    expect(targets.map((t) => t.domain)).toEqual(["sortiraparis.com", "reddit.com"]);
    expect(targets.every((t) => t.domain !== "leschandelles.com")).toBe(true);
  });
});

describe("buildActionPlan", () => {
  it("returns prioritized items with impact and never empty", () => {
    const insights = analyzePrompts(results, competitors);
    const targets = buildSourceTargets([
      { domain: "sortiraparis.com", url: "https://sortiraparis.com/g", llms: ["perplexity"], citesBrand: false, citations: 5 },
    ]);
    const plan = buildActionPlan(insights, targets, [
      { llm: "claude", presenceRate: 13 },
      { llm: "perplexity", presenceRate: 88 },
    ]);
    expect(plan.length).toBeGreaterThan(0);
    // high priority first
    expect(plan[0]!.priority).toBe("high");
    for (const item of plan) expect(item.impact).toBeGreaterThanOrEqual(0);
  });
});

describe("analyzeRobots", () => {
  it("flags AI bots blocked by a wildcard disallow", () => {
    const r = analyzeRobots("User-agent: *\nDisallow: /", true);
    expect(r.checked).toBe(true);
    expect(r.bots.every((b) => !b.allowed)).toBe(true);
  });

  it("allows bots when robots.txt is open", () => {
    const r = analyzeRobots("User-agent: *\nAllow: /", true);
    expect(r.bots.every((b) => b.allowed)).toBe(true);
  });

  it("flags a specifically disallowed bot", () => {
    const r = analyzeRobots("User-agent: GPTBot\nDisallow: /", true);
    expect(r.bots.find((b) => b.bot === "GPTBot")!.allowed).toBe(false);
  });

  it("degrades gracefully when unreachable", () => {
    const r = analyzeRobots(null, false);
    expect(r.reachable).toBe(false);
    expect(r.patch).toContain("GPTBot");
  });

  it("treats consecutive user-agent lines as one shared group (root allowed)", () => {
    // Squarespace-style: many bots listed together, then `*`, then only
    // path-specific disallows: root is NOT blocked, so every bot is allowed.
    const robots = [
      "User-agent: ClaudeBot",
      "User-agent: Google-Extended",
      "User-agent: GPTBot",
      "User-agent: *",
      "Disallow: /config",
      "Disallow: /search",
      "Disallow: /*?author=*",
    ].join("\n");
    const r = analyzeRobots(robots, true);
    expect(r.bots.every((b) => b.allowed)).toBe(true);
  });

  it("does not false-positive on long disallow paths starting with /", () => {
    // `Disallow: /static/` must NOT be read as a root block.
    const r = analyzeRobots("User-agent: *\nDisallow: /static/\nDisallow: /api/", true);
    expect(r.bots.every((b) => b.allowed)).toBe(true);
  });
});

describe("technical deliverables", () => {
  it("builds a llms.txt containing the brand and site origin", () => {
    const txt = buildLlmsTxt(brand, "https://www.leschandelles.com/", "club libertin", []);
    expect(txt).toContain("# Les Chandelles");
    expect(txt).toContain("https://www.leschandelles.com");
  });

  it("builds a FAQ with well-formed questions and valid JSON-LD", () => {
    const faq = buildFaq(brand, "club libertin", ["meilleur club paris", "avis"]);
    expect(faq.length).toBe(2);
    expect(faq[0]!.question.endsWith("?")).toBe(true);
    const jsonLd = JSON.parse(buildFaqJsonLd(faq));
    expect(jsonLd["@type"]).toBe("FAQPage");
    expect(jsonLd.mainEntity.length).toBe(2);
  });

  it("buildTechnicalGeo wires everything together", () => {
    const tech = buildTechnicalGeo({
      brandName: brand,
      websiteUrl: "https://www.leschandelles.com",
      category: "club libertin",
      competitors,
      prompts: ["meilleur club paris"],
      topSourceUrls: [],
      robotsText: "User-agent: *\nDisallow: /",
      robotsReachable: true,
      sitemapFound: false,
    });
    expect(tech.robots.bots.every((b) => !b.allowed)).toBe(true);
    expect(tech.sitemap.found).toBe(false);
    expect(tech.faq.length).toBe(1);
    expect(tech.descriptions.sentenceDescriptors.length).toBeGreaterThan(0);
  });
});
