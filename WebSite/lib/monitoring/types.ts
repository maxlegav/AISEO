/**
 * Canonical types & constants for the SYB v2 GEO-monitoring engine.
 *
 * These are shared by the Mongoose models, the pipeline, the API layer and the
 * dashboard. Keep this file free of Node/Mongo/React imports so it can be used
 * from both server and client code.
 */

export type LLMId = "chatgpt" | "claude" | "perplexity" | "gemini";

/** The four engines we monitor, in the order they should be displayed. */
export const LLM_ORDER: LLMId[] = ["chatgpt", "perplexity", "claude", "gemini"];

export interface LLMMeta {
  id: LLMId;
  name: string;
  color: string;
  /** How this engine sources its answers, drives per-LLM explanations. */
  bias: string;
}

export const LLMS: Record<LLMId, LLMMeta> = {
  chatgpt: {
    id: "chatgpt",
    name: "ChatGPT",
    color: "#10a37f",
    bias: "S'appuie sur Bing. Hors du top Bing sur une requête = non cité.",
  },
  claude: {
    id: "claude",
    name: "Claude",
    color: "#d97757",
    bias: "Cite Reddit, Quora et les forums 2 à 4× plus que les autres.",
  },
  perplexity: {
    id: "perplexity",
    name: "Perplexity",
    color: "#20808d",
    bias: "Favorise les sources récentes à fort trafic. Contenu daté = invisible.",
  },
  gemini: {
    id: "gemini",
    name: "Gemini",
    color: "#4285f4",
    bias: "Favorise les propriétés Google (YouTube, SGE). Une vidéo YouTube aide.",
  },
};

export function isLLMId(value: string): value is LLMId {
  return value === "chatgpt" || value === "claude" || value === "perplexity" || value === "gemini";
}

/**
 * Approximate share of AI-assistant usage per engine, used to weight the global
 * visibility score so that being cited on a widely-used engine counts more than
 * on a niche one. Heuristic figures (order of magnitude, not a precise market
 * study); tune here as usage data evolves. Values are re-normalised over the
 * engines actually evaluated for a project, so they need not sum to exactly 1.
 */
export const ENGINE_WEIGHTS: Record<LLMId, number> = {
  chatgpt: 0.6,
  gemini: 0.16,
  perplexity: 0.14,
  claude: 0.1,
};

export type MonitoringFrequency = "weekly" | "daily";

/** Result of scanning a single LLM response for a brand + its cited sources. */
export interface ParsedResponse {
  brandMentioned: boolean;
  /** 1-based rank of the first brand mention among all detected brands; null if absent. */
  brandPosition: number | null;
  sourcesCited: string[];
}
