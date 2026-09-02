import type { LLMResponse, LLMQueryContext } from "./types";
import { monitoringSystemPrompt } from "./system-prompt";

/**
 * Real provider adapters. Each is a plain HTTPS call to the provider's chat
 * API, no Python service, no SDK. Small models are used (see PRD cost table):
 * gpt-4o-mini, claude-haiku, sonar, gemini-flash.
 *
 * These are only invoked when the corresponding API key is present; otherwise
 * the pipeline falls back to the deterministic mock (see ./index.ts).
 */

const TIMEOUT_MS = 30_000;
const MAX_RETRIES = 3;
const BASE_BACKOFF_MS = 1_000;
const MAX_BACKOFF_MS = 8_000;



function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Retry on 429 and 5xx (transient); 4xx (except 429) are permanent. */
function isRetryableStatus(status: number): boolean {
  return status === 429 || status >= 500;
}

/** Exponential backoff (1s, 2s, 4s, capped), honouring `Retry-After` if given. */
function backoffDelay(attempt: number, retryAfter: string | null): number {
  if (retryAfter) {
    const seconds = Number(retryAfter);
    if (Number.isFinite(seconds) && seconds > 0) {
      return Math.min(seconds * 1_000, MAX_BACKOFF_MS);
    }
  }
  return Math.min(BASE_BACKOFF_MS * 2 ** attempt, MAX_BACKOFF_MS);
}

async function fetchOnce(url: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

/**
 * `fetch` with a per-attempt timeout plus exponential backoff on transient
 * failures (429, 5xx, network/timeout errors). Permanent 4xx responses are
 * returned immediately so callers can surface the real error.
 */
async function fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetchOnce(url, init);
      if (attempt < MAX_RETRIES && isRetryableStatus(res.status)) {
        await sleep(backoffDelay(attempt, res.headers.get("retry-after")));
        continue;
      }
      return res;
    } catch (err) {
      lastError = err;
      if (attempt < MAX_RETRIES) {
        await sleep(backoffDelay(attempt, null));
        continue;
      }
    }
  }
  throw lastError instanceof Error ? lastError : new Error("fetch failed after retries");
}

interface OpenAIChatResponse {
  choices?: { message?: { content?: string } }[];
}

export async function queryOpenAI(prompt: string, _ctx: LLMQueryContext): Promise<LLMResponse> {
  const res = await fetchWithTimeout("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages: [
        { role: "system", content: monitoringSystemPrompt() },
        { role: "user", content: prompt },
      ],
      temperature: 0.2,
    }),
  });
  if (!res.ok) {
    return { text: "", citations: [], mock: false, error: `OpenAI ${res.status}` };
  }
  const data = (await res.json()) as OpenAIChatResponse;
  const text = data.choices?.[0]?.message?.content ?? "";
  return { text, citations: [], mock: false };
}

interface AnthropicResponse {
  content?: { type: string; text?: string }[];
}

export async function queryAnthropic(prompt: string, _ctx: LLMQueryContext): Promise<LLMResponse> {
  const res = await fetchWithTimeout("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY || "",
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || "claude-haiku-4-5",
      max_tokens: 1024,
      system: monitoringSystemPrompt(),
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) {
    return { text: "", citations: [], mock: false, error: `Anthropic ${res.status}` };
  }
  const data = (await res.json()) as AnthropicResponse;
  const text = (data.content ?? [])
    .filter((c) => c.type === "text")
    .map((c) => c.text ?? "")
    .join("\n");
  return { text, citations: [], mock: false };
}

interface PerplexityResponse {
  choices?: { message?: { content?: string } }[];
  citations?: string[];
}

export async function queryPerplexity(prompt: string, _ctx: LLMQueryContext): Promise<LLMResponse> {
  const res = await fetchWithTimeout("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.PERPLEXITY_API_KEY}`,
    },
    body: JSON.stringify({
      model: process.env.PERPLEXITY_MODEL || "sonar",
      // Perplexity bills a flat fee per request that scales with the search
      // context: $5/1k on "low", $8 on medium, $12 on high. Our questions are
      // three words long and the answer is a shortlist — "low" is both the
      // right depth and two-thirds of the price of "high".
      web_search_options: { search_context_size: "low" },
      messages: [
        { role: "system", content: monitoringSystemPrompt() },
        { role: "user", content: prompt },
      ],
    }),
  });
  if (!res.ok) {
    return { text: "", citations: [], mock: false, error: `Perplexity ${res.status}` };
  }
  const data = (await res.json()) as PerplexityResponse;
  const text = data.choices?.[0]?.message?.content ?? "";
  return { text, citations: Array.isArray(data.citations) ? data.citations : [], mock: false };
}

interface GeminiResponse {
  candidates?: { content?: { parts?: { text?: string }[] } }[];
}

export async function queryGemini(prompt: string, _ctx: LLMQueryContext): Promise<LLMResponse> {
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const res = await fetchWithTimeout(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: monitoringSystemPrompt() }] },
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      }),
    },
  );
  if (!res.ok) {
    return { text: "", citations: [], mock: false, error: `Gemini ${res.status}` };
  }
  const data = (await res.json()) as GeminiResponse;
  const text = (data.candidates?.[0]?.content?.parts ?? [])
    .map((p) => p.text ?? "")
    .join("\n");
  return { text, citations: [], mock: false };
}
