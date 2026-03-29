import { useEffect, useState } from "react";
import {
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Minus,
  Loader2,
} from "lucide-react";
import type { IssueItem } from "./auditTypes";

interface AuditSnapshot {
  geoScore?: number | null;
  results?: {
    issues?: IssueItem[];
    categoryScores?: Record<string, { score: number }>;
  } | null;
}

interface DiffResult {
  fixed: IssueItem[];
  persistent: IssueItem[];
  newIssues: IssueItem[];
  categoryDeltas: { category: string; current: number; previous: number; delta: number }[];
}

function diffAudits(current: AuditSnapshot, previous: AuditSnapshot): DiffResult {
  const prevIssues = previous.results?.issues ?? [];
  const currIssues = current.results?.issues ?? [];

  const prevTypes = new Map(prevIssues.map((i) => [i.type, i]));
  const currTypes = new Map(currIssues.map((i) => [i.type, i]));

  const fixed = prevIssues.filter((i) => !currTypes.has(i.type));
  const persistent = currIssues.filter((i) => prevTypes.has(i.type));
  const newIssues = currIssues.filter((i) => !prevTypes.has(i.type));

  const prevCats = previous.results?.categoryScores ?? {};
  const currCats = current.results?.categoryScores ?? {};
  const allCats = new Set([...Object.keys(prevCats), ...Object.keys(currCats)]);
  const categoryDeltas = Array.from(allCats)
    .map((cat) => ({
      category: cat,
      current: Math.round(currCats[cat]?.score ?? 0),
      previous: Math.round(prevCats[cat]?.score ?? 0),
      delta: Math.round((currCats[cat]?.score ?? 0) - (prevCats[cat]?.score ?? 0)),
    }))
    .filter((c) => c.current > 0 || c.previous > 0)
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));

  return { fixed, persistent, newIssues, categoryDeltas };
}

function ScoreDelta({ current, previous }: { current: number; previous: number }) {
  const delta = Math.round((current - previous) * 10) / 10;
  const color = delta > 0 ? "text-emerald-600" : delta < 0 ? "text-red-500" : "text-gray-400";
  const bg = delta > 0 ? "bg-emerald-50" : delta < 0 ? "bg-red-50" : "bg-gray-50";
  const Icon = delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus;

  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold ${color} ${bg}`}>
      <Icon className="w-4 h-4" />
      {delta > 0 ? "+" : ""}{delta} pts depuis le dernier audit
    </div>
  );
}

function SeverityDot({ severity }: { severity: string }) {
  const colors: Record<string, string> = {
    critical: "bg-red-500",
    high: "bg-orange-500",
    medium: "bg-yellow-400",
    low: "bg-blue-400",
  };
  return <span className={`w-2 h-2 rounded-full shrink-0 ${colors[severity] ?? "bg-gray-300"}`} />;
}

interface Props {
  previousAuditId: string;
  currentAudit: AuditSnapshot & { geoScore?: number | null };
}

export default function AuditComparison({ previousAuditId, currentAudit }: Props) {
  const [previous, setPrevious] = useState<AuditSnapshot | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/audits/${previousAuditId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setPrevious(d.data);
      })
      .finally(() => setLoading(false));
  }, [previousAuditId]);

  if (loading) {
    return (
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-white/60 flex items-center gap-3 text-sm text-gray-500">
        <Loader2 className="w-4 h-4 animate-spin" />
        Chargement de la comparaison…
      </div>
    );
  }

  if (!previous) return null;

  const diff = diffAudits(currentAudit, previous);
  const prevScore = previous.geoScore ?? 0;
  const currScore = currentAudit.geoScore ?? 0;

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/60 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 border-b border-gray-100">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">
              Progression vs audit précédent
            </h2>
            <ScoreDelta current={currScore} previous={prevScore} />
          </div>
          <div className="flex items-center gap-6 text-center">
            <div>
              <p className="text-2xl font-bold text-gray-400">{prevScore}%</p>
              <p className="text-xs text-gray-400">avant</p>
            </div>
            <div className="text-gray-300 text-xl">→</div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{currScore}%</p>
              <p className="text-xs text-gray-500">maintenant</p>
            </div>
          </div>
        </div>
      </div>

      {/* Issue diff columns */}
      <div className="grid sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
        {/* Fixed */}
        <div className="px-5 py-5">
          <div className="flex items-center gap-1.5 mb-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wide">
              Résolus ({diff.fixed.length})
            </span>
          </div>
          {diff.fixed.length === 0 ? (
            <p className="text-xs text-gray-400 italic">Aucun problème résolu</p>
          ) : (
            <ul className="space-y-2">
              {diff.fixed.map((issue) => (
                <li key={issue.id} className="flex items-start gap-2">
                  <SeverityDot severity={issue.severity} />
                  <span className="text-xs text-gray-600 line-through opacity-60">{issue.title}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* New */}
        <div className="px-5 py-5">
          <div className="flex items-center gap-1.5 mb-3">
            <Sparkles className="w-4 h-4 text-violet-500" />
            <span className="text-xs font-bold text-violet-700 uppercase tracking-wide">
              Nouveaux ({diff.newIssues.length})
            </span>
          </div>
          {diff.newIssues.length === 0 ? (
            <p className="text-xs text-gray-400 italic">Aucun nouveau problème</p>
          ) : (
            <ul className="space-y-2">
              {diff.newIssues.map((issue) => (
                <li key={issue.id} className="flex items-start gap-2">
                  <SeverityDot severity={issue.severity} />
                  <span className="text-xs text-gray-700">{issue.title}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Persistent */}
        <div className="px-5 py-5">
          <div className="flex items-center gap-1.5 mb-3">
            <AlertTriangle className="w-4 h-4 text-orange-400" />
            <span className="text-xs font-bold text-orange-700 uppercase tracking-wide">
              Persistants ({diff.persistent.length})
            </span>
          </div>
          {diff.persistent.length === 0 ? (
            <p className="text-xs text-gray-400 italic">Aucun problème persistant</p>
          ) : (
            <ul className="space-y-2">
              {diff.persistent.map((issue) => (
                <li key={issue.id} className="flex items-start gap-2">
                  <SeverityDot severity={issue.severity} />
                  <span className="text-xs text-gray-700">{issue.title}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Category deltas */}
      {diff.categoryDeltas.length > 0 && (
        <div className="px-6 py-5 border-t border-gray-100">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">
            Évolution par catégorie
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            {diff.categoryDeltas.map((c) => (
              <div key={c.category} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-2.5">
                <span className="text-xs text-gray-600 capitalize">
                  {c.category.replace(/_/g, " ")}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">{c.previous}%</span>
                  <span className="text-gray-300">→</span>
                  <span className="text-xs font-semibold text-gray-800">{c.current}%</span>
                  {c.delta !== 0 && (
                    <span className={`text-xs font-bold ${c.delta > 0 ? "text-emerald-600" : "text-red-500"}`}>
                      {c.delta > 0 ? "+" : ""}{c.delta}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
