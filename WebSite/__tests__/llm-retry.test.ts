import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { queryOpenAI } from "@/lib/llm/providers";
import type { LLMQueryContext } from "@/lib/llm/types";

const ctx: LLMQueryContext = { brandName: "Acme", llm: "chatgpt" };

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const OK_BODY = { choices: [{ message: { content: "hello" } }] };

describe("LLM provider retry/backoff", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("does not retry a successful response", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, OK_BODY));
    vi.stubGlobal("fetch", fetchMock);

    const promise = queryOpenAI("q", ctx);
    await vi.runAllTimersAsync();
    const res = await promise;

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(res.text).toBe("hello");
    expect(res.error).toBeUndefined();
  });

  it("retries transient 5xx then succeeds", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(500, {}))
      .mockResolvedValueOnce(jsonResponse(503, {}))
      .mockResolvedValueOnce(jsonResponse(200, OK_BODY));
    vi.stubGlobal("fetch", fetchMock);

    const promise = queryOpenAI("q", ctx);
    await vi.runAllTimersAsync();
    const res = await promise;

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(res.text).toBe("hello");
  });

  it("gives up after max retries on persistent 429", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(429, {}));
    vi.stubGlobal("fetch", fetchMock);

    const promise = queryOpenAI("q", ctx);
    await vi.runAllTimersAsync();
    const res = await promise;

    // 1 initial attempt + 3 retries
    expect(fetchMock).toHaveBeenCalledTimes(4);
    expect(res.error).toContain("429");
  });

  it("does not retry a permanent 4xx", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(401, {}));
    vi.stubGlobal("fetch", fetchMock);

    const promise = queryOpenAI("q", ctx);
    await vi.runAllTimersAsync();
    const res = await promise;

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(res.error).toContain("401");
  });
});
