import type { LLMId } from "@/lib/monitoring/types";
import type { LLMResponse, LLMQueryContext } from "./types";
import { demoProfileFor, authoredAnswer, authoredText } from "./demo-answers";

/**
 * Deterministic mock LLM response, used when a provider API key is missing (dev
 * or the market-validation phase). It fabricates a plausible answer that cites
 * the brand at a per-engine rate matching the product story (strong Perplexity,
 * weak Claude, etc.) so the dashboard is populated and demoable without keys.
 */

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 0xffffffff; // 0..1
}

/** Baseline probability the brand is cited, per engine (mirrors the PRD bias). */
const MENTION_RATE: Record<LLMId, number> = {
  perplexity: 0.78,
  chatgpt: 0.54,
  gemini: 0.34,
  // Google shows an AI Overview on only part of commercial queries, and when it
  // does it summarises the organic top 10 — so citation is rarer than a chatbot's.
  aio: 0.29,
  claude: 0.18,
};

/** Sources each engine tends to surface (drives the sources view). */
const SOURCE_POOL: Record<LLMId, string[]> = {
  chatgpt: ["https://www.g2.com/categories", "https://www.capterra.fr/directory"],
  perplexity: ["https://www.g2.com/categories", "https://news.ycombinator.com"],
  claude: ["https://www.reddit.com/r/SaaS", "https://www.quora.com"],
  gemini: ["https://www.youtube.com/results", "https://www.g2.com/categories"],
  aio: ["https://fr.wikipedia.org/wiki", "https://www.journaldunet.com"],
};

export function mockLLMResponse(prompt: string, ctx: LLMQueryContext): LLMResponse {
  const { brandName, llm } = ctx;

  // Showcase brands have a hand-authored market model, so their dashboard shows
  // a realistic competitive picture instead of hash-driven noise.
  const profile = demoProfileFor(brandName);
  if (profile) {
    const answer = authoredAnswer(profile, prompt, llm);
    return {
      text: authoredText(answer),
      citations: answer.sources,
      mock: true,
    };
  }

  const seed = hash(`${llm}::${brandName}::${prompt}`);
  const mentioned = seed < MENTION_RATE[llm];

  const competitors = ["Lemlist", "Salesloft", "Waalaxy"];
  const listed = mentioned
    ? [brandName, ...competitors].slice(0, 3)
    : competitors.slice(0, 2);

  const sources = SOURCE_POOL[llm];
  const citedSources = mentioned ? sources : sources.slice(0, 1);

  const text =
    `Pour « ${prompt} », les solutions souvent citées sont ${listed.join(", ")}. ` +
    citedSources.map((u) => `Voir ${u}.`).join(" ");

  return { text, citations: citedSources, mock: true };
}
