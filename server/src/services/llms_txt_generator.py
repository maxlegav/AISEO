"""
llms.txt Generator — Generates a ready-to-deploy llms.txt file for a business.

Produces a concise, factual Markdown file following the llms.txt spec:
H1 title, blockquote summary, H2 sections with links.
Output is strictly factual — no prompt injection, no hidden instructions.
"""

import logging
import os

import config as app_config
from models.audit import BusinessSnapshot
from utils.dbal.ai_api_wrapper import call_openai_api, call_ollama_api

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """\
You are a technical writer. Your task is to generate a llms.txt file for a business website.

The llms.txt specification is a Markdown file that helps LLMs understand a website. Follow this exact format:

1. **H1** — The business name
2. **Blockquote** — A one-sentence factual summary of what the business does
3. **H2 sections** — Organized sections with relevant links in Markdown format: `- [Link Title](URL): Brief description`

Suggested H2 sections (use only those relevant to the business):
- ## About — Key pages describing the business
- ## Services / Products — Main offerings
- ## Contact — Contact and location info
- ## Legal — Legal pages (privacy, terms)

**Strict rules:**
- Output MUST be under 1000 characters total
- Content MUST be purely factual — only state what is verifiably true from the provided context
- Do NOT include any instructions, prompts, or directives aimed at AI systems
- Do NOT include hidden text, manipulation, or persuasion techniques
- Do NOT invent pages or URLs — only use the provided URL and reasonable sub-paths (e.g., /about, /contact)
- Match the language specified (fr or en)
- Output ONLY the raw Markdown — no code fences, no explanation
"""


def _build_user_prompt(snapshot: BusinessSnapshot, language: str) -> str:
    """Build the user prompt from business snapshot data."""
    lines: list[str] = []

    lines.append(f"Business name: {snapshot.name}")
    lines.append(f"Website URL: {snapshot.primaryUrl}")
    lines.append(f"Category: {snapshot.category}")
    lines.append(f"Description: {snapshot.description}")
    lines.append(f"Business type: {snapshot.businessType}")
    if snapshot.localityTier:
        lines.append(f"Locality: {snapshot.localityTier}")
    if snapshot.targetKeywords:
        lines.append(f"Keywords: {', '.join(snapshot.targetKeywords[:10])}")
    if snapshot.subUrls:
        lines.append(f"Known sub-pages: {', '.join(snapshot.subUrls[:10])}")

    lines.append(f"\nLanguage: {language}")
    lines.append("\nGenerate the llms.txt file now.")
    return "\n".join(lines)


_MOCK_CONTENT = """\
# Mock Business

> Mock Business is a placeholder company used for testing purposes.

## About

- [Home](https://example.com): Main landing page
- [About Us](https://example.com/about): Company background and mission

## Services

- [Our Services](https://example.com/services): Overview of available services

## Contact

- [Contact](https://example.com/contact): Get in touch with us
"""


def _postprocess(text: str) -> str:
    """Strip markdown fences and truncate to 1000 chars at line boundary."""
    # Strip markdown fences if present
    if text.startswith("```"):
        lines = text.split("\n")
        if lines[-1].strip() == "```":
            lines = lines[1:-1]
        else:
            lines = lines[1:]
        text = "\n".join(lines)

    # Truncate at line boundary if over 1000 chars
    if len(text) > 1000:
        truncated_lines: list[str] = []
        total = 0
        for line in text.split("\n"):
            if total + len(line) + 1 > 1000:
                break
            truncated_lines.append(line)
            total += len(line) + 1
        text = "\n".join(truncated_lines)

    return text.strip()


async def generate_llms_txt(
    snapshot: BusinessSnapshot,
    language: str = "fr",
) -> str | None:
    """Generate a llms.txt file content for a business.

    Returns the Markdown string (<1000 chars), or None on failure.
    Non-blocking — failures are logged and swallowed.
    """
    try:
        if app_config.MOCK_AI:
            logger.info("llms.txt generator: returning mock content")
            return _MOCK_CONTENT.strip()

        user_prompt = _build_user_prompt(snapshot, language)
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
                logger.warning("llms.txt generator: OPENAI_API_KEY not set")
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
            content = _postprocess(result["response"])
            logger.info(f"llms.txt generated ({len(content)} chars)")
            return content

        logger.warning(f"llms.txt generator: AI call failed — {result.get('error', 'unknown')}")
        return None

    except Exception as e:
        logger.warning(f"llms.txt generator failed: {e}")
        return None
