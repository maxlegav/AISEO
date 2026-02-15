"""
Scoring Pipeline — Full audit score calculation.

Implements all scoring formulas from audit-engine-spec.md sections 7-9, 13:
- Response score (quality × position multiplier)
- Prompt score (aggregation across engines)
- Category scores (weighted)
- Level scores
- Audit Engine Score (0-100)
- Discoverability threshold
- GEO Score (70/30)
- Competitor scoring
"""

import logging

from models.audit import (
    EngineResult,
    PromptResult,
    CategoryScore,
    LevelScore,
    CompetitorResult,
    DiscoverabilityThreshold,
)
from config import CATEGORY_WEIGHTS, LEVEL_DESCRIPTIONS, DISCOVERABILITY_THRESHOLD
from services.mention_detector import detect_mention

logger = logging.getLogger(__name__)

# Position multipliers (from audit-engine-spec.md section 7)
POSITION_MULTIPLIERS = {
    1: 1.5,   # Rank 1 = maximum visibility
}
# Rank 2-3 = 1.0, Rank 4+ = 0.7, Not mentioned = 0.0

# Max score per response = quality(3) × multiplier(1.5) = 4.5
MAX_RESPONSE_SCORE = 4.5


def _get_position_multiplier(position: int) -> float:
    """Get the position multiplier for a given rank."""
    if position == 0:
        return 0.0  # Not mentioned
    if position == 1:
        return 1.5
    if position <= 3:
        return 1.0
    return 0.7


def calculate_response_score(quality: int, position: int) -> float:
    """
    Per-response score: quality × positionMultiplier.

    Max score = 3 × 1.5 = 4.5
    """
    return quality * _get_position_multiplier(position)


def calculate_prompt_score(engine_results: dict[str, EngineResult]) -> tuple[float, float]:
    """
    Per-prompt aggregation across engines.

    Returns:
        (promptScore: 0.0-1.0, mentionRate: 0.0-1.0)
    """
    engines_responded = 0
    engines_mentioned = 0
    total_response_score = 0.0

    for engine_name, result in engine_results.items():
        if result.error is not None:
            continue  # Skip failed engines

        engines_responded += 1

        if result.mentioned:
            engines_mentioned += 1
            total_response_score += calculate_response_score(result.quality, result.position)

    if engines_responded == 0:
        return 0.0, 0.0

    prompt_score = total_response_score / (engines_responded * MAX_RESPONSE_SCORE)
    mention_rate = engines_mentioned / engines_responded

    return round(prompt_score, 4), round(mention_rate, 4)


def calculate_category_scores(prompt_results: list[PromptResult]) -> dict[str, CategoryScore]:
    """Group prompt results by category and calculate average scores."""
    category_data: dict[str, list[PromptResult]] = {}

    for pr in prompt_results:
        category_data.setdefault(pr.category, []).append(pr)

    scores = {}
    for category, prompts in category_data.items():
        avg_score = sum(p.promptScore for p in prompts) / len(prompts) if prompts else 0.0
        avg_mention = sum(p.mentionRate for p in prompts) / len(prompts) if prompts else 0.0
        scores[category] = CategoryScore(
            score=round(avg_score, 4),
            promptCount=len(prompts),
            avgMentionRate=round(avg_mention, 4),
        )

    return scores


def calculate_level_scores(prompt_results: list[PromptResult]) -> dict[str, LevelScore]:
    """Group prompt results by level and calculate average scores."""
    level_data: dict[int, list[PromptResult]] = {}

    for pr in prompt_results:
        level_data.setdefault(pr.level, []).append(pr)

    scores = {}
    for level, prompts in level_data.items():
        avg_score = sum(p.promptScore for p in prompts) / len(prompts) if prompts else 0.0
        avg_mention = sum(p.mentionRate for p in prompts) / len(prompts) if prompts else 0.0
        key = f"level{level}"
        scores[key] = LevelScore(
            score=round(avg_score, 4),
            promptCount=len(prompts),
            avgMentionRate=round(avg_mention, 4),
        )

    return scores


def calculate_audit_engine_score(category_scores: dict[str, CategoryScore]) -> float:
    """
    Weighted average of category scores → 0-100.

    Category weights: discovery=2.0, comparison=1.5, reputation=1.2,
                      product=1.0, alternative=1.5, trust=1.0
    """
    weighted_sum = 0.0
    total_weight = 0.0

    for category, weight in CATEGORY_WEIGHTS.items():
        cat_score = category_scores.get(category)
        if cat_score:
            weighted_sum += cat_score.score * weight
            total_weight += weight

    if total_weight == 0:
        return 0.0

    # Score is 0.0-1.0 from prompt scores, multiply by 100 for 0-100 range
    return round((weighted_sum / total_weight) * 100, 1)


def calculate_discoverability_threshold(
    level_scores: dict[str, LevelScore],
) -> DiscoverabilityThreshold:
    """
    Find the lowest level where avgMentionRate >= 25%.
    Per audit-engine-spec.md section 13.
    """
    for level in range(1, 6):
        key = f"level{level}"
        ls = level_scores.get(key)
        if ls and ls.avgMentionRate >= DISCOVERABILITY_THRESHOLD:
            return DiscoverabilityThreshold(
                level=level,
                description=LEVEL_DESCRIPTIONS.get(level, ""),
            )

    return DiscoverabilityThreshold(
        level=None,
        description="Not discovered — the business is invisible even when cited directly",
    )


def calculate_geo_score(
    audit_engine_score: float,
    html_scanner_score: float | None,
) -> float:
    """
    Final GEO Score = auditEngineScore × 0.70 + htmlScannerScore × 0.30.
    If HTML scanner failed (None), use audit engine score at 100% weight.
    """
    if html_scanner_score is None:
        return round(audit_engine_score, 1)

    return round(audit_engine_score * 0.70 + html_scanner_score * 0.30, 1)


def score_competitor(
    prompt_results: list[PromptResult],
    competitor_name: str,
    competitor_url: str,
) -> CompetitorResult:
    """
    Run mention detection + scoring for a competitor across all prompt results.

    Uses the raw responses already collected — just re-analyzes them for
    the competitor instead of the main business.
    """
    competitor_prompt_results: list[PromptResult] = []

    for pr in prompt_results:
        competitor_engines: dict[str, EngineResult] = {}

        for engine_name, engine_result in pr.engines.items():
            if engine_result.error is not None or not engine_result.rawResponse:
                competitor_engines[engine_name] = EngineResult(error=engine_result.error)
                continue

            # Re-run mention detection for competitor
            comp_result = detect_mention(
                engine_result.rawResponse,
                competitor_name,
                competitor_url,
            )
            # Preserve response time and raw response from original
            comp_result.responseTime = engine_result.responseTime
            competitor_engines[engine_name] = comp_result

        # Calculate competitor prompt score
        comp_prompt_score, comp_mention_rate = calculate_prompt_score(competitor_engines)

        competitor_prompt_results.append(PromptResult(
            promptId=pr.promptId,
            level=pr.level,
            category=pr.category,
            question=pr.question,
            engines=competitor_engines,
            promptScore=comp_prompt_score,
            mentionRate=comp_mention_rate,
        ))

    # Calculate competitor aggregate scores
    cat_scores = calculate_category_scores(competitor_prompt_results)
    lvl_scores = calculate_level_scores(competitor_prompt_results)
    engine_score = calculate_audit_engine_score(cat_scores)

    total_mentions = sum(pr.mentionRate for pr in competitor_prompt_results)
    avg_mention_rate = total_mentions / len(competitor_prompt_results) if competitor_prompt_results else 0.0

    return CompetitorResult(
        competitorUrl=competitor_url,
        competitorName=competitor_name,
        auditEngineScore=engine_score,
        mentionRate=round(avg_mention_rate, 4),
        categoryScores={k: v.score for k, v in cat_scores.items()},
        levelScores={k: v.score for k, v in lvl_scores.items()},
    )
