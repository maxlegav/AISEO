import React, { useState } from "react";
import { Zap, ChevronDown, ChevronUp, FileText, AlertTriangle, Wrench, Copy, Check, ArrowDown } from "lucide-react";
import type { IssueItem, PromptGapItem } from "./auditTypes";
import { CATEGORY_META } from "./auditHelpers";

// ─── Fix data ─────────────────────────────────────────────────────────────────

interface FixData {
  steps: string[];
  code?: string;
  linkToQuickWins?: boolean;
}

const HOW_TO_FIX: Record<string, FixData> = {
  no_robots_txt: {
    steps: [
      "Create a file named `robots.txt` at the root of your website",
      "Add the content below to allow AI crawlers to index your site",
      "Upload it so it's accessible at https://yoursite.com/robots.txt",
    ],
    code: "User-agent: *\nAllow: /\n\nUser-agent: GPTBot\nAllow: /\n\nUser-agent: ClaudeBot\nAllow: /\n\nUser-agent: PerplexityBot\nAllow: /",
  },
  robots_blanket_disallow: {
    steps: [
      "Open your robots.txt file",
      "Remove any `Disallow: /` rule under `User-agent: *`",
      "Explicitly allow the main AI crawlers with the snippet below",
    ],
    code: "User-agent: *\nAllow: /\n\nUser-agent: GPTBot\nAllow: /\n\nUser-agent: ClaudeBot\nAllow: /",
  },
  robots_ai_bots_blocked: {
    steps: [
      "Open your robots.txt and find the blocked bot sections",
      "Replace the Disallow rules with Allow rules for each AI crawler",
    ],
    code: "User-agent: GPTBot\nAllow: /\n\nUser-agent: ClaudeBot\nAllow: /\n\nUser-agent: PerplexityBot\nAllow: /",
  },
  no_llms_txt: {
    steps: [
      "Your llms.txt has been generated — copy it from the GEO Quick Wins section below",
      "Upload the file to the root of your website: https://yoursite.com/llms.txt",
    ],
    linkToQuickWins: true,
  },
  no_sitemap: {
    steps: [
      "Generate a sitemap.xml with your CMS or a free tool like xml-sitemaps.com",
      "Upload it to https://yoursite.com/sitemap.xml",
      "Submit it in Google Search Console for faster AI indexing",
    ],
  },
  no_organization_schema: {
    steps: [
      "Paste the JSON-LD markup below into your website <head> tag",
      "Replace the placeholder values with your real business info",
      "This tells AI engines exactly who you are and what you do",
    ],
    code: '<script type="application/ld+json">\n{\n  "@context": "https://schema.org",\n  "@type": "Organization",\n  "name": "Your Business Name",\n  "url": "https://yoursite.com",\n  "description": "What your business does in one sentence",\n  "sameAs": [\n    "https://www.linkedin.com/company/your-company"\n  ]\n}\n</script>',
  },
  no_faq_schema: {
    steps: [
      "Your FAQ HTML snippet (with FAQPage schema) is ready in GEO Quick Wins below",
      "Add it to your main page or a dedicated FAQ page",
      "The FAQPage schema feeds question-answer pairs directly to AI engines",
    ],
    linkToQuickWins: true,
  },
  no_faq_schema_critical: {
    steps: [
      "PRIORITY: Copy the GEO HTML Snippet from GEO Quick Wins below and add it to your <head> now",
      "Then create a dedicated FAQ page covering the top questions in your niche",
    ],
    linkToQuickWins: true,
  },
  weak_meta_description: {
    steps: [
      "Write a 150-160 character meta description for your homepage",
      "Include your main value proposition and one key differentiator",
      'Add it to your page <head>: <meta name="description" content="Your description">',
    ],
  },
  missing_meta_title: {
    steps: [
      "Add a <title> tag inside your page <head>",
      "Keep it under 60 characters and include your brand name",
    ],
    code: "<title>Your Brand — Main Value Proposition</title>",
  },
  heading_structure_issues: {
    steps: [
      "Ensure your page has exactly ONE <h1> tag with your main topic",
      "Use <h2> for main sections, <h3> for subsections — don't skip levels",
      "The H1 should clearly describe what your business does",
    ],
  },
  low_image_alt_compliance: {
    steps: [
      "Add descriptive alt text to every <img> tag missing one",
      "For products: describe the item (e.g. alt='Blue ceramic coffee mug 350ml')",
      "For decorative images: use alt='' (empty, not missing)",
    ],
  },
  low_ai_bot_accessibility: {
    steps: [
      "Check your server or CDN (Cloudflare, etc.) for rules blocking bot user-agents",
      "Verify your robots.txt isn't blocking the main AI crawlers",
      "Test by sending a HEAD request with GPTBot user-agent to your homepage",
    ],
  },
  low_brand_awareness: {
    steps: [
      "Create landing pages targeting broad industry keywords, not just branded ones",
      "Publish educational content: guides, 'what is X', 'how to Y' articles",
      "Get mentioned in industry publications, directories, and partner sites",
    ],
  },
  weak_comparison_visibility: {
    steps: [
      "Create a comparison page (e.g. 'X vs Y' or 'Alternatives to X')",
      "State your differentiators factually on your homepage and about page",
      "This content is what AI uses when users ask comparison questions",
    ],
  },
  weak_reputation_score: {
    steps: [
      "Add customer testimonials, reviews, and case studies to your website",
      "Add AggregateRating schema markup to show your rating to AI engines",
      "Get listed on trusted review platforms (Trustpilot, G2, Capterra, etc.)",
    ],
  },
  invisible_to_ai: {
    steps: [
      "Start immediately with the GEO Quick Wins below — deploy both files in under 5 minutes",
      "Create content for each query type: discovery, comparison, reputation, product, trust",
      "Build external mentions: press, directories, partner sites, industry publications",
    ],
    linkToQuickWins: true,
  },
  late_discovery_only: {
    steps: [
      "Create content answering broad category questions (L1-L2), not just branded queries",
      "Target the question 'What is the best [your category]?' type queries",
      "Build topical authority by covering your niche comprehensively",
    ],
  },
};

// ─── Done context ──────────────────────────────────────────────────────────────

interface DoneCtx { completed: Set<string>; toggleDone: (id: string) => void; }
const DoneContext = React.createContext<DoneCtx>({ completed: new Set(), toggleDone: () => {} });

// ─── Copy button ──────────────────────────────────────────────────────────────

function CopyCodeButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
        copied ? "bg-emerald-100 text-emerald-700 border border-emerald-200" : "bg-white/80 text-gray-600 border border-gray-200 hover:bg-gray-50"
      }`}
    >
      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

// ─── Priority groups ──────────────────────────────────────────────────────────

type Priority = "urgent" | "important" | "optimize";

const PRIORITY_META: Record<Priority, {
  emoji: string;
  label: string;
  sublabel: string;
  headerClass: string;
  badgeClass: string;
}> = {
  urgent: {
    emoji: "🔴",
    label: "URGENT",
    sublabel: "Fix this week — blocking AI visibility now",
    headerClass: "border-red-200 bg-red-50",
    badgeClass: "bg-red-100 text-red-700 border-red-200",
  },
  important: {
    emoji: "🟠",
    label: "IMPORTANT",
    sublabel: "Do this month — significant impact on citations",
    headerClass: "border-orange-200 bg-orange-50",
    badgeClass: "bg-orange-100 text-orange-700 border-orange-200",
  },
  optimize: {
    emoji: "🟡",
    label: "OPTIMIZE",
    sublabel: "This quarter — incremental gains",
    headerClass: "border-yellow-200 bg-yellow-50",
    badgeClass: "bg-yellow-100 text-yellow-700 border-yellow-200",
  },
};

// ─── Action item types ────────────────────────────────────────────────────────

type ActionItem =
  | { kind: "issue"; data: IssueItem; priority: Priority }
  | { kind: "gap"; data: PromptGapItem; priority: Priority };

function issueToPriority(sev: IssueItem["severity"]): Priority {
  if (sev === "critical") return "urgent";
  if (sev === "high") return "important";
  return "optimize";
}

// ─── Issue card ───────────────────────────────────────────────────────────────

function IssueCard({ issue }: { issue: IssueItem }) {
  const [expanded, setExpanded] = useState(false);
  const fix = HOW_TO_FIX[issue.id];
  const { completed, toggleDone } = React.useContext(DoneContext);
  const itemId = `issue-${issue.id}`;
  const isDone = completed.has(itemId);

  const typeLabelMap: Record<string, string> = {
    schema: "Schema",
    technical: "Technical",
    meta: "Meta tags",
    accessibility: "Accessibility",
    robots: "Robots.txt",
    sitemap: "Sitemap",
    content: "Content",
    links: "Links",
  };

  return (
    <div className={`bg-white rounded-xl border border-gray-100 overflow-hidden ${isDone ? "opacity-60" : ""}`}>
      <button
        className="w-full flex items-start gap-3 p-4 text-left hover:bg-gray-50/50 transition-colors"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={`text-sm font-semibold text-gray-900 ${isDone ? "line-through" : ""}`}>{issue.title}</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-500 border border-gray-200 uppercase tracking-wide">
              {typeLabelMap[issue.type] ?? issue.type}
            </span>
          </div>
          {!expanded && (
            <p className="text-xs text-gray-500 leading-relaxed line-clamp-1">{issue.description}</p>
          )}
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); toggleDone(itemId); }}
          className={`shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
            isDone ? "bg-emerald-500 border-emerald-500" : "border-gray-300 hover:border-emerald-400"
          }`}
          title={isDone ? "Mark as not done" : "Mark as done"}
        >
          {isDone && <Check className="w-3 h-3 text-white" />}
        </button>
        {expanded
          ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
          : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
        }
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3">
          <p className="text-sm text-gray-600 leading-relaxed">{issue.description}</p>

          {issue.aiImpact && (
            <div className="flex items-start gap-2.5 bg-blue-50 border border-blue-100 rounded-xl px-3 py-3">
              <Zap className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
              <div>
                <span className="text-[11px] font-bold text-blue-500 uppercase tracking-wide block mb-0.5">AI Impact</span>
                <p className="text-xs text-blue-800 leading-relaxed">{issue.aiImpact}</p>
              </div>
            </div>
          )}

          {fix && (
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-3">
              <div className="flex items-center gap-2 mb-2.5">
                <Wrench className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wide">How to fix</span>
              </div>
              <ol className="space-y-1.5">
                {fix.steps.map((step, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-emerald-900">
                    <span className="shrink-0 w-4 h-4 rounded-full bg-emerald-200 text-emerald-800 font-bold text-[10px] flex items-center justify-center mt-0.5">
                      {i + 1}
                    </span>
                    <span className="leading-relaxed">{step}</span>
                  </li>
                ))}
              </ol>

              {fix.linkToQuickWins && (
                <a
                  href="#quick-wins"
                  className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-900 transition-colors"
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById("quick-wins")?.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                  See GEO Quick Wins below — your files are ready to copy
                </a>
              )}

              {fix.code && (
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wide">Ready to use</span>
                    <CopyCodeButton text={fix.code} />
                  </div>
                  <pre className="text-[11px] text-gray-700 bg-white/70 border border-emerald-200 rounded-lg p-3 overflow-auto max-h-40 leading-relaxed font-mono whitespace-pre-wrap">
                    {fix.code}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Gap card helpers ─────────────────────────────────────────────────────────

function buildFaqAnswer(
  question: string,
  category: string,
  businessName: string,
  description: string,
  keywords: string[],
): string {
  const kwStr = keywords.slice(0, 3).join(", ");
  const desc = description ? description.slice(0, 120) : "";
  const base = desc || (kwStr ? `a ${kwStr} solution` : "a leading solution in its category");

  const templates: Record<string, string> = {
    discovery: `${businessName} is ${base}. We help you [main benefit — fill in]. ${kwStr ? `Key strengths: ${kwStr}.` : ""}`,
    comparison: `Compared to other options, ${businessName} stands out for [unique differentiator]. ${kwStr ? `What sets us apart: ${kwStr}.` : ""}`,
    reputation: `${businessName} is trusted by [number] customers/clients. ${desc ? desc : `Known for ${kwStr}.`} [Add a key proof point: certification, award, or testimonial].`,
    trust: `${businessName} is [licensed/certified] and [key trust signal — fill in]. ${desc ? desc : `We prioritize ${kwStr}.`}`,
    product: `${businessName} offers [specific product/service]. ${kwStr ? `Features include: ${kwStr}.` : ""} [Add pricing or availability if relevant].`,
    alternative: `${businessName} is a top alternative for [target audience] looking for [solution category]. ${kwStr ? `Key strengths: ${kwStr}.` : ""}`,
  };

  // Suppress unused parameter warning
  void question;

  return templates[category] ?? `${businessName} — ${base}. [Complete this answer with your specific value proposition.]`;
}

function buildFaqJsonLd(question: string, answer: string): string {
  return `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": ${JSON.stringify(question)},
      "acceptedAnswer": {
        "@type": "Answer",
        "text": ${JSON.stringify(answer)}
      }
    }
  ]
}
</script>`;
}

// ─── Gap card ─────────────────────────────────────────────────────────────────

function GapCard({ gap, categoryScores, htmlKeywords, businessSnapshot }: {
  gap: PromptGapItem;
  categoryScores?: Record<string, { score: number; avgMentionRate: number; promptCount: number }>;
  htmlKeywords?: { word: string; count: number; tfidf?: number }[];
  businessSnapshot?: { name?: string; category?: string; description?: string; primaryUrl?: string; targetKeywords?: string[] };
}) {
  const [expanded, setExpanded] = useState(false);
  const { completed, toggleDone } = React.useContext(DoneContext);
  const itemId = `gap-${gap.promptId}`;
  const isDone = completed.has(itemId);
  const meta = CATEGORY_META[gap.category];
  const catScore = categoryScores?.[gap.category];
  const scorePct = catScore ? Math.round(catScore.score) : null;

  // Build keyword suggestions: top 6 from HTML scan + targetKeywords from snapshot
  const topKeywords = (htmlKeywords ?? [])
    .slice(0, 8)
    .map((k) => k.word)
    .filter((w) => w.length > 3);
  const targetKws = businessSnapshot?.targetKeywords ?? [];
  const allKeywords = Array.from(new Set([...targetKws.slice(0, 4), ...topKeywords])).slice(0, 6);

  const businessName = businessSnapshot?.name ?? "your business";
  const businessDesc = businessSnapshot?.description ?? "";

  // Generate a copy-ready FAQ JSON-LD snippet for this specific question
  const faqAnswer = buildFaqAnswer(gap.question, gap.category, businessName, businessDesc, allKeywords);
  const faqSnippet = buildFaqJsonLd(gap.question, faqAnswer);

  return (
    <div className={`bg-white rounded-xl border border-gray-100 overflow-hidden ${isDone ? "opacity-60" : ""}`}>
      <button
        className="w-full flex items-start gap-3 p-4 text-left hover:bg-gray-50/50 transition-colors"
        onClick={() => setExpanded((v) => !v)}
      >
        <FileText className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-1" />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-800 font-medium leading-snug mb-1.5">{gap.question}</p>
          <div className="flex items-center gap-2 flex-wrap">
            {meta && (
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${meta.pill}`}>
                {meta.label}
              </span>
            )}
            <span className="text-[10px] text-red-500 font-semibold">0% cited — click to fix</span>
          </div>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); toggleDone(itemId); }}
          className={`shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
            isDone ? "bg-emerald-500 border-emerald-500" : "border-gray-300 hover:border-emerald-400"
          }`}
          title={isDone ? "Mark as not done" : "Mark as done"}
        >
          {isDone && <Check className="w-3 h-3 text-white" />}
        </button>
        {expanded
          ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
          : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3">
          {/* Why */}
          <div className="flex items-start gap-2.5 bg-blue-50 border border-blue-100 rounded-xl px-3 py-3">
            <Zap className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
            <div>
              <span className="text-[11px] font-bold text-blue-500 uppercase tracking-wide block mb-0.5">Why you&apos;re invisible here</span>
              <p className="text-xs text-blue-800 leading-relaxed">
                {scorePct !== null
                  ? `Your ${meta?.label ?? gap.category} score is ${scorePct}% — AI engines almost never cite you for these types of questions. `
                  : ""}
                When someone asks this, no AI engine mentions {businessName}. Creating content that directly answers it turns this gap into a citation.
              </p>
            </div>
          </div>

          {/* How to fix */}
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-3">
            <div className="flex items-center gap-2 mb-2.5">
              <Wrench className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wide">How to fix</span>
            </div>
            <ol className="space-y-1.5 mb-3">
              <li className="flex items-start gap-2 text-xs text-emerald-900">
                <span className="shrink-0 w-4 h-4 rounded-full bg-emerald-200 text-emerald-800 font-bold text-[10px] flex items-center justify-center mt-0.5">1</span>
                <span className="leading-relaxed">Add a FAQ entry on your site that answers this exact question</span>
              </li>
              {allKeywords.length > 0 && (
                <li className="flex items-start gap-2 text-xs text-emerald-900">
                  <span className="shrink-0 w-4 h-4 rounded-full bg-emerald-200 text-emerald-800 font-bold text-[10px] flex items-center justify-center mt-0.5">2</span>
                  <span className="leading-relaxed">
                    Use these keywords from your site in your answer:{" "}
                    {allKeywords.map((kw, i) => (
                      <span key={kw}>
                        <span className="font-semibold">{kw}</span>
                        {i < allKeywords.length - 1 ? ", " : ""}
                      </span>
                    ))}
                  </span>
                </li>
              )}
              <li className="flex items-start gap-2 text-xs text-emerald-900">
                <span className="shrink-0 w-4 h-4 rounded-full bg-emerald-200 text-emerald-800 font-bold text-[10px] flex items-center justify-center mt-0.5">{allKeywords.length > 0 ? 3 : 2}</span>
                <span className="leading-relaxed">Add FAQPage schema markup so AI engines can read your answer directly (see template below)</span>
              </li>
            </ol>

            {/* FAQ snippet */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wide">FAQ answer template</span>
                <CopyCodeButton text={faqSnippet} />
              </div>
              <pre className="text-[11px] text-gray-700 bg-white/70 border border-emerald-200 rounded-lg p-3 overflow-auto max-h-72 leading-relaxed font-mono whitespace-pre-wrap">
                {faqSnippet}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Priority group ───────────────────────────────────────────────────────────

type GapContext = {
  categoryScores?: Record<string, { score: number; avgMentionRate: number; promptCount: number }>;
  htmlKeywords?: { word: string; count: number; tfidf?: number }[];
  businessSnapshot?: { name?: string; category?: string; description?: string; primaryUrl?: string; targetKeywords?: string[] };
};

function PriorityGroup({ priority, items, gapContext }: { priority: Priority; items: ActionItem[]; gapContext: GapContext }) {
  const [open, setOpen] = useState(priority === "urgent" || priority === "important");
  const meta = PRIORITY_META[priority];

  if (items.length === 0) return null;

  return (
    <div className={`rounded-2xl border overflow-hidden ${meta.headerClass}`}>
      <button
        className="w-full flex items-center justify-between px-5 py-4 text-left"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="flex items-center gap-3">
          <span className="text-lg leading-none">{meta.emoji}</span>
          <div>
            <span className="text-sm font-bold text-gray-900">{meta.label}</span>
            <span className="ml-2 text-[11px] text-gray-500">{meta.sublabel}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${meta.badgeClass}`}>
            {items.length} action{items.length > 1 ? "s" : ""}
          </span>
          {open
            ? <ChevronUp className="w-4 h-4 text-gray-500" />
            : <ChevronDown className="w-4 h-4 text-gray-500" />
          }
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-2 bg-white/60">
          {items.map((item, i) =>
            item.kind === "issue"
              ? <IssueCard key={`issue-${item.data.id}-${i}`} issue={item.data} />
              : <GapCard
                  key={`gap-${item.data.promptId}-${i}`}
                  gap={item.data}
                  categoryScores={gapContext.categoryScores}
                  htmlKeywords={gapContext.htmlKeywords}
                  businessSnapshot={gapContext.businessSnapshot}
                />
          )}
        </div>
      )}
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface ActionPlanProps {
  issues: IssueItem[];
  promptGaps: PromptGapItem[];
  hasQuickWins: boolean;
  categoryScores?: Record<string, { score: number; avgMentionRate: number; promptCount: number }>;
  htmlKeywords?: { word: string; count: number; tfidf?: number }[];
  businessSnapshot?: { name?: string; category?: string; description?: string; primaryUrl?: string; targetKeywords?: string[] };
  auditId?: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function ActionPlan({ issues, promptGaps, hasQuickWins, categoryScores, htmlKeywords, businessSnapshot, auditId }: ActionPlanProps) {
  const storageKey = auditId ? `syb-done-${auditId}` : null;
  const [completed, setCompleted] = useState<Set<string>>(() => {
    if (typeof window === "undefined" || !storageKey) return new Set<string>();
    try {
      const raw = localStorage.getItem(storageKey);
      return raw ? new Set<string>(JSON.parse(raw) as string[]) : new Set<string>();
    } catch { return new Set<string>(); }
  });

  const toggleDone = (id: string) => {
    setCompleted((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      if (storageKey) {
        try { localStorage.setItem(storageKey, JSON.stringify([...next])); } catch { /* ignore */ }
      }
      return next;
    });
  };

  const allItems: ActionItem[] = [
    ...issues.map((issue): ActionItem => ({
      kind: "issue",
      data: issue,
      priority: issueToPriority(issue.severity),
    })),
    ...promptGaps.map((gap): ActionItem => ({
      kind: "gap",
      data: gap,
      priority: "important" as Priority,
    })),
  ];

  const byPriority = {
    urgent: allItems.filter((i) => i.priority === "urgent"),
    important: allItems.filter((i) => i.priority === "important"),
    optimize: allItems.filter((i) => i.priority === "optimize"),
  };

  const totalCount = allItems.length;

  const gapContext: GapContext = { categoryScores, htmlKeywords, businessSnapshot };

  if (totalCount === 0) return null;

  return (
    <DoneContext.Provider value={{ completed, toggleDone }}>
      <div id="action-plan" className="mb-6">
        <div className="flex items-start justify-between mb-4 flex-wrap gap-2">
          <div>
            <h2 className="text-xl font-heading font-semibold text-gray-900">Action Plan</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {totalCount} action{totalCount > 1 ? "s" : ""} to improve your AI visibility — click any item to see how to fix it
              {hasQuickWins && (
                <a
                  href="#quick-wins"
                  className="ml-2 text-orange-500 hover:text-orange-700 font-medium transition-colors"
                  onClick={(e) => { e.preventDefault(); document.getElementById("quick-wins")?.scrollIntoView({ behavior: "smooth" }); }}
                >
                  → 2 quick wins ready to copy ↓
                </a>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {byPriority.urgent.length > 0 && (
              <span className="flex items-center gap-1 px-2.5 py-1 bg-red-50 border border-red-200 rounded-full text-xs font-semibold text-red-700">
                <AlertTriangle className="w-3 h-3" />
                {byPriority.urgent.length} urgent
              </span>
            )}
            {byPriority.important.length > 0 && (
              <span className="px-2.5 py-1 bg-orange-50 border border-orange-200 rounded-full text-xs font-semibold text-orange-700">
                {byPriority.important.length} important
              </span>
            )}
            {byPriority.optimize.length > 0 && (
              <span className="px-2.5 py-1 bg-yellow-50 border border-yellow-200 rounded-full text-xs font-semibold text-yellow-700">
                {byPriority.optimize.length} to optimize
              </span>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <PriorityGroup priority="urgent" items={byPriority.urgent} gapContext={gapContext} />
          <PriorityGroup priority="important" items={byPriority.important} gapContext={gapContext} />
          <PriorityGroup priority="optimize" items={byPriority.optimize} gapContext={gapContext} />
        </div>
      </div>
    </DoneContext.Provider>
  );
}
