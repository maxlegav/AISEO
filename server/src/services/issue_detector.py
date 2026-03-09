"""
Phase A — Deterministic Issue Detector.

Analyzes HTML scan data and AI scores to produce a structured list of
issues / best-practice violations for improving AI visibility.
Pure if/else logic, no LLM calls ($0 cost).
"""

from __future__ import annotations

from models.audit import (
    CategoryScore,
    DetectedIssue,
    DiscoverabilityThreshold,
    HtmlScanResult,
    IssuesSummary,
    LevelScore,
)

# Severity ordering for sort (lower = higher priority)
_SEVERITY_ORDER = {"critical": 0, "high": 1, "medium": 2, "low": 3}
_TYPE_ORDER = {"technical": 0, "accessibility": 1, "schema": 2, "content": 3, "meta": 4}

# Organization-like schema types
_ORG_SCHEMA_TYPES = {
    "Organization", "LocalBusiness", "ProfessionalService",
    "Corporation", "GovernmentOrganization", "NGO",
    "EducationalOrganization", "MedicalOrganization",
    "SportsOrganization", "Restaurant", "Store", "Hotel",
    "FinancialService", "LegalService", "RealEstateAgent",
}


def detect_issues(
    html_scan: HtmlScanResult | None,
    category_scores: dict[str, CategoryScore],
    level_scores: dict[str, LevelScore],
    audit_engine_score: float,
    discoverability_threshold: DiscoverabilityThreshold,
) -> tuple[list[DetectedIssue], IssuesSummary]:
    """Run all detection rules and return sorted issues + summary."""
    issues: list[DetectedIssue] = []

    # Layer 1: Scanner data aggregation
    if html_scan is not None:
        issues.extend(_layer1_scanner_rules(html_scan, category_scores))

    # Layer 2: Cross-referencing AI scores
    issues.extend(_layer2_score_rules(
        category_scores, level_scores, discoverability_threshold,
    ))

    # Layer 3: Severity escalation
    if audit_engine_score < 20:
        for issue in issues:
            if issue.severity == "high" and issue.source == "detector":
                issue.severity = "critical"

    # Sort: severity (critical first), then type (technical first)
    issues.sort(key=lambda i: (_SEVERITY_ORDER.get(i.severity, 9), _TYPE_ORDER.get(i.type, 9)))

    summary = _build_summary(issues)
    return issues, summary


# ---------------------------------------------------------------------------
# Layer 1: Scanner-based rules
# ---------------------------------------------------------------------------

def _layer1_scanner_rules(
    scan: HtmlScanResult,
    category_scores: dict[str, CategoryScore],
) -> list[DetectedIssue]:
    issues: list[DetectedIssue] = []

    # --- robots.txt ---
    robots = scan.robotsTxtAnalysis
    if robots.get("exists") is False:
        issues.append(DetectedIssue(
            id="no_robots_txt",
            type="technical",
            severity="high",
            title="No robots.txt found",
            description="Your website does not have a robots.txt file, which helps search engines and AI crawlers understand which pages to access.",
            aiImpact="AI crawlers may not efficiently discover your content without robots.txt directives.",
            source="scanner",
        ))
    if robots.get("blanketDisallow") is True:
        issues.append(DetectedIssue(
            id="robots_blanket_disallow",
            type="technical",
            severity="critical",
            title="robots.txt blocks all crawlers",
            description="Your robots.txt contains a blanket Disallow rule that prevents all crawlers from accessing your site.",
            aiImpact="AI models cannot crawl or index any of your content, making you invisible to AI-powered search.",
            source="scanner",
        ))
    ai_bots_blocked = robots.get("aiBotsBlocked", [])
    if len(ai_bots_blocked) > 0:
        bot_names = ", ".join(ai_bots_blocked[:5])
        issues.append(DetectedIssue(
            id="robots_ai_bots_blocked",
            type="accessibility",
            severity="high",
            title="AI bots blocked in robots.txt",
            description=f"Your robots.txt explicitly blocks AI crawlers: {bot_names}.",
            aiImpact="Blocked AI bots cannot crawl your site, reducing your visibility in AI-generated responses.",
            source="scanner",
        ))

    # --- llms.txt ---
    llms = scan.llmsTxtAnalysis
    if llms.get("exists") is False:
        issues.append(DetectedIssue(
            id="no_llms_txt",
            type="technical",
            severity="high",
            title="No llms.txt found",
            description="Your website does not have an llms.txt file, which provides structured information specifically for large language models.",
            aiImpact="LLMs miss a dedicated source of structured business information, reducing accuracy of AI responses about you.",
            source="scanner",
        ))
    elif llms.get("exists") is True and len(llms.get("issues", [])) > 0:
        llms_issues = llms.get("issues", [])
        issues.append(DetectedIssue(
            id="llms_txt_incomplete",
            type="technical",
            severity="medium",
            title="llms.txt has issues",
            description=f"Your llms.txt file exists but has {len(llms_issues)} issue(s): {llms_issues[0]}.",
            aiImpact="An incomplete llms.txt may provide inaccurate or insufficient information to AI models.",
            source="scanner",
        ))

    # --- sitemap ---
    sitemap = scan.sitemapAnalysis
    if sitemap.get("exists") is False:
        issues.append(DetectedIssue(
            id="no_sitemap",
            type="technical",
            severity="medium",
            title="No sitemap.xml found",
            description="Your website does not have a sitemap.xml, making it harder for crawlers to discover all your pages.",
            aiImpact="AI crawlers may miss important pages that could contribute to better AI representation.",
            source="scanner",
        ))

    # --- schema.org ---
    schema_org = scan.schemaOrg
    detected_types = set(schema_org.get("detectedTypes", []))

    has_org_schema = bool(detected_types & _ORG_SCHEMA_TYPES)
    if not has_org_schema:
        issues.append(DetectedIssue(
            id="no_organization_schema",
            type="schema",
            severity="high",
            title="No Organization schema markup",
            description="Your website lacks Organization (or LocalBusiness/ProfessionalService) structured data.",
            aiImpact="AI models rely on schema.org markup to understand your business identity, contact info, and services.",
            source="scanner",
        ))

    has_faq = "FAQPage" in detected_types
    if not has_faq:
        discovery_cat = category_scores.get("discovery")
        is_critical = discovery_cat is not None and discovery_cat.score < 0.40
        if is_critical:
            severity = "critical"
            issue_id = "no_faq_schema_critical"
        else:
            severity = "high"
            issue_id = "no_faq_schema"

        issues.append(DetectedIssue(
            id=issue_id,
            type="schema",
            severity=severity,
            title="No FAQ schema markup",
            description="Your website lacks FAQPage structured data, which is highly valuable for AI visibility.",
            aiImpact="FAQ schema directly feeds AI models with question-answer pairs about your business.",
            source="scanner",
        ))

    missing_recommended = schema_org.get("missingRecommended", [])
    # Filter out FAQ and Organization types already handled above
    filtered_missing = [
        m for m in missing_recommended
        if m not in ("FAQPage", "Organization", "LocalBusiness", "ProfessionalService")
        and m not in _ORG_SCHEMA_TYPES
    ]
    if filtered_missing:
        issues.append(DetectedIssue(
            id="missing_recommended_schema",
            type="schema",
            severity="medium",
            title="Missing recommended schema types",
            description=f"Recommended schema types not found: {', '.join(filtered_missing[:5])}.",
            aiImpact="Additional schema markup helps AI models build a richer understanding of your offerings.",
            source="scanner",
        ))

    # --- meta tags ---
    meta = scan.metaTags
    description = meta.get("description", "")
    if not description or len(description) < 100:
        issues.append(DetectedIssue(
            id="weak_meta_description",
            type="meta",
            severity="medium",
            title="Weak or missing meta description",
            description="Your meta description is missing or too short (under 100 characters).",
            aiImpact="Meta descriptions help AI models understand page purpose and may be used in AI-generated summaries.",
            source="scanner",
        ))

    meta_issues = meta.get("issues", [])
    has_missing_title = any("Missing <title>" in issue or "missing <title>" in issue.lower() for issue in meta_issues)
    if has_missing_title:
        issues.append(DetectedIssue(
            id="missing_meta_title",
            type="meta",
            severity="high",
            title="Missing page title",
            description="Your page is missing a <title> tag, which is essential for identification by search engines and AI.",
            aiImpact="Without a title, AI models cannot properly identify or reference your page.",
            source="scanner",
        ))

    # --- heading structure ---
    headings = scan.headingStructure
    heading_issues = headings.get("issues", [])
    if len(heading_issues) > 0:
        issues.append(DetectedIssue(
            id="heading_structure_issues",
            type="meta",
            severity="medium",
            title="Heading structure issues",
            description=f"Found {len(heading_issues)} heading structure issue(s): {heading_issues[0]}.",
            aiImpact="Proper heading hierarchy helps AI models parse and understand your content structure.",
            source="scanner",
        ))

    # --- image alt text ---
    img_alt = scan.imageAltText
    compliance = img_alt.get("compliance")
    if compliance is not None and compliance < 50:
        issues.append(DetectedIssue(
            id="low_image_alt_compliance",
            type="meta",
            severity="medium",
            title="Low image alt text compliance",
            description=f"Only {compliance}% of images have alt text. Best practice is above 90%.",
            aiImpact="Alt text helps AI models understand visual content and improves overall content comprehension.",
            source="scanner",
        ))

    # --- AI bot accessibility ---
    ai_bot = scan.aiBotAccessibility
    accessibility_score = ai_bot.get("accessibilityScore")
    if accessibility_score is not None and accessibility_score < 50:
        issues.append(DetectedIssue(
            id="low_ai_bot_accessibility",
            type="accessibility",
            severity="high",
            title="Low AI bot accessibility score",
            description=f"AI bot accessibility score is {accessibility_score}/100. Many AI crawlers cannot reach your site.",
            aiImpact="If AI bots cannot access your site, your content won't appear in AI-generated responses.",
            source="scanner",
        ))

    return issues


# ---------------------------------------------------------------------------
# Layer 2: Cross-referencing AI scores
# ---------------------------------------------------------------------------

def _layer2_score_rules(
    category_scores: dict[str, CategoryScore],
    level_scores: dict[str, LevelScore],
    threshold: DiscoverabilityThreshold,
) -> list[DetectedIssue]:
    issues: list[DetectedIssue] = []

    # low_brand_awareness: L1 mention < 0.20 AND L5 mention > 0.60
    l1 = level_scores.get("1") or level_scores.get(1)
    l5 = level_scores.get("5") or level_scores.get(5)
    if l1 and l5 and l1.avgMentionRate < 0.20 and l5.avgMentionRate > 0.60:
        issues.append(DetectedIssue(
            id="low_brand_awareness",
            type="content",
            severity="critical",
            title="Low brand awareness in AI",
            description="AI models know about your niche but rarely mention your brand directly. You're recognized at specific query levels but not at broad brand-awareness queries.",
            aiImpact="Users asking general questions about your industry won't be directed to your business.",
            source="detector",
        ))

    # weak_comparison_visibility
    comparison = category_scores.get("comparison")
    if comparison and comparison.score < 0.25:
        issues.append(DetectedIssue(
            id="weak_comparison_visibility",
            type="content",
            severity="high",
            title="Weak comparison visibility",
            description=f"Your comparison score is {comparison.score:.0%}. AI models rarely include you in competitive comparisons.",
            aiImpact="When users ask AI to compare options in your category, you're often left out.",
            source="detector",
        ))

    # weak_reputation_score
    reputation = category_scores.get("reputation")
    if reputation and reputation.score < 0.30:
        severity = "high" if reputation.score < 0.15 else "medium"
        issues.append(DetectedIssue(
            id="weak_reputation_score",
            type="content",
            severity=severity,
            title="Weak reputation in AI responses",
            description=f"Your reputation score is {reputation.score:.0%}. AI models don't associate strong credibility with your brand.",
            aiImpact="Trust-related queries about your business yield weak or absent AI responses.",
            source="detector",
        ))

    # invisible_to_ai
    if threshold.level is None:
        issues.append(DetectedIssue(
            id="invisible_to_ai",
            type="content",
            severity="critical",
            title="Invisible to AI models",
            description="AI models do not mention your business at any specificity level. You are effectively invisible to AI-powered search.",
            aiImpact="No matter how users phrase their queries, AI will not recommend or mention your business.",
            source="detector",
        ))

    # late_discovery_only
    if threshold.level is not None and threshold.level >= 4:
        issues.append(DetectedIssue(
            id="late_discovery_only",
            type="content",
            severity="high",
            title="Only discovered at high specificity",
            description=f"AI models only mention your business at specificity level {threshold.level}+. You need very specific queries to appear.",
            aiImpact="Most users won't phrase queries specifically enough to trigger a mention of your business.",
            source="detector",
        ))

    return issues


# ---------------------------------------------------------------------------
# Summary builder
# ---------------------------------------------------------------------------

def _build_summary(issues: list[DetectedIssue]) -> IssuesSummary:
    counts = {"critical": 0, "high": 0, "medium": 0, "low": 0}
    for issue in issues:
        if issue.severity in counts:
            counts[issue.severity] += 1
    return IssuesSummary(
        criticalCount=counts["critical"],
        highCount=counts["high"],
        mediumCount=counts["medium"],
        lowCount=counts["low"],
        totalCount=len(issues),
    )
