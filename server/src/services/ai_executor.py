"""
AI Executor — Parallel async AI querying across 4 engines.

Sends 100 prompts to 4 AI engines in parallel using asyncio.
Each engine processes prompts sequentially within its thread,
but all 4 engines run concurrently.
"""

import asyncio
import logging
import os
import time

from models.audit import GeneratedPrompt
from utils.dbal.ai_api_wrapper import (
    call_openai_api,
    call_anthropic_api,
    call_perplexity_api,
    call_google_api,
    call_ollama_api,
)
from config import (
    AI_ENGINES,
    MIN_ENGINES_REQUIRED,
    AUDIT_TIMEOUT_SECONDS,
    LOCAL_AI_MODE,
    MOCK_AI,
    OLLAMA_MODEL,
    OLLAMA_BASE_URL,
)

logger = logging.getLogger(__name__)

# Engine configurations
if MOCK_AI:
    import random

    def _mock_caller(api_key, message, model, **kwargs):
        """Return a fake AI response with random mention of the query content."""
        import time as _time
        # Simulate 100-500ms response time
        delay = random.uniform(0.05, 0.15)
        _time.sleep(delay)

        # 50% chance to mention common business-related words from the prompt
        if random.random() < 0.5:
            # Echo back some words from the prompt to simulate a mention
            words = message.split()
            snippet = " ".join(words[:10]) if len(words) > 10 else message
            response = (
                f"Based on my research, I'd recommend looking into {snippet}. "
                f"They have great reviews and solid reputation in their field. "
                f"Many users find their services reliable and trustworthy."
            )
        else:
            response = (
                "There are several good options in this space. "
                "I'd suggest checking online reviews and comparing features. "
                "The market has many competitive offerings worth exploring."
            )
        return {"success": True, "response": response}

    ENGINES = [
        {"name": "mock_engine", "caller": _mock_caller, "model": "mock-v1", "key_env": "_MOCK_AI_DUMMY_KEY"}
    ]
    os.environ.setdefault("_MOCK_AI_DUMMY_KEY", "mock-local")
    logger.info("MOCK AI MODE — using fake engine, no real API calls")

elif LOCAL_AI_MODE:
    # All engines keep their original names but route through Ollama
    def _ollama_caller(api_key, message, model, **kwargs):
        return call_ollama_api(api_key, message, model, base_url=OLLAMA_BASE_URL, **kwargs)

    ENGINES = [
        {"name": name, "caller": _ollama_caller, "model": OLLAMA_MODEL, "key_env": "_LOCAL_AI_DUMMY_KEY"}
        for name in ["chatgpt", "claude", "perplexity", "gemini"]
    ]
    # Set dummy key so execute_engine()'s os.getenv check passes
    os.environ.setdefault("_LOCAL_AI_DUMMY_KEY", "ollama-local")
else:
    ENGINES = [
        {
            "name": "chatgpt",
            "caller": call_openai_api,
            "model": "gpt-4o-mini",
            "key_env": "OPENAI_API_KEY",
        },
        {
            "name": "claude",
            "caller": call_anthropic_api,
            "model": "claude-haiku-4-5-20251001",
            "key_env": "ANTHROPIC_API_KEY",
        },
        {
            "name": "perplexity",
            "caller": call_perplexity_api,
            "model": "sonar",
            "key_env": "PERPLEXITY_API_KEY",
        },
        {
            "name": "gemini",
            "caller": call_google_api,
            "model": "gemini-2.5-flash-lite",
            "key_env": "GEMINI_API_KEY",
        },
    ]

# Exponential backoff settings
MAX_RETRIES = 4
BASE_DELAY = 1.0  # seconds
REQUEST_TIMEOUT = 30  # seconds per request


async def _execute_single_prompt(
    engine_config: dict,
    api_key: str,
    prompt: GeneratedPrompt,
    location_context: dict | None = None,
) -> dict:
    """Execute a single prompt against one engine with retry/backoff.

    location_context (if provided):
        - text_hint: str — e.g. "Belleville, Paris, France" (prepended for ChatGPT/Claude)
        - perplexity_options: dict — native web_search_options for Perplexity API
    """
    caller = engine_config["caller"]
    model = engine_config["model"]
    engine_name = engine_config["name"]

    # Build per-engine kwargs based on location context
    extra_kwargs: dict = {}
    question = prompt.question

    if location_context:
        if engine_name == "perplexity" and location_context.get("perplexity_options"):
            extra_kwargs["web_search_options"] = location_context["perplexity_options"]
        elif engine_name in ("chatgpt", "claude") and location_context.get("text_hint"):
            question = f"[Context: user located in {location_context['text_hint']}]\n{prompt.question}"

    for retry in range(MAX_RETRIES + 1):
        try:
            start = time.time()
            result = await asyncio.to_thread(
                caller,
                api_key,
                question,
                model,
                use_web_search=True,
                **extra_kwargs,
            )
            elapsed_ms = int((time.time() - start) * 1000)

            if result["success"]:
                return {
                    "promptId": prompt.id,
                    "rawResponse": result["response"] or "",
                    "responseTime": elapsed_ms,
                    "error": None,
                }

            error_msg = result.get("error", "Unknown error")

            # Check for rate limit errors
            if "rate" in error_msg.lower() or "429" in error_msg:
                if retry < MAX_RETRIES:
                    delay = BASE_DELAY * (2 ** retry)
                    logger.warning(
                        f"[{engine_name}] Rate limited on prompt {prompt.id}, "
                        f"retrying in {delay}s (attempt {retry + 1}/{MAX_RETRIES})"
                    )
                    await asyncio.sleep(delay)
                    continue

            return {
                "promptId": prompt.id,
                "rawResponse": "",
                "responseTime": elapsed_ms,
                "error": error_msg,
            }

        except asyncio.TimeoutError:
            return {
                "promptId": prompt.id,
                "rawResponse": "",
                "responseTime": REQUEST_TIMEOUT * 1000,
                "error": f"Timeout after {REQUEST_TIMEOUT}s",
            }
        except Exception as e:
            return {
                "promptId": prompt.id,
                "rawResponse": "",
                "responseTime": 0,
                "error": str(e),
            }

    return {
        "promptId": prompt.id,
        "rawResponse": "",
        "responseTime": 0,
        "error": f"Max retries ({MAX_RETRIES}) exceeded",
    }


async def execute_engine(
    engine_config: dict,
    prompts: list[GeneratedPrompt],
    location_context: dict | None = None,
) -> list[dict]:
    """
    Run all prompts sequentially against one engine.

    Returns list of {promptId, rawResponse, responseTime, error} per prompt.
    """
    engine_name = engine_config["name"]
    api_key = os.getenv(engine_config["key_env"])

    if not api_key:
        logger.error(f"[{engine_name}] API key not set ({engine_config['key_env']})")
        return [
            {
                "promptId": p.id,
                "rawResponse": "",
                "responseTime": 0,
                "error": f"API key not configured for {engine_name}",
            }
            for p in prompts
        ]

    logger.info(f"[{engine_name}] Starting execution of {len(prompts)} prompts...")
    results = []

    for i, prompt in enumerate(prompts):
        result = await _execute_single_prompt(engine_config, api_key, prompt, location_context)
        results.append(result)

        if (i + 1) % 25 == 0:
            logger.info(f"[{engine_name}] Progress: {i + 1}/{len(prompts)} prompts")

    success_count = sum(1 for r in results if r["error"] is None)
    logger.info(f"[{engine_name}] Completed: {success_count}/{len(prompts)} successful")

    return results


async def execute_all_engines(
    prompts: list[GeneratedPrompt],
    location_context: dict | None = None,
) -> tuple[dict[str, list[dict]], list[str], list[str]]:
    """
    Run all prompts across all 4 engines in parallel.

    Args:
        prompts: The 100 generated prompts.
        location_context: Optional location info for geo-biased queries.

    Returns:
        - results: {"chatgpt": [...], "claude": [...], ...}
        - engines_used: list of engine names attempted
        - engines_succeeded: list of engine names with sufficient responses
    """
    if MOCK_AI:
        active_engines = list(ENGINES)  # Use all mock engines directly
    else:
        active_engines = [e for e in ENGINES if e["name"] in AI_ENGINES]
    engines_used = [e["name"] for e in active_engines]
    tasks = [execute_engine(engine, prompts, location_context) for engine in active_engines]

    logger.info(f"Executing {len(prompts)} prompts across {len(active_engines)} engines in parallel...")

    try:
        all_results = await asyncio.wait_for(
            asyncio.gather(*tasks, return_exceptions=True),
            timeout=AUDIT_TIMEOUT_SECONDS,
        )
    except asyncio.TimeoutError:
        logger.error(f"Global timeout ({AUDIT_TIMEOUT_SECONDS}s) exceeded")
        raise RuntimeError(f"Audit execution timed out after {AUDIT_TIMEOUT_SECONDS}s")

    # Process results
    results: dict[str, list[dict]] = {}
    engines_succeeded: list[str] = []

    for engine_config, engine_result in zip(active_engines, all_results):
        name = engine_config["name"]

        if isinstance(engine_result, Exception):
            logger.error(f"[{name}] Engine failed with exception: {engine_result}")
            results[name] = [
                {
                    "promptId": p.id,
                    "rawResponse": "",
                    "responseTime": 0,
                    "error": str(engine_result),
                }
                for p in prompts
            ]
            continue

        results[name] = engine_result

        # Count successful responses (at least 50% must succeed)
        success_count = sum(1 for r in engine_result if r["error"] is None)
        if success_count >= len(prompts) * 0.5:
            engines_succeeded.append(name)
            logger.info(f"[{name}] Succeeded with {success_count}/{len(prompts)} responses")
        else:
            logger.warning(f"[{name}] Insufficient responses: {success_count}/{len(prompts)}")

    # Check minimum engines threshold
    if len(engines_succeeded) < MIN_ENGINES_REQUIRED:
        raise RuntimeError(
            f"Only {len(engines_succeeded)}/{len(active_engines)} engines succeeded "
            f"(minimum {MIN_ENGINES_REQUIRED} required). "
            f"Succeeded: {engines_succeeded}"
        )

    total_responses = sum(
        sum(1 for r in results[name] if r["error"] is None)
        for name in results
    )
    logger.info(
        f"AI execution complete: {len(engines_succeeded)}/{len(active_engines)} engines, "
        f"{total_responses} total responses"
    )

    return results, engines_used, engines_succeeded
