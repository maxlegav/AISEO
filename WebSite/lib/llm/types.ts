import type { LLMId } from "@/lib/monitoring/types";

/** Normalised answer from any LLM provider. */
export interface LLMResponse {
  /** The model's answer text (may embed inline links). */
  text: string;
  /** Provider-supplied citation URLs, when the API returns them separately. */
  citations: string[];
  /** True when produced by the deterministic mock (no API key / dev mode). */
  mock: boolean;
  /** Set when the real API call failed (the run records the error, no crash). */
  error?: string;
}

export interface LLMQueryContext {
  /** Monitored brand, passed to the mock so it can realistically cite it. */
  brandName: string;
  llm: LLMId;
}

export type LLMProvider = (prompt: string, ctx: LLMQueryContext) => Promise<LLMResponse>;
