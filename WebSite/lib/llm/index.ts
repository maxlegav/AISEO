import type { LLMId } from "@/lib/monitoring/types";
import type { LLMResponse, LLMQueryContext, LLMProvider } from "./types";
import { mockLLMResponse } from "./mock";
import {
  queryOpenAI,
  queryAnthropic,
  queryPerplexity,
  queryGemini,
  queryGoogleAIOverview,
} from "./providers";

export type { LLMResponse, LLMQueryContext } from "./types";

const PROVIDERS: Record<LLMId, LLMProvider> = {
  chatgpt: queryOpenAI,
  claude: queryAnthropic,
  perplexity: queryPerplexity,
  gemini: queryGemini,
  aio: queryGoogleAIOverview,
};

const API_KEY_ENV: Record<LLMId, string> = {
  chatgpt: "OPENAI_API_KEY",
  claude: "ANTHROPIC_API_KEY",
  perplexity: "PERPLEXITY_API_KEY",
  gemini: "GEMINI_API_KEY",
  // Placeholder: AI Overviews are read through a SERP provider, whose
  // credentials depend on which one is selected — see `hasRealKey`.
  aio: "SERPAPI_KEY",
};

/**
 * True when the credentials needed to really query `llm` are configured.
 * AI Overviews are special: the credential depends on the chosen SERP provider.
 */
export function hasRealKey(llm: LLMId): boolean {
  if (llm === "aio") {
    const provider = (process.env.AIO_PROVIDER || "serpapi").toLowerCase();
    return provider === "dataforseo"
      ? Boolean(process.env.DATAFORSEO_LOGIN && process.env.DATAFORSEO_PASSWORD)
      : Boolean(process.env.SERPAPI_KEY);
  }
  return Boolean(process.env[API_KEY_ENV[llm]]);
}

/**
 * Query one LLM. Uses the real provider when its key is set; otherwise returns
 * the deterministic mock so the pipeline works end-to-end without any key.
 * Never throws: provider/network errors become an `error` field on the result.
 */
export async function queryLLM(prompt: string, ctx: LLMQueryContext): Promise<LLMResponse> {
  if (!hasRealKey(ctx.llm)) {
    return mockLLMResponse(prompt, ctx);
  }
  try {
    return await PROVIDERS[ctx.llm](prompt, ctx);
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    return { text: "", citations: [], mock: false, error: message };
  }
}
