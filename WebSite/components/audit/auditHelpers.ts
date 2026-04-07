// ─── Shared helpers & constants for audit components ─────────────────────────

import type { HtmlScanRecord, HtmlScan, SignalItem } from "./auditTypes";

export function scoreColor(score: number): string {
  if (score >= 70) return "#10b981";
  if (score >= 40) return "#f97316";
  return "#ef4444";
}

export function scoreLabel(score: number): string {
  if (score >= 70) return "GOOD";
  if (score >= 40) return "MODERATE";
  return "CRITICAL";
}

export function scoreTextClass(score: number): string {
  if (score >= 70) return "text-emerald-600";
  if (score >= 40) return "text-orange-500";
  return "text-red-500";
}

export function scoreBarClass(score: number): string {
  if (score >= 70) return "bg-emerald-500";
  if (score >= 40) return "bg-orange-500";
  return "bg-red-500";
}

export function pct(val: number): number {
  return Math.round(val * 100);
}

export function getBool(obj: HtmlScanRecord | undefined, key: string): boolean | undefined {
  const val = obj?.[key];
  return typeof val === "boolean" ? val : undefined;
}

export function getString(obj: HtmlScanRecord | undefined, key: string): string | undefined {
  const val = obj?.[key];
  return typeof val === "string" ? val : undefined;
}

export function getNumber(obj: HtmlScanRecord | undefined, key: string): number | undefined {
  const val = obj?.[key];
  return typeof val === "number" ? val : undefined;
}

export const CATEGORY_META: Record<string, { label: string; bar: string; pill: string }> = {
  discovery:   { label: "Discovery",   bar: "bg-blue-500",    pill: "bg-blue-50 text-blue-700" },
  comparison:  { label: "Comparison",  bar: "bg-purple-500",  pill: "bg-purple-50 text-purple-700" },
  reputation:  { label: "Reputation",  bar: "bg-amber-500",   pill: "bg-amber-50 text-amber-700" },
  product:     { label: "Product",     bar: "bg-teal-500",    pill: "bg-teal-50 text-teal-700" },
  alternative: { label: "Alternative", bar: "bg-orange-500",  pill: "bg-orange-50 text-orange-700" },
  trust:       { label: "Trust",       bar: "bg-emerald-500", pill: "bg-emerald-50 text-emerald-700" },
};

export const LEVEL_COLORS = [
  "bg-emerald-500", "bg-green-500", "bg-yellow-500", "bg-orange-500", "bg-red-500",
];
export const LEVEL_TEXT = [
  "text-emerald-600", "text-green-600", "text-yellow-600", "text-orange-600", "text-red-600",
];
export const LEVEL_LABELS: Record<number, string> = {
  1: "Broad queries",
  2: "Niche market",
  3: "Descriptive",
  4: "Very specific",
  5: "By name only",
};

export const ENGINE_ABBR: Record<string, string> = {
  chatgpt:    "GPT",
  claude:     "CLN",
  perplexity: "PPX",
  gemini:     "GEM",
};

// ─── Build signal items from HTML scan ───────────────────────────────────────

export function buildSignalItems(htmlScan: HtmlScan): SignalItem[] {
  const items: SignalItem[] = [];

  const schema = htmlScan.schemaOrg ?? {};
  const meta = htmlScan.metaTags ?? {};
  const robots = htmlScan.robotsTxtAnalysis ?? {};
  const sitemap = htmlScan.sitemapAnalysis ?? {};
  const llmsTxt = htmlScan.llmsTxtAnalysis ?? {};
  const headings = htmlScan.headingStructure ?? {};
  const altText = htmlScan.imageAltText ?? {};

  // 1. robots.txt
  const robotsExists = getBool(robots, "exists") ?? getBool(robots, "found");
  if (robotsExists != null) {
    const blanketDisallow = getBool(robots, "blanketDisallow") === true;
    const aiBotsBlocked = robots["aiBotsBlocked"];
    const hasBlockedBots = Array.isArray(aiBotsBlocked) && aiBotsBlocked.length > 0;
    const robotsPass = robotsExists === true && !blanketDisallow && !hasBlockedBots;

    items.push({
      id: "signal_robots_txt",
      pass: robotsPass,
      issueId: "no_robots_txt",
      relatedIssueIds: ["robots_blanket_disallow", "robots_ai_bots_blocked"],
      type: "technical",
      severity: "high",
      title: "robots.txt — AI crawlers allowed",
      description: robotsPass
        ? "Your robots.txt allows AI crawlers to access your site."
        : !robotsExists
          ? "Without robots.txt, AI crawlers like GPTBot and ClaudeBot don't know they're allowed to crawl your site."
          : blanketDisallow
            ? "Your robots.txt blocks all crawlers with a blanket Disallow rule."
            : "Your robots.txt blocks specific AI crawlers from accessing your site.",
      aiImpact: "AI crawlers may skip your site entirely, preventing you from appearing in AI-generated responses.",
    });
  }

  // 2. llms.txt
  const llmsExists = getBool(llmsTxt, "exists") ?? getBool(llmsTxt, "found");
  if (llmsExists != null) {
    const llmsIssues = llmsTxt["issues"];
    const hasLlmsIssues = Array.isArray(llmsIssues) && llmsIssues.length > 0;
    const llmsPass = llmsExists === true && !hasLlmsIssues;

    items.push({
      id: "signal_llms_txt",
      pass: llmsPass,
      issueId: "no_llms_txt",
      relatedIssueIds: ["llms_txt_incomplete"],
      type: "technical",
      severity: "high",
      title: "llms.txt — AI context file",
      description: llmsPass
        ? "Your llms.txt provides AI engines with structured business information."
        : !llmsExists
          ? "llms.txt tells AI engines what your site is about in plain language. Without it, AI models have no structured source of truth about your business."
          : "Your llms.txt file exists but has issues that may reduce its effectiveness for AI engines.",
      aiImpact: "LLMs miss a dedicated source of structured business information, reducing accuracy of AI responses about you.",
    });
  }

  // 3. sitemap.xml
  const sitemapPass = getBool(sitemap, "exists") ?? getBool(sitemap, "found");
  if (sitemapPass != null) {
    items.push({
      id: "signal_sitemap",
      pass: sitemapPass,
      issueId: "no_sitemap",
      type: "technical",
      severity: "medium",
      title: "sitemap.xml",
      description: "A sitemap helps both search engines and AI crawlers discover all pages on your site.",
      aiImpact: "Without it, important pages about your services may never be indexed by AI crawlers.",
    });
  }

  // 4. FAQPage schema
  const faqPass = getBool(schema, "hasFAQ");
  if (faqPass != null) {
    items.push({
      id: "signal_faq_schema",
      pass: faqPass,
      issueId: "no_faq_schema",
      relatedIssueIds: ["no_faq_schema_critical"],
      type: "schema",
      severity: "high",
      title: "FAQPage schema markup",
      description: "FAQPage schema lets AI engines read your Q&A content directly and cite it in responses.",
      aiImpact: "One of the highest-impact signals for appearing in AI answers to user questions.",
    });
  }

  // 5. Organization schema
  const orgPass = getBool(schema, "hasOrganization");
  if (orgPass != null) {
    items.push({
      id: "signal_org_schema",
      pass: orgPass,
      issueId: "no_organization_schema",
      type: "schema",
      severity: "high",
      title: "Organization schema markup",
      description: "Organization schema gives AI engines structured facts about your business: name, description, URL, contact info.",
      aiImpact: "Without it, AI engines may describe your business inaccurately.",
    });
  }

  // 6. Meta description
  const description = getString(meta, "description") ?? "";
  const metaPass = description.length >= 100;
  items.push({
    id: "signal_meta_description",
    pass: metaPass,
    issueId: "weak_meta_description",
    type: "meta",
    severity: "medium",
    title: "Meta description (100+ chars)",
    description: metaPass
      ? `Your meta description is ${description.length} characters — good length for AI citation.`
      : `Your meta description ${description ? `is only ${description.length} characters — too short` : "is missing"}. AI engines often cite the meta description verbatim.`,
    aiImpact: "A short or missing meta description means AI engines may describe your business incorrectly.",
    info: description ? `${description.length} chars` : undefined,
  });

  // 7. Single H1 heading
  const h1Count = getNumber(headings, "h1Count") ?? getNumber(headings, "h1");
  if (h1Count != null) {
    const h1Pass = h1Count === 1;
    items.push({
      id: "signal_h1_heading",
      pass: h1Pass,
      issueId: "heading_structure_issues",
      type: "meta",
      severity: "medium",
      title: "Single H1 heading",
      description: h1Pass
        ? "Your page has exactly one H1 heading — correct structure."
        : h1Count === 0
          ? "No H1 tag found. The H1 is the strongest signal of what a page is about."
          : `${h1Count} H1 tags found (should be exactly 1). Multiple H1s confuse AI crawlers about your page's main topic.`,
      aiImpact: "Proper heading hierarchy helps AI models parse and understand your content structure.",
      info: `${h1Count} found`,
    });
  }

  // 8. Image alt text
  const missingAlt = getNumber(altText, "missing") ?? getNumber(altText, "withoutAlt") ?? getNumber(altText, "without_alt") ?? 0;
  const totalImages = getNumber(altText, "total") ?? 0;
  if (totalImages > 0) {
    const altCompliance = ((totalImages - missingAlt) / totalImages) >= 0.9;
    items.push({
      id: "signal_image_alt",
      pass: altCompliance,
      issueId: "low_image_alt_compliance",
      type: "meta",
      severity: "medium",
      title: "Image alt text (90%+ coverage)",
      description: altCompliance
        ? `${totalImages - missingAlt}/${totalImages} images have alt text — good coverage.`
        : `${missingAlt} image${missingAlt > 1 ? "s are" : " is"} missing alt text. Images without alt text are invisible to AI engines.`,
      aiImpact: "Alt text provides semantic context that helps AI understand your content, products, and services.",
      info: `${totalImages - missingAlt}/${totalImages} images`,
    });
  }

  // 9. AI bot accessibility
  const aiBot = htmlScan.aiBotAccessibility ?? {};
  const accessibilityScore = getNumber(aiBot, "accessibilityScore");
  if (accessibilityScore != null) {
    const aiBotPass = accessibilityScore >= 50;
    items.push({
      id: "signal_ai_bot_accessibility",
      pass: aiBotPass,
      issueId: "low_ai_bot_accessibility",
      type: "accessibility",
      severity: "high",
      title: "AI bot accessibility (50+)",
      description: aiBotPass
        ? `AI bot accessibility score is ${accessibilityScore}/100 — AI crawlers can reach your site.`
        : `AI bot accessibility score is ${accessibilityScore}/100 — many AI crawlers cannot reach your site.`,
      aiImpact: "If AI bots cannot access your site, your content won't appear in AI-generated responses.",
      info: `${accessibilityScore}/100`,
    });
  }

  // 10. Meta title
  const metaTitle = getString(meta, "title");
  if (metaTitle != null) {
    const titlePass = metaTitle.length > 0;
    items.push({
      id: "signal_meta_title",
      pass: titlePass,
      issueId: "missing_meta_title",
      type: "meta",
      severity: "high",
      title: "Page title (<title> tag)",
      description: titlePass
        ? `Your page has a title: "${metaTitle.slice(0, 60)}${metaTitle.length > 60 ? "..." : ""}"`
        : "Your page is missing a <title> tag, which is essential for identification by search engines and AI.",
      aiImpact: "Without a title, AI models cannot properly identify or reference your page.",
    });
  }

  // 11. W3C HTML validation
  const w3c = htmlScan.w3cValidation;
  if (w3c && w3c.errors != null) {
    const w3cPass = w3c.errors === 0;
    items.push({
      id: "signal_w3c_validation",
      pass: w3cPass,
      issueId: "w3c_validation_errors",
      type: "technical",
      severity: "low",
      title: "W3C HTML validation",
      description: w3cPass
        ? "Your HTML passes W3C validation with no errors."
        : `${w3c.errors} HTML validation error${w3c.errors > 1 ? "s" : ""} found. Invalid HTML may confuse AI parsers.`,
      aiImpact: "Malformed HTML can cause AI crawlers to misparse your content, missing key information.",
      info: w3cPass ? "0 errors" : `${w3c.errors} error${w3c.errors > 1 ? "s" : ""}`,
    });
  }

  // 12. Broken links
  const links = htmlScan.linkCheck;
  if (links && links.total != null && links.total > 0) {
    const brokenCount = links.failed ?? 0;
    const linksPass = brokenCount === 0;
    items.push({
      id: "signal_broken_links",
      pass: linksPass,
      issueId: "broken_links",
      type: "technical",
      severity: "medium",
      title: "No broken links",
      description: linksPass
        ? `All ${links.total} links on your page are working.`
        : `${brokenCount} broken link${brokenCount > 1 ? "s" : ""} found out of ${links.total} total. Broken links erode trust for both users and AI.`,
      aiImpact: "Broken links signal poor maintenance, which can reduce AI models' trust in your content.",
      info: linksPass ? `${links.total} OK` : `${brokenCount} broken`,
    });
  }

  return items;
}
