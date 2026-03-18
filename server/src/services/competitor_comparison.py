"""
Competitor Comparison Service — Head-to-head business vs competitor analysis across AI engines.

Generates comparison prompts, executes them on 4 AI engines (ChatGPT, Claude, Perplexity, Gemini),
and performs deep analysis of the responses to determine win rates, sentiment, and strengths/weaknesses.

Three-phase pipeline:
  1. Generate 5 comparison prompts using GPT-4o (or Ollama in local mode)
  2. Execute all 5 prompts on 4 AI engines in parallel (20 calls)
  3. Deep-analyse all responses in a single LLM call
"""

import asyncio
import json
import logging
import os
from datetime import datetime, timezone

import config as app_config
from models.audit import BusinessSnapshot, CategoryScore
from utils.dbal.ai_api_wrapper import (
    call_anthropic_api,
    call_google_api,
    call_ollama_api,
    call_openai_api,
    call_perplexity_api,
)

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

COMPARISON_PROMPT_COUNT = 5
MAX_RESPONSE_CHARS = 1500  # Truncation limit when building the analysis prompt

ENGINE_CONFIGS = [
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

# ---------------------------------------------------------------------------
# System prompts
# ---------------------------------------------------------------------------

PROMPT_GENERATION_SYSTEM = """\
You are an AI visibility analyst. Your task is to generate exactly 5 natural-sounding \
comparison prompts that a real user might type into an AI assistant (ChatGPT, Claude, \
Perplexity, Gemini) to compare businesses in a given category.

The prompts MUST:
- Mention the audited business AND all competitors BY NAME
- Be varied in style: direct comparison ("Which is better, X or Y for ...?"), \
alternatives ("What are the best alternatives to X?"), ranking ("Rank X, Y, Z for ..."), \
recommendation ("I'm looking for ... should I choose X or Y?"), pros/cons ("What are the pros and cons of X vs Y?")
- Be realistic, as if typed by a potential customer
- Match the specified language exactly

Output ONLY a valid JSON array of exactly 5 strings (the prompts). No markdown fences, \
no explanation, no keys — just the raw JSON array.

Example output:
["prompt 1", "prompt 2", "prompt 3", "prompt 4", "prompt 5"]
"""

ANALYSIS_SYSTEM = """\
You are an expert analyst evaluating how AI engines compare businesses. \
You will receive a set of comparison prompts and the raw responses from multiple AI engines.

For each prompt+engine response, extract:
1. Which businesses are mentioned by name
2. Which business is recommended as the #1 choice (if any clear recommendation is made)
3. A ranking of the mentioned businesses (1 = best)
4. Pros and cons identified for each business
5. Overall sentiment for each business: "positive", "neutral", or "negative"

Then produce an overall summary:
- Win rate: fraction of prompt/engine pairs where the audited business is ranked #1
- Average sentiment for the audited business
- Per-competitor breakdown: wins, losses, ties
- Common strengths and weaknesses of the audited business across all responses

Output ONLY valid JSON matching this exact structure (no markdown fences, no explanation):
{
  "perPrompt": [
    {
      "promptId": 1,
      "question": "the prompt text",
      "perEngine": {
        "engineName": {
          "recommended": "Business Name or null",
          "rankings": [{"name": "X", "rank": 1}, {"name": "Y", "rank": 2}],
          "perBusiness": {
            "Business X": {"mentioned": true, "sentiment": "positive", "pros": ["pro1"], "cons": ["con1"]},
            "Business Y": {"mentioned": true, "sentiment": "neutral", "pros": ["pro1"], "cons": ["con1"]}
          }
        }
      }
    }
  ],
  "overall": {
    "businessWinRate": 0.6,
    "businessAvgSentiment": "positive",
    "perCompetitor": {
      "Competitor A": {
        "businessWins": 3,
        "competitorWins": 1,
        "ties": 1,
        "competitorAvgSentiment": "neutral"
      }
    },
    "commonStrengths": ["strength1", "strength2"],
    "commonWeaknesses": ["weakness1"]
  }
}
"""


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _strip_markdown_fences(text: str) -> str:
    """Remove markdown code fences (```json ... ```) from LLM output."""
    text = text.strip()
    if text.startswith("```"):
        lines = text.split("\n")
        # Remove opening fence line
        lines = lines[1:]
        # Remove closing fence line
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        text = "\n".join(lines)
    return text.strip()


def _truncate(text: str, max_chars: int = MAX_RESPONSE_CHARS) -> str:
    """Truncate text to max_chars, appending an ellipsis if truncated."""
    if len(text) <= max_chars:
        return text
    return text[:max_chars] + "..."


# ---------------------------------------------------------------------------
# Mock data
# ---------------------------------------------------------------------------

def _build_mock_data(
    business_name: str,
    competitor_names: list[str],
    language: str,
) -> dict:
    """Return realistic mock data for testing without API calls."""
    all_names = [business_name] + competitor_names
    engines = ["chatgpt", "claude", "perplexity", "gemini"]

    mock_prompts_fr = [
        f"Quelle est la meilleure option entre {', '.join(all_names)} ?",
        f"Comparez {business_name} et {competitor_names[0] if competitor_names else 'ses concurrents'} pour un client.",
        f"Quels sont les avantages et inconvenients de {business_name} par rapport a {', '.join(competitor_names)} ?",
        f"Je cherche un prestataire, dois-je choisir {business_name} ou {competitor_names[0] if competitor_names else 'un concurrent'} ?",
        f"Classez {', '.join(all_names)} du meilleur au moins bon.",
    ]
    mock_prompts_en = [
        f"Which is better between {', '.join(all_names)}?",
        f"Compare {business_name} and {competitor_names[0] if competitor_names else 'its competitors'} for a customer.",
        f"What are the pros and cons of {business_name} vs {', '.join(competitor_names)}?",
        f"I'm looking for a provider, should I choose {business_name} or {competitor_names[0] if competitor_names else 'a competitor'}?",
        f"Rank {', '.join(all_names)} from best to worst.",
    ]
    mock_prompts = mock_prompts_fr if language == "fr" else mock_prompts_en

    prompts_data = []
    per_prompt_analysis = []

    for idx, question in enumerate(mock_prompts, start=1):
        responses = {}
        per_engine_analysis = {}

        for engine in engines:
            responses[engine] = {
                "rawResponse": (
                    f"Based on my analysis, {business_name} stands out for its quality and reliability. "
                    f"However, {competitor_names[0] if competitor_names else 'competitors'} also offers "
                    f"competitive features. Overall, {business_name} is a strong choice for most users."
                ),
                "success": True,
            }

            # Business wins ~60% of the time
            business_wins = idx <= 3  # wins 3 out of 5
            rankings = [{"name": business_name, "rank": 1 if business_wins else 2}]
            for ci, comp in enumerate(competitor_names):
                rankings.append({"name": comp, "rank": 2 + ci if business_wins else 1 if ci == 0 else 2 + ci})

            per_business = {
                business_name: {
                    "mentioned": True,
                    "sentiment": "positive" if business_wins else "neutral",
                    "pros": ["Quality service", "Strong reputation"],
                    "cons": ["Higher pricing"],
                },
            }
            for comp in competitor_names:
                per_business[comp] = {
                    "mentioned": True,
                    "sentiment": "neutral",
                    "pros": ["Competitive pricing"],
                    "cons": ["Less established"],
                }

            per_engine_analysis[engine] = {
                "recommended": business_name if business_wins else (competitor_names[0] if competitor_names else None),
                "rankings": rankings,
                "perBusiness": per_business,
            }

        prompts_data.append({
            "promptId": idx,
            "question": question,
            "responses": responses,
        })
        per_prompt_analysis.append({
            "promptId": idx,
            "question": question,
            "perEngine": per_engine_analysis,
        })

    # Build per-competitor overall stats
    per_competitor = {}
    for comp in competitor_names:
        per_competitor[comp] = {
            "businessWins": 3,
            "competitorWins": 1,
            "ties": 1,
            "competitorAvgSentiment": "neutral",
        }

    return {
        "prompts": prompts_data,
        "analysis": {
            "perPrompt": per_prompt_analysis,
            "overall": {
                "businessWinRate": 0.6,
                "businessAvgSentiment": "positive",
                "perCompetitor": per_competitor,
                "commonStrengths": ["Quality service", "Strong reputation", "Reliable delivery"],
                "commonWeaknesses": ["Higher pricing compared to some competitors"],
            },
        },
        "meta": {
            "generatedAt": datetime.now(timezone.utc).isoformat(),
            "businessName": business_name,
            "competitorNames": competitor_names,
            "language": language,
            "promptCount": COMPARISON_PROMPT_COUNT,
            "enginesUsed": engines,
            "enginesSucceeded": engines,
            "totalResponses": COMPARISON_PROMPT_COUNT * len(engines),
        },
    }


# ---------------------------------------------------------------------------
# Phase 1: Generate comparison prompts
# ---------------------------------------------------------------------------

async def _generate_prompts(
    snapshot: BusinessSnapshot,
    competitor_names: list[str],
    language: str,
) -> list[str] | None:
    """Use GPT-4o (or Ollama) to generate 5 comparison prompts.

    Returns a list of 5 prompt strings, or None on failure.
    """
    all_names = [snapshot.name] + competitor_names
    user_prompt = (
        f"Business: {snapshot.name}\n"
        f"URL: {snapshot.primaryUrl}\n"
        f"Category: {snapshot.category}\n"
        f"Description: {snapshot.description}\n"
        f"Competitors: {', '.join(competitor_names)}\n"
        f"Language: {language}\n\n"
        f"Generate 5 comparison prompts involving these businesses: {', '.join(all_names)}.\n"
        f"Output a JSON array of 5 strings."
    )

    conversation_history = [{"role": "system", "content": PROMPT_GENERATION_SYSTEM}]

    try:
        if app_config.LOCAL_AI_MODE:
            result = await asyncio.to_thread(
                call_ollama_api,
                "ollama-local",
                user_prompt,
                app_config.OLLAMA_MODEL,
                conversation_history=conversation_history,
                use_web_search=False,
                base_url=app_config.OLLAMA_BASE_URL,
            )
        else:
            api_key = os.getenv("OPENAI_API_KEY")
            if not api_key:
                logger.warning("Competitor comparison: OPENAI_API_KEY not set for prompt generation")
                return None

            result = await asyncio.to_thread(
                call_openai_api,
                api_key,
                user_prompt,
                "gpt-4o",
                conversation_history=conversation_history,
                use_web_search=False,
            )

        if not result.get("success") or not result.get("response"):
            logger.warning(f"Competitor comparison prompt generation failed: {result.get('error', 'unknown')}")
            return None

        raw = _strip_markdown_fences(result["response"])
        prompts = json.loads(raw)

        if not isinstance(prompts, list) or len(prompts) < 1:
            logger.warning(f"Competitor comparison: LLM returned invalid prompt list (got {type(prompts).__name__})")
            return None

        # Ensure exactly 5 prompts
        prompts = [str(p) for p in prompts[:COMPARISON_PROMPT_COUNT]]
        logger.info(f"Competitor comparison: generated {len(prompts)} comparison prompts")
        return prompts

    except json.JSONDecodeError as e:
        logger.warning(f"Competitor comparison: failed to parse prompt JSON: {e}")
        return None
    except Exception as e:
        logger.warning(f"Competitor comparison: prompt generation failed: {e}")
        return None


# ---------------------------------------------------------------------------
# Phase 2: Execute prompts on all engines
# ---------------------------------------------------------------------------

async def _execute_single_call(
    engine_config: dict,
    api_key: str,
    prompt_id: int,
    question: str,
) -> dict:
    """Execute a single prompt on a single engine.

    Returns {"rawResponse": str, "success": bool, "error": str|None}.
    """
    caller = engine_config["caller"]
    model = engine_config["model"]
    engine_name = engine_config["name"]

    try:
        result = await asyncio.to_thread(
            caller,
            api_key,
            question,
            model,
            use_web_search=(engine_name == "perplexity"),
        )

        if result.get("success") and result.get("response"):
            return {
                "rawResponse": result["response"],
                "success": True,
                "error": None,
            }

        return {
            "rawResponse": "",
            "success": False,
            "error": result.get("error", "Unknown error"),
        }

    except Exception as e:
        logger.warning(f"[{engine_name}] Prompt {prompt_id} failed: {e}")
        return {
            "rawResponse": "",
            "success": False,
            "error": str(e),
        }


async def _execute_all_prompts(
    prompts: list[str],
) -> tuple[list[dict], list[str], list[str]]:
    """Execute all prompts on all 4 engines in parallel.

    Returns:
        - prompts_data: list of {promptId, question, responses: {engine: {rawResponse, success}}}
        - engines_used: list of engine names attempted
        - engines_succeeded: list of engine names with at least 1 successful response
    """
    # Determine engine configs based on mode
    if app_config.LOCAL_AI_MODE:
        def _ollama_caller(api_key, message, model, **kwargs):
            return call_ollama_api(
                api_key, message, model,
                base_url=app_config.OLLAMA_BASE_URL, **kwargs,
            )

        active_engines = [
            {"name": name, "caller": _ollama_caller, "model": app_config.OLLAMA_MODEL, "key_env": "_LOCAL_AI_DUMMY_KEY"}
            for name in ["chatgpt", "claude", "perplexity", "gemini"]
        ]
        os.environ.setdefault("_LOCAL_AI_DUMMY_KEY", "ollama-local")
    else:
        active_engines = list(ENGINE_CONFIGS)

    engines_used = [e["name"] for e in active_engines]

    # Resolve API keys upfront
    engine_keys: dict[str, str | None] = {}
    for eng in active_engines:
        engine_keys[eng["name"]] = os.getenv(eng["key_env"])

    # Build all 20 tasks (5 prompts x 4 engines)
    tasks = []
    task_index = []  # (prompt_idx, engine_name) for each task

    for prompt_idx, question in enumerate(prompts):
        for eng in active_engines:
            api_key = engine_keys[eng["name"]]
            if not api_key:
                logger.warning(f"[{eng['name']}] API key not set ({eng['key_env']}), skipping")
                tasks.append(_make_error_result(eng["name"]))
            else:
                tasks.append(
                    _execute_single_call(eng, api_key, prompt_idx + 1, question)
                )
            task_index.append((prompt_idx, eng["name"]))

    # Execute all in parallel
    results = await asyncio.gather(*tasks, return_exceptions=True)

    # Organize results into the prompts_data structure
    prompts_data: list[dict] = []
    for prompt_idx, question in enumerate(prompts):
        prompts_data.append({
            "promptId": prompt_idx + 1,
            "question": question,
            "responses": {},
        })

    engine_success_count: dict[str, int] = {e["name"]: 0 for e in active_engines}

    for (prompt_idx, engine_name), result in zip(task_index, results):
        if isinstance(result, Exception):
            response_data = {
                "rawResponse": "",
                "success": False,
                "error": str(result),
            }
        else:
            response_data = result

        prompts_data[prompt_idx]["responses"][engine_name] = {
            "rawResponse": response_data.get("rawResponse", ""),
            "success": response_data.get("success", False),
        }

        if response_data.get("success"):
            engine_success_count[engine_name] += 1

    engines_succeeded = [name for name, count in engine_success_count.items() if count > 0]

    if len(engines_succeeded) < 2:
        logger.warning(
            f"Competitor comparison: only {len(engines_succeeded)} engine(s) succeeded "
            f"(succeeded: {engines_succeeded})"
        )

    total_responses = sum(engine_success_count.values())
    logger.info(
        f"Competitor comparison execution complete: {len(engines_succeeded)}/{len(active_engines)} engines, "
        f"{total_responses} total successful responses"
    )

    return prompts_data, engines_used, engines_succeeded


async def _make_error_result(engine_name: str) -> dict:
    """Return an error result for a missing API key."""
    return {
        "rawResponse": "",
        "success": False,
        "error": f"API key not configured for {engine_name}",
    }


# ---------------------------------------------------------------------------
# Phase 3: Deep analysis
# ---------------------------------------------------------------------------

async def _analyse_responses(
    business_name: str,
    competitor_names: list[str],
    prompts_data: list[dict],
    language: str,
) -> dict | None:
    """Analyse all raw responses in a single LLM call.

    Returns the parsed analysis dict, or None on failure.
    """
    # Build the user prompt with all raw responses (truncated)
    lines: list[str] = []
    lines.append(f"Audited business: {business_name}")
    lines.append(f"Competitors: {', '.join(competitor_names)}")
    lines.append(f"Language: {language}")
    lines.append("")

    for prompt_data in prompts_data:
        lines.append(f"--- Prompt {prompt_data['promptId']}: {prompt_data['question']} ---")
        for engine_name, resp in prompt_data["responses"].items():
            if resp.get("success") and resp.get("rawResponse"):
                truncated = _truncate(resp["rawResponse"], MAX_RESPONSE_CHARS)
                lines.append(f"[{engine_name}]: {truncated}")
            else:
                lines.append(f"[{engine_name}]: (no response)")
        lines.append("")

    lines.append("Analyse all responses and output the JSON structure as instructed.")
    user_prompt = "\n".join(lines)

    conversation_history = [{"role": "system", "content": ANALYSIS_SYSTEM}]

    try:
        if app_config.LOCAL_AI_MODE:
            result = await asyncio.to_thread(
                call_ollama_api,
                "ollama-local",
                user_prompt,
                app_config.OLLAMA_MODEL,
                conversation_history=conversation_history,
                use_web_search=False,
                base_url=app_config.OLLAMA_BASE_URL,
            )
        else:
            api_key = os.getenv("OPENAI_API_KEY")
            if not api_key:
                logger.warning("Competitor comparison: OPENAI_API_KEY not set for analysis")
                return None

            result = await asyncio.to_thread(
                call_openai_api,
                api_key,
                user_prompt,
                "gpt-4o",
                conversation_history=conversation_history,
                use_web_search=False,
            )

        if not result.get("success") or not result.get("response"):
            logger.warning(f"Competitor comparison analysis call failed: {result.get('error', 'unknown')}")
            return None

        raw = _strip_markdown_fences(result["response"])
        analysis = json.loads(raw)

        if not isinstance(analysis, dict):
            logger.warning(f"Competitor comparison: analysis LLM returned {type(analysis).__name__}, expected dict")
            return None

        logger.info("Competitor comparison: analysis completed successfully")
        return analysis

    except json.JSONDecodeError as e:
        logger.warning(f"Competitor comparison: failed to parse analysis JSON: {e}")
        return None
    except Exception as e:
        logger.warning(f"Competitor comparison: analysis failed: {e}")
        return None


# ---------------------------------------------------------------------------
# Main entry point
# ---------------------------------------------------------------------------

async def generate_competitor_comparison(
    snapshot: BusinessSnapshot,
    competitor_names: list[str],
    competitor_urls: list[str],
    category_scores: dict[str, CategoryScore],
    language: str = "fr",
) -> dict | None:
    """Generate a full competitor comparison report.

    Three-phase pipeline:
      1. Generate 5 comparison prompts via LLM
      2. Execute prompts on 4 AI engines in parallel
      3. Deep-analyse all responses via LLM

    Args:
        snapshot: Business data snapshot from the audit.
        competitor_names: List of competitor business names.
        competitor_urls: List of competitor URLs (parallel to competitor_names).
        category_scores: Category scores from the main audit.
        language: Audit language ("fr" or "en").

    Returns:
        Full comparison result dict, or None on critical failure.
    """
    if not competitor_names:
        logger.info("Competitor comparison: no competitors provided, skipping")
        return None

    try:
        # ---- Mock mode ----
        if app_config.MOCK_AI:
            logger.info("Competitor comparison: returning mock data")
            return _build_mock_data(snapshot.name, competitor_names, language)

        # ---- Phase 1: Generate prompts ----
        logger.info(
            f"Competitor comparison: starting for '{snapshot.name}' vs "
            f"{competitor_names} (language={language})"
        )
        prompts = await _generate_prompts(snapshot, competitor_names, language)

        if not prompts:
            logger.warning("Competitor comparison: prompt generation returned nothing, aborting")
            return None

        # ---- Phase 2: Execute on engines ----
        prompts_data, engines_used, engines_succeeded = await _execute_all_prompts(prompts)

        total_responses = sum(
            1
            for pd in prompts_data
            for resp in pd["responses"].values()
            if resp.get("success")
        )

        # ---- Phase 3: Deep analysis ----
        analysis = await _analyse_responses(
            snapshot.name, competitor_names, prompts_data, language,
        )

        if analysis is None:
            logger.warning("Competitor comparison: analysis failed, returning prompts + raw responses only")

        # ---- Build final result ----
        return {
            "prompts": prompts_data,
            "analysis": analysis,
            "meta": {
                "generatedAt": datetime.now(timezone.utc).isoformat(),
                "businessName": snapshot.name,
                "competitorNames": competitor_names,
                "language": language,
                "promptCount": len(prompts),
                "enginesUsed": engines_used,
                "enginesSucceeded": engines_succeeded,
                "totalResponses": total_responses,
            },
        }

    except Exception as e:
        logger.warning(f"Competitor comparison failed: {e}")
        return None
