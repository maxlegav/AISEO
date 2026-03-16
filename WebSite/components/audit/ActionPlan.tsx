import { useState } from "react";
import { Zap, ChevronDown, ChevronUp, FileText, AlertTriangle } from "lucide-react";
import type { IssueItem, PromptGapItem } from "./auditTypes";
import { CATEGORY_META, LEVEL_TEXT } from "./auditHelpers";

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
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <button
        className="w-full flex items-start gap-3 p-4 text-left hover:bg-gray-50/50 transition-colors"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-sm font-semibold text-gray-900">{issue.title}</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-500 border border-gray-200 uppercase tracking-wide">
              {typeLabelMap[issue.type] ?? issue.type}
            </span>
          </div>
          {!expanded && (
            <p className="text-xs text-gray-500 leading-relaxed line-clamp-1">{issue.description}</p>
          )}
        </div>
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
        </div>
      )}
    </div>
  );
}

// ─── Gap card ─────────────────────────────────────────────────────────────────

function GapCard({ gap }: { gap: PromptGapItem }) {
  const meta = CATEGORY_META[gap.category];
  const levelText = LEVEL_TEXT[gap.level - 1] ?? "text-gray-600";

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4">
      <div className="flex items-start gap-3">
        <FileText className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-1" />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-800 font-medium leading-snug mb-2">{gap.question}</p>
          <div className="flex items-center gap-2 flex-wrap">
            {meta && (
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${meta.pill}`}>
                {meta.label}
              </span>
            )}
            <span className={`text-[10px] font-bold uppercase tracking-wide ${levelText}`}>L{gap.level}</span>
            <span className="text-[10px] text-gray-400">0% citation rate — create content for this topic</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Priority group ───────────────────────────────────────────────────────────

function PriorityGroup({ priority, items }: { priority: Priority; items: ActionItem[] }) {
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
              : <GapCard key={`gap-${item.data.promptId}-${i}`} gap={item.data} />
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
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function ActionPlan({ issues, promptGaps, hasQuickWins }: ActionPlanProps) {
  // Build unified action items
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

  if (totalCount === 0) return null;

  return (
    <div className="mb-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-4 flex-wrap gap-2">
        <div>
          <h2 className="text-xl font-heading font-semibold text-gray-900">Action Plan</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {totalCount} action{totalCount > 1 ? "s" : ""} to improve your AI visibility
            {hasQuickWins && (
              <a href="#quick-wins" className="ml-2 text-orange-500 hover:text-orange-700 font-medium transition-colors">
                → 2 quick wins you can copy now ↓
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

      {/* Priority groups */}
      <div className="space-y-3">
        <PriorityGroup priority="urgent" items={byPriority.urgent} />
        <PriorityGroup priority="important" items={byPriority.important} />
        <PriorityGroup priority="optimize" items={byPriority.optimize} />
      </div>
    </div>
  );
}
