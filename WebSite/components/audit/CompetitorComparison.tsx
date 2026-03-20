import { useState } from "react";
import { ExternalLink, TrendingUp, TrendingDown, ChevronDown, ChevronUp } from "lucide-react";
import type { CompetitorResult } from "./auditTypes";
import { scoreTextClass, CATEGORY_META } from "./auditHelpers";

interface CompetitorComparisonProps {
  competitors: CompetitorResult[];
  geoScore: number;
  businessName: string | undefined;
}

const CATEGORY_ORDER = ["discovery", "comparison", "reputation", "product", "alternative", "trust"];

function CompetitorDetail({ comp, yourScore }: { comp: CompetitorResult; yourScore: number }) {
  const compScore = Math.round(comp.auditEngineScore);
  const cats = CATEGORY_ORDER.filter((c) => comp.categoryScores[c] != null || comp.categoryScores[c] === 0);

  const discLevel = (() => {
    for (let l = 1; l <= 5; l++) {
      const ls = comp.levelScores[`level${l}`];
      if (ls != null && ls >= 0.25) return l;
    }
    return null;
  })();

  return (
    <div className="mt-3 pt-3 border-t border-gray-700/50 space-y-3">
      {cats.length > 0 && (
        <div>
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Score by query type</p>
          <div className="grid grid-cols-2 gap-x-6 gap-y-2">
            {CATEGORY_ORDER.map((cat) => {
              const raw = comp.categoryScores[cat];
              if (raw == null) return null;
              const pct = Math.round(raw * 100);
              const meta = CATEGORY_META[cat] ?? { label: cat, bar: "bg-gray-400", pill: "" };
              return (
                <div key={cat}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-gray-400">{meta.label}</span>
                    <span className="text-[10px] font-bold text-gray-300 tabular-nums">{pct}%</span>
                  </div>
                  <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
                    <div className={`h-full ${meta.bar} opacity-70 rounded-full`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-gray-500">Visible at:</span>
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
            discLevel == null ? "bg-red-900/50 text-red-400" :
            discLevel <= 2 ? "bg-emerald-900/50 text-emerald-400" :
            discLevel <= 3 ? "bg-yellow-900/50 text-yellow-400" : "bg-orange-900/50 text-orange-400"
          }`}>
            {discLevel == null ? "Not found" : `Level ${discLevel}`}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-gray-500">vs you:</span>
          <span className={`text-[10px] font-bold ${compScore > yourScore ? "text-red-400" : "text-emerald-400"}`}>
            {compScore > yourScore ? `+${compScore - yourScore}%` : compScore < yourScore ? `-${yourScore - compScore}%` : "Tied"}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function CompetitorComparison({ competitors, geoScore, businessName }: CompetitorComparisonProps) {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  if (competitors.length === 0) return null;

  const aheadCount = competitors.filter((c) => Math.round(c.auditEngineScore) < geoScore).length;
  const behindCount = competitors.filter((c) => Math.round(c.auditEngineScore) >= geoScore).length;
  const sorted = [...competitors].sort((a, b) => b.auditEngineScore - a.auditEngineScore);

  return (
    <div id="competitors" className="mb-6">
      <div className="flex items-start justify-between mb-4 flex-wrap gap-2">
        <div>
          <h2 className="text-xl font-heading font-semibold text-gray-900">Competitor Comparison</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {aheadCount > 0 && (
              <span className="text-emerald-600 font-medium">Ahead of {aheadCount} competitor{aheadCount > 1 ? "s" : ""}</span>
            )}
            {aheadCount > 0 && behindCount > 0 && <span className="text-gray-400"> · </span>}
            {behindCount > 0 && (
              <span className="text-red-500 font-medium">{behindCount} competitor{behindCount > 1 ? "s" : ""} outranking you</span>
            )}
            <span className="text-gray-400"> · Click a competitor for category details</span>
          </p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-2xl p-6 text-white">
        <div className="space-y-4">

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-blue-300">{businessName ?? "Your site"}</span>
                <span className="text-[10px] text-blue-400/70 uppercase tracking-wider font-medium bg-blue-500/10 px-1.5 py-0.5 rounded">You</span>
              </div>
              <span className={`text-sm font-bold tabular-nums ${scoreTextClass(geoScore)}`}>
                {geoScore}%
              </span>
            </div>
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full" style={{ width: `${geoScore}%` }} />
            </div>
          </div>

          <div className="border-t border-gray-700/50" />

          {sorted.map((comp, i) => {
            const compScore = Math.round(comp.auditEngineScore);
            const mentionPct = Math.round(comp.mentionRate * 100);
            const isAhead = compScore >= geoScore;
            const isExpanded = expandedIdx === i;

            return (
              <div key={i}>
                <button
                  className="w-full text-left"
                  onClick={() => setExpandedIdx(isExpanded ? null : i)}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      {isAhead
                        ? <TrendingUp className="w-3.5 h-3.5 text-red-400 shrink-0" />
                        : <TrendingDown className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      }
                      <span className="text-sm text-gray-300 truncate max-w-[180px]">
                        {comp.competitorName || comp.competitorUrl}
                      </span>
                      {comp.competitorUrl && (
                        <a
                          href={comp.competitorUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="shrink-0 opacity-50 hover:opacity-100 transition-opacity"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink className="w-3 h-3 text-gray-400" />
                        </a>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] text-gray-500">{mentionPct}% mentioned</span>
                      <span className={`text-sm font-bold tabular-nums ${isAhead ? "text-red-400" : "text-gray-400"}`}>
                        {compScore}%
                      </span>
                      {isExpanded
                        ? <ChevronUp className="w-3.5 h-3.5 text-gray-500" />
                        : <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
                      }
                    </div>
                  </div>
                  <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${isAhead ? "bg-red-500/70" : "bg-gray-500"}`}
                      style={{ width: `${compScore}%` }}
                    />
                  </div>
                </button>

                {isExpanded && <CompetitorDetail comp={comp} yourScore={geoScore} />}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
