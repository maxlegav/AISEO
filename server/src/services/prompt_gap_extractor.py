"""
Phase B — Prompt Gap Extractor.

Identifies unanswered questions (prompts where the business is never mentioned)
and prioritizes them by weakest category. Pure Python, no LLM calls ($0 cost).
"""

from __future__ import annotations

from models.audit import CategoryScore, PromptGap, PromptGapsSummary, PromptResult


def extract_prompt_gaps(
    prompt_results: list[PromptResult],
    category_scores: dict[str, CategoryScore],
    *,
    max_gaps: int = 10,
    max_per_category: int = 3,
) -> tuple[list[PromptGap], PromptGapsSummary]:
    """Identify prompts where the business got zero mentions and prioritize them.

    Logic:
    1. Collect all level 2-3 prompts with mentionRate == 0 (the actionable middle).
    2. Sort categories by score ascending → take 3 weakest.
    3. From each weak category, take up to max_per_category gap questions.
    4. Fill remaining slots with other gaps, cap at max_gaps total.
    5. Return (prioritized_gaps, summary).
    """
    # 1. Collect gap prompts (level 2-3, mentionRate == 0)
    all_gaps: list[PromptGap] = []
    for pr in prompt_results:
        if pr.level in (2, 3) and pr.mentionRate == 0.0:
            all_gaps.append(PromptGap(
                promptId=pr.promptId,
                question=pr.question,
                level=pr.level,
                category=pr.category,
                mentionRate=pr.mentionRate,
            ))

    if not all_gaps:
        return [], PromptGapsSummary()

    # 2. Find weakest categories by score ascending
    sorted_cats = sorted(
        category_scores.items(),
        key=lambda item: item[1].score,
    )
    weakest_cats = [cat for cat, _score in sorted_cats[:3]]

    # 3. Prioritize gaps from weakest categories
    prioritized: list[PromptGap] = []
    used_ids: set[int] = set()

    for cat in weakest_cats:
        cat_gaps = [g for g in all_gaps if g.category == cat]
        for gap in cat_gaps[:max_per_category]:
            if len(prioritized) >= max_gaps:
                break
            prioritized.append(gap)
            used_ids.add(gap.promptId)

    # 4. Fill remaining slots with other gaps
    remaining = [g for g in all_gaps if g.promptId not in used_ids]
    for gap in remaining:
        if len(prioritized) >= max_gaps:
            break
        prioritized.append(gap)

    # 5. Build summary
    summary = PromptGapsSummary(
        totalGaps=len(all_gaps),
        prioritizedCount=len(prioritized),
        weakestCategories=weakest_cats,
    )

    return prioritized, summary
