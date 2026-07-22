import type { LLMId } from "@/lib/monitoring/types";

/**
 * Free-form text generation for the deliverables agent.
 *
 * This is distinct from `queryLLM` (which simulates a *search* answer for the
 * monitoring pipeline): here we ask a model to *write* a concrete deliverable
 * (an llms.txt, a FAQ, an answer page...). It reuses the same HTTPS-only
 * provider pattern and the same "no key -> caller falls back to a deterministic
 * template" contract, so nothing breaks without API keys.
 *
 * Keys stay server-side (this module is only imported from API routes).
 */

const TIMEOUT_MS = 45_000;

export interface GenerateResult {
  /** The generated text, empty when no provider could produce it. */
  text: string;
  /** True when no real API key was available (caller uses its template). */
  mock: boolean;
  /** Which engine produced the text, when real. */
  provider?: LLMId;
  /** Set when a provider was tried but failed. */
  error?: string;
}

const KEY_ENV: Record<LLMId, string> = {
  chatgpt: "OPENAI_API_KEY",
  claude: "ANTHROPIC_API_KEY",
  gemini: "GEMINI_API_KEY",
  perplexity: "PERPLEXITY_API_KEY",
};

// Order of preference: general-purpose writers first.
const PROVIDER_ORDER: LLMId[] = ["chatgpt", "claude", "gemini", "perplexity"];

/** The first configured provider, or null when running key-free. */
export function firstConfiguredProvider(): LLMId | null {
  return PROVIDER_ORDER.find((llm) => Boolean(process.env[KEY_ENV[llm]])) ?? null;
}

/** True when at least one LLM API key is configured. */
export function hasAnyKey(): boolean {
  return firstConfiguredProvider() !== null;
}

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
interface AnthropicResponse {
  content?: { type: string; text?: string }[];
}
interface GeminiResponse {
  candidates?: { content?: { parts?: { text?: string }[] } }[];
}
interface PerplexityResponse {
  choices?: { message?: { content?: string } }[];
}

async function callOpenAI(system: string, user: string): Promise<string> {
  const res = await fetchWithTimeout("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: 0.4,
    }),
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}`);
  const data = (await res.json()) as OpenAIChatResponse;
  return data.choices?.[0]?.message?.content ?? "";
}

async function callAnthropic(system: string, user: string): Promise<string> {
  const res = await fetchWithTimeout("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY || "",
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || "claude-3-5-haiku-latest",
      max_tokens: 2048,
      system,
      messages: [{ role: "user", content: user }],
    }),
  });
  if (!res.ok) throw new Error(`Anthropic ${res.status}`);
  const data = (await res.json()) as AnthropicResponse;
  return (data.content ?? [])
    .filter((c) => c.type === "text")
    .map((c) => c.text ?? "")
    .join("\n");
}

async function callGemini(system: string, user: string): Promise<string> {
  const model = process.env.GEMINI_MODEL || "gemini-1.5-flash";
  const res = await fetchWithTimeout(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: "user", parts: [{ text: user }] }],
      }),
    },
  );
  if (!res.ok) throw new Error(`Gemini ${res.status}`);
  const data = (await res.json()) as GeminiResponse;
  return (data.candidates?.[0]?.content?.parts ?? [])
    .map((p) => p.text ?? "")
    .join("\n");
}

async function callPerplexity(system: string, user: string): Promise<string> {
  const res = await fetchWithTimeout("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.PERPLEXITY_API_KEY}`,
    },
    body: JSON.stringify({
      model: process.env.PERPLEXITY_MODEL || "sonar",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });
  if (!res.ok) throw new Error(`Perplexity ${res.status}`);
  const data = (await res.json()) as PerplexityResponse;
  return data.choices?.[0]?.message?.content ?? "";
}

const CALLERS: Record<LLMId, (system: string, user: string) => Promise<string>> = {
  chatgpt: callOpenAI,
  claude: callAnthropic,
  gemini: callGemini,
  perplexity: callPerplexity,
};

/**
 * Generate text with the first configured provider. Never throws: on no key it
 * returns `{ text: "", mock: true }` so the caller can substitute a
 * deterministic template; on a provider error it returns `{ mock: false,
 * error }` with an empty string.
 */
export async function generateText(system: string, user: string): Promise<GenerateResult> {
  const provider = firstConfiguredProvider();
  if (!provider) return { text: "", mock: true };
  try {
    const text = await CALLERS[provider](system, user);
    return { text: text.trim(), mock: false, provider };
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    return { text: "", mock: false, provider, error: message };
  }
}
