import { ExternalLink, TrendingUp, TrendingDown } from "lucide-react";
import type { CompetitorResult } from "./auditTypes";
import { scoreTextClass } from "./auditHelpers";

// ─── Props ────────────────────────────────────────────────────────────────────

interface CompetitorComparisonProps {
  competitors: CompetitorResult[];
  geoScore: number;
  businessName: string | undefined;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function CompetitorComparison({ competitors, geoScore, businessName }: CompetitorComparisonProps) {
  if (competitors.length === 0) return null;

  const aheadCount = competitors.filter((c) => Math.round(c.auditEngineScore) < geoScore).length;
  const behindCount = competitors.filter((c) => Math.round(c.auditEngineScore) >= geoScore).length;

  return (
    <div className="mb-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-4 flex-wrap gap-2">
        <div>
          <h2 className="text-xl font-heading font-semibold text-gray-900">Competitor Comparison</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {aheadCount > 0 && (
              <span className="text-emerald-600 font-medium">
                Ahead of {aheadCount} competitor{aheadCount > 1 ? "s" : ""}
              </span>
            )}
            {aheadCount > 0 && behindCount > 0 && <span className="text-gray-400"> · </span>}
            {behindCount > 0 && (
              <span className="text-red-500 font-medium">
                {behindCount} competitor{behindCount > 1 ? "s" : ""} outranking you
              </span>
            )}
          </p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-2xl p-6 text-white">
        <div className="space-y-4">

          {/* Your business row */}
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

          {/* Divider */}
          <div className="border-t border-gray-700/50" />

          {/* Competitors */}
          {competitors
            .sort((a, b) => b.auditEngineScore - a.auditEngineScore)
            .map((comp, i) => {
              const compScore = Math.round(comp.auditEngineScore);
              const mentionPct = Math.round(comp.mentionRate * 100);
              const isAhead = compScore >= geoScore;

              return (
                <div key={i}>
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
                        >
                          <ExternalLink className="w-3 h-3 text-gray-400" />
                        </a>
                      )}
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-[11px] text-gray-500">{mentionPct}% mentioned</span>
                      <span className={`text-sm font-bold tabular-nums ${isAhead ? "text-red-400" : "text-gray-400"}`}>
                        {compScore}%
                      </span>
                    </div>
                  </div>
                  <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${isAhead ? "bg-red-500/70" : "bg-gray-500"}`}
                      style={{ width: `${compScore}%` }}
                    />
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
