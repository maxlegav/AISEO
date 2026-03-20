import { useState } from "react";
import {
  FileSearch, Target,
  Check, X, ChevronUp, ChevronDown,
} from "lucide-react";
import type {
  PromptResult, HtmlScan, CitationStats,
  CategoryScore, LevelScore,
} from "./auditTypes";
import {
  CATEGORY_META, LEVEL_COLORS, LEVEL_TEXT, LEVEL_LABELS,
  pct, scoreTextClass,
  getBool, getString, getNumber,
} from "./auditHelpers";

// ─── Signal Card ──────────────────────────────────────────────────────────────

function SignalCard({
  label,
  pass,
  info,
  failWhy,
  failFix,
}: {
  label: string;
  pass: boolean | null | undefined;
  info?: string;
  failWhy?: string;
  failFix?: string[];
}) {
  const [expanded, setExpanded] = useState(false);

  if (pass === true) {
    return (
      <div className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
        <span className="text-sm text-gray-700">{label}</span>
        <div className="flex items-center gap-2">
          {info && <span className="text-xs text-gray-400">{info}</span>}
          <Check className="w-4 h-4 text-emerald-500" />
        </div>
      </div>
    );
  }

  if (pass == null) {
    return (
      <div className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
        <span className="text-sm text-gray-400">{label}</span>
        <span className="text-xs text-gray-300">—</span>
      </div>
    );
  }

  // pass === false
  return (
    <div className="border-b border-gray-50 last:border-0">
      <button
        className="w-full flex items-center justify-between py-2.5 text-left rounded px-1 -mx-1 hover:bg-red-50/40 transition-colors"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-center gap-2">
          <X className="w-4 h-4 text-red-400 shrink-0" />
          <span className="text-sm text-gray-700">{label}</span>
          {info && <span className="text-xs text-gray-400">{info}</span>}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <span className="text-[10px] text-red-400 font-semibold">Fix →</span>
          {expanded ? (
            <ChevronUp className="w-3.5 h-3.5 text-gray-400" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
          )}
        </div>
      </button>

      {expanded && (failWhy || (failFix && failFix.length > 0)) && (
        <div className="pb-3 pl-5 space-y-2">
          {failWhy && (
            <div className="bg-orange-50 border border-orange-100 rounded-lg px-3 py-2.5">
              <p className="text-xs text-orange-900 leading-relaxed">{failWhy}</p>
            </div>
          )}
          {failFix && failFix.length > 0 && (
            <div className="bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2.5">
              <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wide mb-2">How to fix</p>
              <ol className="space-y-1.5">
                {failFix.map((step, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-emerald-900">
                    <span className="shrink-0 w-4 h-4 rounded-full bg-emerald-200 text-emerald-800 font-bold text-[10px] flex items-center justify-center mt-0.5">
                      {i + 1}
                    </span>
                    <span className="leading-relaxed">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── ═══════════════════════════════════════════════════════════ ──────────────
// ─── TAB: SITE SIGNALS (HTML SCAN) ────────────────────────────────────────────
// ─── ═══════════════════════════════════════════════════════════ ──────────────

const STOP_WORDS = new Set([
  // French
  "les", "des", "une", "est", "pour", "que", "qui", "dans", "avec", "sur",
  "par", "plus", "son", "ses", "leur", "cette", "tout", "mais", "aussi",
  "comme", "bien", "très", "plus", "avoir", "être", "faire", "notre",
  "votre", "nous", "vous", "ils", "elle", "nous", "même", "sans", "tous",
  // English
  "the", "and", "for", "are", "was", "with", "this", "that", "from",
  "have", "not", "been", "its", "they", "their", "your", "our", "about",
  "will", "more", "when", "there", "which", "than", "into",
]);

function HtmlScanTab({
  htmlScan,
  businessSnapshot,
  promptGaps,
}: {
  htmlScan: HtmlScan;
  businessSnapshot?: { name?: string; category?: string; description?: string; primaryUrl?: string; targetKeywords?: string[] };
  promptGaps?: { promptId: number; question: string; level: number; category: string; mentionRate: number }[];
}) {
  const schema = htmlScan.schemaOrg ?? {};
  const meta = htmlScan.metaTags ?? {};
  const robots = htmlScan.robotsTxtAnalysis ?? {};
  const sitemap = htmlScan.sitemapAnalysis ?? {};
  const llmsTxt = htmlScan.llmsTxtAnalysis ?? {};
  const headings = htmlScan.headingStructure ?? {};
  const altText = htmlScan.imageAltText ?? {};

  const description = getString(meta, "description") ?? "";
  const hasGoodDescription = description.length >= 100;
  const h1Count = getNumber(headings, "h1Count") ?? getNumber(headings, "h1");
  const missingAlt = getNumber(altText, "missing") ?? getNumber(altText, "withoutAlt") ?? getNumber(altText, "without_alt") ?? 0;
  const totalImages = getNumber(altText, "total") ?? 0;
  const altCompliance = totalImages > 0 ? ((totalImages - missingAlt) / totalImages) >= 0.9 : null;

  // Filtered keywords: remove stop words, short words, numbers
  const filteredKeywords = (htmlScan.keywords ?? [])
    .filter((kw) => kw.word.length >= 4 && !STOP_WORDS.has(kw.word.toLowerCase()) && !/^\d+$/.test(kw.word))
    .slice(0, 12);

  // ── Keywords computation ───────────────────────────────────────
  // "Missing keywords" = terms from gap questions NOT already on site
  const detectedSet = new Set(filteredKeywords.map((k) => k.word.toLowerCase()));
  const gapWordCounts: Record<string, number> = {};
  (promptGaps ?? []).forEach((gap) => {
    gap.question
      .toLowerCase()
      .split(/[\s,?.!;:]+/)
      .filter((w) => w.length >= 4 && !STOP_WORDS.has(w) && !/^\d+$/.test(w))
      .forEach((w) => { gapWordCounts[w] = (gapWordCounts[w] ?? 0) + 1; });
  });
  const missingKeywords = Object.entries(gapWordCounts)
    .filter(([w]) => !detectedSet.has(w))
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([word, count]) => ({ word, count }));

  // Brand hijack phrases (from top keywords, reframed as capture targets)
  const businessName = businessSnapshot?.name ?? "your business";
  const topKws = filteredKeywords.slice(0, 5).map((k) => k.word);
  const hijackPhrases: { text: string; type: string; hint: string }[] = [];
  if (topKws.length >= 2) {
    const [k1, k2, k3] = topKws;
    hijackPhrases.push(
      { text: `${k1} ${k2}${k3 ? ` ${k3}` : ""}`, type: "Discovery", hint: `Write a page or FAQ so AI cites ${businessName} for this query` },
      { text: `best ${k1} ${k2}`, type: "Discovery", hint: `Add a "Why choose us" section targeting this query` },
      { text: `${k1} ${k2} reviews`, type: "Reputation", hint: `Add customer testimonials and AggregateRating schema` },
      { text: `${k1} ${k2} vs alternatives`, type: "Comparison", hint: `Create a comparison page or FAQ entry` },
      { text: `how to choose ${k1} ${k2}`, type: "Trust", hint: `Create a buying guide FAQ for this query` },
      { text: `${k1} ${k2} price`, type: "Product", hint: `Add pricing info or FAQ with cost details` },
    );
  }

  return (
    <div className="space-y-6">
      {/* Signals */}
      <div>
        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Site health signals</h4>
        <p className="text-xs text-gray-400 mb-3">Click any ✗ item to see why it matters and how to fix it</p>
        <div className="bg-white rounded-xl border border-gray-100 px-4">
          <SignalCard
            label="robots.txt — AI crawlers allowed"
            pass={getBool(robots, "exists") ?? getBool(robots, "found")}
            failWhy="Without robots.txt, AI crawlers like GPTBot and ClaudeBot don't know they're allowed to crawl your site. They may skip it entirely, preventing you from appearing in AI-generated responses."
            failFix={[
              "Create a robots.txt file at your domain root (yoursite.com/robots.txt)",
              "Explicitly allow AI crawlers — the ready-to-use file is in the Action Plan above",
            ]}
          />
          <SignalCard
            label="llms.txt — AI context file"
            pass={getBool(llmsTxt, "exists") ?? getBool(llmsTxt, "found")}
            failWhy="llms.txt is the AI equivalent of robots.txt — it tells AI engines what your site is about in plain language. Without it, AI models have no structured source of truth about your business."
            failFix={[
              "Your llms.txt file is already generated — find it in the GEO Quick Wins section",
              "Upload it to your domain root: yoursite.com/llms.txt",
            ]}
          />
          <SignalCard
            label="sitemap.xml"
            pass={getBool(sitemap, "exists") ?? getBool(sitemap, "found")}
            failWhy="A sitemap helps both search engines and AI crawlers discover all pages on your site. Without it, important pages about your services may never be indexed."
            failFix={[
              "Generate a sitemap.xml with your CMS (WordPress, Shopify, Webflow have built-in options)",
              "Or use a free tool: xml-sitemaps.com",
              "Upload to yoursite.com/sitemap.xml and submit in Google Search Console",
            ]}
          />
          <SignalCard
            label="FAQPage schema markup"
            pass={getBool(schema, "hasFAQ")}
            failWhy="FAQPage schema lets AI engines read your Q&A content directly and cite it in responses. It's one of the highest-impact signals for appearing in AI answers to user questions."
            failFix={[
              "Your GEO HTML Snippet (in Quick Wins above) already includes FAQ schema — copy and add it to your page's <head>",
              "For individual gaps, use the FAQ templates in the Action Plan section",
            ]}
          />
          <SignalCard
            label="Organization schema markup"
            pass={getBool(schema, "hasOrganization")}
            failWhy="Organization schema gives AI engines structured facts about your business: name, description, URL, contact info. Without it, they have to guess — and may describe your business inaccurately."
            failFix={[
              'Add Organization JSON-LD to your homepage <head> (see template in Action Plan)',
              "Include: name, description, url, and sameAs (your LinkedIn, Twitter, etc.)",
            ]}
          />
          <SignalCard
            label="Meta description (100+ chars)"
            pass={hasGoodDescription}
            info={description ? `${description.length} chars` : undefined}
            failWhy={`Your current meta description ${description ? `is only ${description.length} characters — too short` : "is missing"}. AI engines often cite the meta description verbatim when recommending a site. A short or missing one means they improvise, and may describe your business incorrectly.`}
            failFix={[
              "Write a 150–160 character meta description for your homepage",
              "Include: what you do, who you serve, your main differentiator",
              'Add it in your <head>: <meta name="description" content="Your description here" />',
            ]}
          />
          {h1Count !== null && (
            <SignalCard
              label="Single H1 heading"
              pass={h1Count === 1}
              info={`${h1Count} found`}
              failWhy={
                h1Count === 0
                  ? "No H1 tag found. The H1 is the strongest signal of what a page is about — both for search engines and AI crawlers. Without it, your page's main topic is unclear."
                  : `${h1Count} H1 tags found (should be exactly 1). Multiple H1s confuse both search engines and AI crawlers about your page's main topic.`
              }
              failFix={[
                "Ensure each page has exactly one <h1> tag describing the page's main topic",
                "Use <h2> for sections, <h3> for subsections — never skip heading levels",
                "The H1 should clearly state what the business does (not just the brand name)",
              ]}
            />
          )}
          {totalImages > 0 && (
            <SignalCard
              label="Image alt text (90%+ coverage)"
              pass={altCompliance}
              info={`${totalImages - missingAlt}/${totalImages} images`}
              failWhy={`${missingAlt} image${missingAlt > 1 ? "s are" : " is"} missing alt text. Images without alt text are invisible to AI engines. Alt text provides semantic context that helps AI understand your content, products, and services.`}
              failFix={[
                "Add descriptive alt text to all images: describe what's in the image",
                'For products: alt="Blue ceramic mug 350ml". For team photos: alt="John, CEO at [Company]"',
                'For purely decorative images: use alt="" (empty, not missing)',
              ]}
            />
          )}
        </div>
      </div>

      {/* Keywords */}
      {(filteredKeywords.length > 0 || missingKeywords.length > 0) && (
        <div className="space-y-5">
          {/* Detected keywords */}
          {filteredKeywords.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Keywords your site covers</h4>
              <p className="text-xs text-gray-400 mb-3">AI engines associate these topics with your site — they appear in your content</p>
              <div className="flex flex-wrap gap-1.5">
                {filteredKeywords.map((kw) => (
                  <span key={kw.word} className="px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded-full text-xs font-medium border border-emerald-100">
                    {kw.word}
                    <span className="ml-1.5 text-emerald-500 text-[10px]">{kw.count}×</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Missing keywords */}
          {missingKeywords.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Keywords to add to your site</h4>
              <p className="text-xs text-gray-400 mb-3">These terms appear in unanswered AI queries — your site doesn&apos;t mention them, which is why you&apos;re not cited</p>
              <div className="flex flex-wrap gap-1.5">
                {missingKeywords.map((kw) => (
                  <span key={kw.word} className="px-2.5 py-1 bg-red-50 text-red-800 rounded-full text-xs font-medium border border-red-100">
                    {kw.word}
                    <span className="ml-1.5 text-red-400 text-[10px]">{kw.count}×</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Brand hijack queries */}
          {hijackPhrases.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Capture these AI queries for {businessName}</h4>
              <p className="text-xs text-gray-400 mb-3">For each phrase below, create content or a FAQ answer — this trains AI engines to cite {businessName} when users ask these questions</p>
              <div className="space-y-1.5">
                {hijackPhrases.map((phrase, i) => {
                  const typeColors: Record<string, string> = {
                    Discovery: "border-blue-100 bg-blue-50",
                    Reputation: "border-purple-100 bg-purple-50",
                    Comparison: "border-orange-100 bg-orange-50",
                    Trust: "border-emerald-100 bg-emerald-50",
                    Product: "border-gray-100 bg-gray-50",
                  };
                  const badgeColors: Record<string, string> = {
                    Discovery: "bg-blue-100 text-blue-700",
                    Reputation: "bg-purple-100 text-purple-700",
                    Comparison: "bg-orange-100 text-orange-700",
                    Trust: "bg-emerald-100 text-emerald-700",
                    Product: "bg-gray-100 text-gray-700",
                  };
                  return (
                    <div key={i} className={`rounded-xl border px-4 py-3 ${typeColors[phrase.type] ?? "border-gray-100 bg-gray-50"}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 mb-0.5">&quot;{phrase.text}&quot;</p>
                          <p className="text-xs text-gray-500">{phrase.hint}</p>
                        </div>
                        <span className={`shrink-0 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${badgeColors[phrase.type] ?? "bg-gray-100 text-gray-600"}`}>
                          {phrase.type}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}


// ─── ═══════════════════════════════════════════════════════════ ──────────────
// ─── TAB: PERFORMANCE ─────────────────────────────────────────────────────────
// ─── ═══════════════════════════════════════════════════════════ ──────────────

function PerformanceTab({
  categoryScores,
  levelScores,
}: {
  categoryScores: Record<string, CategoryScore>;
  levelScores: Record<string, LevelScore>;
}) {
  return (
    <div>
      {Object.keys(categoryScores).length > 0 && (() => {
        const sorted = Object.entries(categoryScores).sort(([, a], [, b]) => b.score - a.score);
        const best = sorted[0];
        const worst = sorted[sorted.length - 1];
        if (!best || !worst) return null;
        const bestPct = Math.round(best[1].score * 100);
        const worstPct = Math.round(worst[1].score * 100);
        const bestMeta = CATEGORY_META[best[0]] ?? { label: best[0] };
        const worstMeta = CATEGORY_META[worst[0]] ?? { label: worst[0] };
        return (
          <div className="bg-gray-50 rounded-xl px-4 py-3 mb-6 flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
              <span className="text-xs text-gray-600">
                <span className="font-semibold">{bestMeta.label}</span> is your strongest category at <span className="font-bold text-emerald-600">{bestPct}%</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
              <span className="text-xs text-gray-600">
                <span className="font-semibold">{worstMeta.label}</span> needs the most work at <span className="font-bold text-red-500">{worstPct}%</span>
              </span>
            </div>
          </div>
        );
      })()}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Category Scores */}
        {Object.keys(categoryScores).length > 0 && (
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-4">By Query Category</p>
            {Object.entries(categoryScores)
              .sort(([, a], [, b]) => b.score - a.score)
              .map(([cat, data]) => {
                const meta = CATEGORY_META[cat] ?? { label: cat, bar: "bg-gray-400", pill: "bg-gray-50 text-gray-700" };
                const scorePct = pct(data.score);
                const mentionPct = pct(data.avgMentionRate);
                return (
                  <div key={cat} className="mb-4">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${meta.pill}`}>{meta.label}</span>
                        <span className="text-[11px] text-gray-400">{data.promptCount} prompts</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[11px] text-gray-400">{mentionPct}% mentioned</span>
                        <span className={`text-sm font-bold tabular-nums ${scoreTextClass(scorePct)}`}>{scorePct}%</span>
                      </div>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full ${meta.bar} rounded-full`} style={{ width: `${scorePct}%` }} />
                    </div>
                  </div>
                );
              })}
          </div>
        )}

        {/* Level Scores */}
        {Object.keys(levelScores).length > 0 && (
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">By Specificity Level</p>
            <p className="text-xs text-gray-400 mb-4 leading-relaxed">
              L1 = broad queries, L5 = cited by name only. Lower discovery level = broader visibility.
            </p>
            {[1, 2, 3, 4, 5].map((l) => {
              const key = `level${l}`;
              const data = levelScores[key];
              if (!data) return null;
              const barClass = LEVEL_COLORS[l - 1];
              const textClass = LEVEL_TEXT[l - 1];
              const scorePct = pct(data.score);
              const mentionPct = pct(data.avgMentionRate);
              return (
                <div key={key} className="mb-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold tabular-nums ${textClass}`}>L{l}</span>
                      <span className="text-sm text-gray-600">{LEVEL_LABELS[l]}</span>
                      <span className="text-[11px] text-gray-400">{data.promptCount} prompts</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] text-gray-400">{mentionPct}% mentioned</span>
                      <span className={`text-sm font-bold tabular-nums ${textClass}`}>{scorePct}%</span>
                    </div>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full ${barClass} rounded-full`} style={{ width: `${scorePct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Tab definitions ──────────────────────────────────────────────────────────

type TabId = "html" | "performance";

// ─── Props ────────────────────────────────────────────────────────────────────

interface DeepDiveProps {
  promptResults: PromptResult[];
  htmlScan: HtmlScan | null;
  citationStats: CitationStats | null;
  categoryScores: Record<string, CategoryScore>;
  levelScores: Record<string, LevelScore>;
  engines: string[];
  htmlScore: number | null;
  businessSnapshot?: { name?: string; category?: string; description?: string; primaryUrl?: string; targetKeywords?: string[] };
  promptGaps?: { promptId: number; question: string; level: number; category: string; mentionRate: number }[];
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function DeepDive({
  promptResults: _promptResults, htmlScan, citationStats: _citationStats,
  categoryScores, levelScores, engines: _engines, htmlScore, businessSnapshot, promptGaps,
}: DeepDiveProps) {
  const [activeTab, setActiveTab] = useState<TabId>("performance");

  const tabs: { id: TabId; label: string; icon: React.ReactNode; count?: string }[] = [
    {
      id: "performance",
      label: "AI Performance",
      icon: <Target className="w-3.5 h-3.5" />,
    },
    {
      id: "html",
      label: "Site Signals",
      icon: <FileSearch className="w-3.5 h-3.5" />,
      count: htmlScore != null ? `${Math.round(htmlScore)}%` : undefined,
    },
  ];

  const hasAnyContent =
    htmlScan != null ||
    Object.keys(categoryScores).length > 0;

  if (!hasAnyContent) return null;

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-4">
        <div>
          <h2 className="text-xl font-heading font-semibold text-gray-900">Deep Dive</h2>
          <p className="text-sm text-gray-500 mt-0.5">Full audit data for technical review</p>
        </div>
      </div>

      <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/60 overflow-hidden">
        {/* Tab bar */}
        <div className="flex items-center gap-1 px-4 pt-4 border-b border-gray-100 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium rounded-t-lg border-b-2 -mb-px transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? "border-gray-900 text-gray-900 bg-white"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              {tab.icon}
              {tab.label}
              {tab.count != null && (
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  activeTab === tab.id ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600"
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="p-6">
          {activeTab === "performance" && <PerformanceTab categoryScores={categoryScores} levelScores={levelScores} />}
          {activeTab === "html" && htmlScan && <HtmlScanTab htmlScan={htmlScan} businessSnapshot={businessSnapshot} promptGaps={promptGaps} />}
          {activeTab === "html" && !htmlScan && <p className="text-sm text-gray-400">No HTML scan data available.</p>}
        </div>
      </div>
    </div>
  );
}
