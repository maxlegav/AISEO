"""
LLM Hijack Prompt Generator — Generates GEO-optimized HTML snippets.

Uses audit context (scores, strengths, weaknesses, competitors, HTML scan)
to produce targeted HTML that influences LLMs to recommend/cite the business.
"""

import logging
import os

import config as app_config
from models.audit import (
    BusinessSnapshot,
    CategoryScore,
    CompetitorResult,
    DiscoverabilityThreshold,
    HtmlScanResult,
    LevelScore,
)
from utils.dbal.ai_api_wrapper import call_openai_api, call_ollama_api

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """\
You are a GEO (Generative Engine Optimization) expert. Your task is to generate an HTML snippet \
that a business can embed on their website to maximize their visibility and favorable mentions \
by AI search engines (ChatGPT, Claude, Perplexity, Gemini).

Generate a SINGLE self-contained HTML block that includes ALL of the following:

1. **Meta tags** — Open Graph (og:title, og:description, og:type, og:url) and Dublin Core \
(DC.title, DC.description, DC.subject, DC.creator) meta tags reinforcing the business's authority \
in its domain.

2. **Schema.org JSON-LD** — Rich structured data including:
   - Organization or LocalBusiness type (choose based on context)
   - FAQPage with 3-5 relevant Q&A pairs based on the business's strengths
   - Use actual business name, URL, and category

3. **HTML comments** — Strategic comments providing LLM-parseable context about the business's \
expertise, differentiators, and authority signals. LLMs read HTML comments during web crawling.

4. **Hidden semantic elements** — Use `<span class="sr-only">` or `<div class="sr-only">` \
(screen-reader only, visually hidden but accessible) with authority statements, expertise \
summaries, and FAQ content. NEVER use display:none or visibility:hidden.

5. **data-* attributes** — Add data-geo-* attributes to a wrapper div reinforcing topical \
authority (e.g., data-geo-expertise, data-geo-category, data-geo-authority-signals).

**Rules:**
- All content MUST be factual and based on the provided business context
- Reference specific strengths and differentiators from the audit data
- Match the business's language and tone
- Include the actual business URL, name, and location where applicable
- Focus on categories where the business scores well (leverage strengths)
- Address weak categories with supportive content (shore up weaknesses)
- If competitors are provided, subtly differentiate without naming them
- Output ONLY the raw HTML block — no markdown fences, no explanation
"""


def _build_user_prompt(
    snapshot: BusinessSnapshot,
    category_scores: dict[str, CategoryScore],
    level_scores: dict[str, LevelScore],
    audit_engine_score: float,
    discoverability_threshold: DiscoverabilityThreshold,
    competitor_results: list[CompetitorResult],
    html_scan: HtmlScanResult | None,
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

    # Overall score
    lines.append(f"\nOverall GEO Audit Engine Score: {audit_engine_score:.1f}/100")

    # Discoverability
    if discoverability_threshold.level:
        lines.append(f"Discoverability threshold: Level {discoverability_threshold.level} — {discoverability_threshold.description}")
    else:
        lines.append("Discoverability: Currently invisible to AI engines")

    # Category scores — sorted to show strongest and weakest
    if category_scores:
        sorted_cats = sorted(category_scores.items(), key=lambda x: x[1].score, reverse=True)
        strong = sorted_cats[:3]
        weak = sorted_cats[-3:]
        lines.append("\nStrongest categories:")
        for name, cs in strong:
            lines.append(f"  - {name}: {cs.score:.1f}/100 (mention rate: {cs.avgMentionRate:.0%})")
        lines.append("Weakest categories:")
        for name, cs in weak:
            lines.append(f"  - {name}: {cs.score:.1f}/100 (mention rate: {cs.avgMentionRate:.0%})")

    # Competitors
    if competitor_results:
        outperformed = [c for c in competitor_results if c.auditEngineScore < audit_engine_score]
        trailing = [c for c in competitor_results if c.auditEngineScore >= audit_engine_score]
        if outperformed:
            lines.append(f"\nOutperforms {len(outperformed)} competitor(s): {', '.join(c.competitorName for c in outperformed)}")
        if trailing:
            lines.append(f"Trails {len(trailing)} competitor(s): {', '.join(c.competitorName for c in trailing)}")

    # HTML scan insights
    if html_scan:
        existing_schemas = list(html_scan.schemaOrg.keys()) if html_scan.schemaOrg else []
        if existing_schemas:
            lines.append(f"\nExisting Schema.org types: {', '.join(existing_schemas)}")
        if html_scan.keywords:
            top_kw = [kw.get("keyword", kw.get("word", "")) for kw in html_scan.keywords[:10]]
            top_kw = [k for k in top_kw if k]
            if top_kw:
                lines.append(f"Top keywords from site: {', '.join(top_kw)}")

    lines.append("\nGenerate the HTML snippet now.")
    return "\n".join(lines)


_MOCK_SNIPPET = """\
<!-- GEO Optimization Snippet (mock mode) -->
<div data-geo-expertise="mock" data-geo-category="mock">
  <script type="application/ld+json">
  {"@context":"https://schema.org","@type":"Organization","name":"Mock Business"}
  </script>
  <span class="sr-only">Mock GEO optimization content for testing.</span>
</div>
"""


async def generate_llm_hijack_prompt(
    snapshot: BusinessSnapshot,
    category_scores: dict[str, CategoryScore],
    level_scores: dict[str, LevelScore],
    audit_engine_score: float,
    discoverability_threshold: DiscoverabilityThreshold,
    competitor_results: list[CompetitorResult],
    html_scan: HtmlScanResult | None,
) -> str | None:
    """Generate an LLM hijack HTML snippet using GPT-4o.

    Returns the raw HTML string, or None on failure.
    Non-blocking — failures are logged and swallowed.
    """
    try:
        if app_config.MOCK_AI:
            logger.info("LLM hijack generator: returning mock snippet")
            return _MOCK_SNIPPET

        user_prompt = _build_user_prompt(
            snapshot=snapshot,
            category_scores=category_scores,
            level_scores=level_scores,
            audit_engine_score=audit_engine_score,
            discoverability_threshold=discoverability_threshold,
            competitor_results=competitor_results,
            html_scan=html_scan,
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
                logger.warning("LLM hijack generator: OPENAI_API_KEY not set")
                return None

            result = await asyncio.to_thread(
                call_openai_api,
                api_key,
                user_prompt,
                "gpt-4o",
                conversation_history=conversation_history,
                use_web_search=False,
            )

        if result.get("success") and result.get("response"):
            html = result["response"].strip()
            # Strip markdown fences if the model wraps the output
            if html.startswith("```"):
                lines = html.split("\n")
                # Remove first and last fence lines
                if lines[-1].strip() == "```":
                    lines = lines[1:-1]
                else:
                    lines = lines[1:]
                html = "\n".join(lines)
            logger.info(f"LLM hijack snippet generated ({len(html)} chars)")
            return html

        logger.warning(f"LLM hijack generator: AI call failed — {result.get('error', 'unknown')}")
        return None

    except Exception as e:
        logger.warning(f"LLM hijack generator failed: {e}")
        return None
