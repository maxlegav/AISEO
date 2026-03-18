"""
FAQ Schema Generator — Generates personalized FAQPage JSON-LD from audit data.

Uses prompt gaps (questions AI couldn't answer about the business), business context,
and category scores to produce a ready-to-embed FAQ schema that improves GEO visibility.
"""

import json
import logging
import os
from datetime import datetime, timezone

import config as app_config
from models.audit import (
    BusinessSnapshot,
    CategoryScore,
    HtmlScanResult,
    PromptGap,
)
from utils.dbal.ai_api_wrapper import call_ollama_api, call_openai_api

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """\
You are a GEO (Generative Engine Optimization) expert specialising in structured data. \
Your task is to generate FAQ Q&A pairs that a business can embed on their website as a \
FAQPage JSON-LD schema to maximise visibility in AI search engines (ChatGPT, Claude, \
Perplexity, Gemini).

Generate between 5 and 8 FAQ entries following these rules:

1. **Base questions on prompt gaps** — the provided list contains real questions that AI \
engines could NOT answer about this business. Rephrase and answer them authoritatively.
2. **Be factual** — every answer MUST use the actual business name, URL, category, and \
description provided. Do NOT invent services, locations, or claims not supported by context.
3. **Target weak categories** — prioritise questions covering the categories where the \
business scores lowest (discovery, comparison, reputation, product, alternative, trust).
4. **Answer quality** — each answer should be 2-4 sentences, factual, and naturally \
include the business name at least once.
5. **Language** — write ALL questions and answers in the language specified by the user.
6. **Output format** — return ONLY a valid JSON array of objects, each with "question" \
and "answer" keys. No markdown fences, no explanation, no wrapper object — just the array.

Example output:
[
  {"question": "What does Acme Corp do?", "answer": "Acme Corp is a ..."},
  {"question": "Where is Acme Corp located?", "answer": "Acme Corp operates from ..."}
]
"""


def _build_user_prompt(
    snapshot: BusinessSnapshot,
    prompt_gaps: list[PromptGap],
    category_scores: dict[str, CategoryScore],
    html_scan: HtmlScanResult | None,
    language: str,
) -> str:
    """Build the dynamic user prompt from audit data."""
    lines: list[str] = []

    # Business identity
    lines.append(f"Business: {snapshot.name}")
    lines.append(f"URL: {snapshot.primaryUrl}")
    lines.append(f"Category: {snapshot.category}")
    lines.append(f"Description: {snapshot.description}")
    if snapshot.localityTier:
        lines.append(f"Locality tier: {snapshot.localityTier}")
    if snapshot.targetKeywords:
        lines.append(f"Target keywords: {', '.join(snapshot.targetKeywords[:10])}")

    # Prompt gaps — the questions AI couldn't answer
    if prompt_gaps:
        gaps_to_use = prompt_gaps[:10]
        lines.append(f"\nPrompt gaps ({len(gaps_to_use)} questions AI could NOT answer):")
        for gap in gaps_to_use:
            lines.append(f"  - [{gap.category}] {gap.question}")

    # Weak category scores — sorted ascending (weakest first)
    if category_scores:
        sorted_cats = sorted(category_scores.items(), key=lambda x: x[1].score)
        weak = sorted_cats[:3]
        lines.append("\nWeakest categories (prioritise these):")
        for name, cs in weak:
            lines.append(f"  - {name}: {cs.score:.1f}/100 (mention rate: {cs.avgMentionRate:.0%})")

    # Existing schema info from HTML scan
    if html_scan:
        existing_schemas = list(html_scan.schemaOrg.keys()) if html_scan.schemaOrg else []
        if existing_schemas:
            lines.append(f"\nExisting Schema.org types on site: {', '.join(existing_schemas)}")
        else:
            lines.append("\nNo existing Schema.org markup detected on the site.")

    # Language instruction
    lang_label = "French" if language == "fr" else "English"
    lines.append(f"\nLanguage: write all questions and answers in {lang_label}.")
    lines.append("\nGenerate the FAQ entries now.")
    return "\n".join(lines)


def _has_existing_faq_schema(html_scan: HtmlScanResult | None) -> bool:
    """Check whether the site already has a FAQPage schema."""
    if not html_scan or not html_scan.schemaOrg:
        return False
    # schemaOrg is a dict keyed by schema type or extraction method
    schema_str = json.dumps(html_scan.schemaOrg).lower()
    return "faqpage" in schema_str


def _estimate_score_gain(entry_count: int, had_faq_schema: bool) -> int:
    """Estimate the GEO score improvement from adding FAQ schema.

    Heuristic: each entry is worth ~2 points, and adding FAQ schema
    when none existed gives a bonus of 5 points. Capped at 25.
    """
    base = entry_count * 2
    bonus = 0 if had_faq_schema else 5
    return min(base + bonus, 25)


def _build_result(
    entries: list[dict],
    snapshot: BusinessSnapshot,
    language: str,
    prompt_gaps_used: int,
    html_scan: HtmlScanResult | None,
) -> dict:
    """Assemble the final result dict from parsed FAQ entries."""
    main_entity = []
    for entry in entries:
        main_entity.append(
            {
                "@type": "Question",
                "name": entry["question"],
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": entry["answer"],
                },
            }
        )

    json_ld = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": main_entity,
    }

    script_tag = (
        '<script type="application/ld+json">'
        + json.dumps(json_ld, ensure_ascii=False)
        + "</script>"
    )

    had_faq = _has_existing_faq_schema(html_scan)

    return {
        "jsonLd": json_ld,
        "scriptTag": script_tag,
        "entries": entries,
        "meta": {
            "generatedAt": datetime.now(timezone.utc).isoformat(),
            "businessName": snapshot.name,
            "language": language,
            "entryCount": len(entries),
            "basedOnPromptGaps": prompt_gaps_used,
            "estimatedScoreGain": _estimate_score_gain(len(entries), had_faq),
        },
    }


def _build_mock(snapshot: BusinessSnapshot, language: str) -> dict:
    """Return a realistic mock result for MOCK_AI mode."""
    if language == "fr":
        entries = [
            {
                "question": f"Qu'est-ce que {snapshot.name} ?",
                "answer": (
                    f"{snapshot.name} est une entreprise sp\u00e9cialis\u00e9e dans le domaine "
                    f"{snapshot.category}. Nous proposons des services de qualit\u00e9 adapt\u00e9s "
                    f"aux besoins de nos clients."
                ),
            },
            {
                "question": f"Comment contacter {snapshot.name} ?",
                "answer": (
                    f"Vous pouvez contacter {snapshot.name} directement via notre site web "
                    f"{snapshot.primaryUrl}. Notre \u00e9quipe est disponible pour r\u00e9pondre "
                    f"\u00e0 toutes vos questions."
                ),
            },
            {
                "question": f"Pourquoi choisir {snapshot.name} ?",
                "answer": (
                    f"{snapshot.name} se distingue par son expertise en {snapshot.category} "
                    f"et son engagement envers la satisfaction client. Nous offrons des solutions "
                    f"personnalis\u00e9es et un accompagnement sur mesure."
                ),
            },
        ]
    else:
        entries = [
            {
                "question": f"What is {snapshot.name}?",
                "answer": (
                    f"{snapshot.name} is a company specialising in {snapshot.category}. "
                    f"We provide high-quality services tailored to our clients' needs."
                ),
            },
            {
                "question": f"How can I contact {snapshot.name}?",
                "answer": (
                    f"You can reach {snapshot.name} through our website at "
                    f"{snapshot.primaryUrl}. Our team is available to answer all your questions."
                ),
            },
            {
                "question": f"Why choose {snapshot.name}?",
                "answer": (
                    f"{snapshot.name} stands out for its expertise in {snapshot.category} "
                    f"and its commitment to customer satisfaction. We offer personalised "
                    f"solutions and dedicated support."
                ),
            },
        ]

    return _build_result(
        entries=entries,
        snapshot=snapshot,
        language=language,
        prompt_gaps_used=0,
        html_scan=None,
    )


async def generate_faq_schema(
    snapshot: BusinessSnapshot,
    prompt_gaps: list[PromptGap],
    category_scores: dict[str, CategoryScore],
    html_scan: HtmlScanResult | None,
    language: str = "fr",
) -> dict | None:
    """Generate a personalised FAQPage JSON-LD schema using an LLM.

    Returns a dict with jsonLd, scriptTag, entries, and meta — or None on failure.
    Non-blocking — failures are logged and swallowed.
    """
    try:
        if app_config.MOCK_AI:
            logger.info("FAQ schema generator: returning mock data")
            return _build_mock(snapshot, language)

        user_prompt = _build_user_prompt(
            snapshot=snapshot,
            prompt_gaps=prompt_gaps,
            category_scores=category_scores,
            html_scan=html_scan,
            language=language,
        )

        conversation_history = [{"role": "system", "content": SYSTEM_PROMPT}]

        if app_config.LOCAL_AI_MODE:
            import asyncio

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
            import asyncio

            api_key = os.getenv("OPENAI_API_KEY")
            if not api_key:
                logger.warning("FAQ schema generator: OPENAI_API_KEY not set")
                return None

            result = await asyncio.to_thread(
                call_openai_api,
                api_key,
                user_prompt,
                "gpt-4o",
                conversation_history=conversation_history,
                use_web_search=False,
            )

        if not (result.get("success") and result.get("response")):
            logger.warning(
                f"FAQ schema generator: AI call failed — {result.get('error', 'unknown')}"
            )
            return None

        raw = result["response"].strip()

        # Strip markdown fences if the model wraps the output
        if raw.startswith("```"):
            lines = raw.split("\n")
            if lines[-1].strip() == "```":
                lines = lines[1:-1]
            else:
                lines = lines[1:]
            raw = "\n".join(lines)

        entries = json.loads(raw)

        if not isinstance(entries, list) or not entries:
            logger.warning("FAQ schema generator: LLM returned non-list or empty result")
            return None

        # Validate each entry has the required keys
        validated: list[dict] = []
        for entry in entries:
            if isinstance(entry, dict) and "question" in entry and "answer" in entry:
                validated.append(
                    {
                        "question": str(entry["question"]),
                        "answer": str(entry["answer"]),
                    }
                )

        if not validated:
            logger.warning("FAQ schema generator: no valid Q&A entries after validation")
            return None

        prompt_gaps_used = min(len(prompt_gaps), 10)
        output = _build_result(
            entries=validated,
            snapshot=snapshot,
            language=language,
            prompt_gaps_used=prompt_gaps_used,
            html_scan=html_scan,
        )

        logger.info(
            f"FAQ schema generated ({len(validated)} entries, "
            f"estimated +{output['meta']['estimatedScoreGain']} pts)"
        )
        return output

    except json.JSONDecodeError as e:
        logger.warning(f"FAQ schema generator: failed to parse LLM JSON — {e}")
        return None
    except Exception as e:
        logger.warning(f"FAQ schema generator failed: {e}")
        return None
