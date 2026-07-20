import type { LLMResponse, LLMQueryContext } from "./types";

/**
 * Real provider adapters. Each is a plain HTTPS call to the provider's chat
 * API — no Python service, no SDK. Small models are used (see PRD cost table):
 * gpt-4o-mini, claude-haiku, sonar, gemini-flash.
 *
 * These are only invoked when the corresponding API key is present; otherwise
 * the pipeline falls back to the deterministic mock (see ./index.ts).
 */

const TIMEOUT_MS = 30_000;

const SYSTEM_PROMPT =
  "Tu es un assistant qui répond à des questions de recherche de produits/services. " +
  "Cite tes sources sous forme d'URLs quand c'est pertinent. Réponds en français.";

async function fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
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
        { role: "system", content: SYSTEM_PROMPT },
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
      model: process.env.ANTHROPIC_MODEL || "claude-3-5-haiku-latest",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
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
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
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
  const model = process.env.GEMINI_MODEL || "gemini-1.5-flash";
  const res = await fetchWithTimeout(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
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
