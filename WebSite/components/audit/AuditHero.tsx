import { ExternalLink, Eye } from "lucide-react";
import type { AuditDoc, AuditResults } from "./auditTypes";
import { scoreColor, scoreLabel, scoreBarClass, scoreTextClass, LEVEL_COLORS } from "./auditHelpers";

// ─── Score Ring ───────────────────────────────────────────────────────────────

function ScoreRing({ score, size = 140 }: { score: number; size?: number }) {
  const sw = 10;
  const r = (size - sw) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = scoreColor(score);
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f3f4f6" strokeWidth={sw} />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke={color} strokeWidth={sw}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          className="transition-all duration-1000"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-gray-900">{score}%</span>
        <span className="text-[10px] font-bold uppercase tracking-widest mt-0.5" style={{ color }}>
          {scoreLabel(score)}
        </span>
      </div>
    </div>
  );
}

// ─── Sub-score bar ────────────────────────────────────────────────────────────

function SubScoreBar({
  label, sublabel, score, barClass,
}: { label: string; sublabel: string; score: number | null | undefined; barClass: string }) {
  const s = score ?? 0;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-gray-700">{label}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">{sublabel}</p>
        </div>
        <span className={`text-xl font-bold tabular-nums ${scoreTextClass(s)}`}>
          {score != null ? `${Math.round(s)}%` : "—"}
        </span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full ${barClass} rounded-full transition-all duration-700`} style={{ width: `${s}%` }} />
      </div>
    </div>
  );
}

// ─── Stat pill ────────────────────────────────────────────────────────────────

function StatPill({
  value, label, color,
}: { value: string | number; label: string; color: string }) {
  return (
    <div className={`flex flex-col items-center px-5 py-3 rounded-2xl border ${color}`}>
      <span className="text-2xl font-bold tabular-nums leading-none">{value}</span>
      <span className="text-[11px] font-medium mt-1 text-center leading-tight opacity-80">{label}</span>
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface AuditHeroProps {
  audit: AuditDoc;
  results: AuditResults;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function AuditHero({ audit, results }: AuditHeroProps) {
  const geoScore = audit.geoScore ?? 0;
  const aiScore = results.auditEngineScore ?? null;
  const htmlScore = results.htmlScannerScore ?? null;
  const discoverability = results.discoverabilityThreshold;
  const discLevel = discoverability?.level ?? null;
  const isInvisible = discLevel === null;
  const engines = results.enginesSucceeded ?? results.enginesUsed ?? [];
  const issuesSummary = results.issuesSummary;
  const promptGapsSummary = results.promptGapsSummary;
  const citationStats = results.citationStats;
  const snap = results.businessSnapshot;

  const formattedDate = audit.completedAt
    ? new Date(audit.completedAt).toLocaleDateString("fr-FR", {
        day: "2-digit", month: "long", year: "numeric",
      })
    : null;

  const processingMin = results.processingTimeMs
    ? (results.processingTimeMs / 60_000).toFixed(1)
    : null;

  const criticalCount = issuesSummary?.criticalCount ?? 0;
  const gapCount = promptGapsSummary?.totalGaps ?? 0;
  const citationRate = citationStats
    ? Math.round(citationStats.targetCitationRate * 100)
    : null;

  return (
    <div className="space-y-4 mb-6">
      {/* Main hero card */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 border border-white/60">
        <div className="flex items-start justify-between gap-8 flex-wrap">

          {/* Left: business info */}
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-heading font-medium text-gray-900 mb-1">
              {audit.businessName ?? "Audit Report"}
            </h1>

            {snap?.primaryUrl && (
              <a
                href={snap.primaryUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-blue-600 transition-colors mb-3"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                {snap.primaryUrl}
              </a>
            )}

            {formattedDate && (
              <p className="text-sm text-gray-400 mb-4">{formattedDate}</p>
            )}

            {/* Context pills */}
            <div className="flex items-center gap-2 flex-wrap mb-6">
              {engines.map((e) => (
                <span key={e} className="px-2.5 py-1 bg-gray-50 border border-gray-100 rounded-full text-xs text-gray-600 font-medium capitalize">
                  {e}
                </span>
              ))}
              {results.totalPromptsProcessed != null && (
                <span className="px-2.5 py-1 bg-blue-50 border border-blue-100 rounded-full text-xs text-blue-600 font-medium">
                  {results.totalResponsesReceived ?? "?"}/{results.totalPromptsProcessed * engines.length} responses
                </span>
              )}
              {processingMin && (
                <span className="px-2.5 py-1 bg-gray-50 border border-gray-100 rounded-full text-xs text-gray-500">
                  {processingMin} min
                </span>
              )}
              {snap?.localityTier && (
                <span className="px-2.5 py-1 bg-purple-50 border border-purple-100 rounded-full text-xs text-purple-600 font-medium capitalize">
                  {snap.localityTier.replace("_", " ")}
                </span>
              )}
            </div>

            {/* Sub-scores */}
            {(aiScore != null || htmlScore != null) && (
              <div className="space-y-4 max-w-sm">
                {aiScore != null && (
                  <SubScoreBar
                    label="AI Prompt Score"
                    sublabel="70% of GEO score — AI engine visibility"
                    score={aiScore}
                    barClass={scoreBarClass(aiScore)}
                  />
                )}
                {htmlScore != null && (
                  <SubScoreBar
                    label="HTML Technical Score"
                    sublabel="30% of GEO score — Technical SEO & AI readiness"
                    score={htmlScore}
                    barClass={scoreBarClass(htmlScore)}
                  />
                )}
              </div>
            )}
          </div>

          {/* Right: GEO Score Ring */}
          <div className="flex flex-col items-center gap-2 shrink-0">
            <ScoreRing score={geoScore} />
            <span className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">GEO Score</span>
          </div>
        </div>
      </div>

      {/* Stat pills row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatPill
          value={criticalCount}
          label="Critical issues"
          color={criticalCount > 0
            ? "bg-red-50 border-red-200 text-red-700"
            : "bg-emerald-50 border-emerald-200 text-emerald-700"}
        />
        <StatPill
          value={gapCount}
          label="Prompt gaps"
          color={gapCount > 0
            ? "bg-orange-50 border-orange-200 text-orange-700"
            : "bg-emerald-50 border-emerald-200 text-emerald-700"}
        />
        <StatPill
          value={citationRate != null ? `${citationRate}%` : "—"}
          label="Citation rate"
          color={citationRate != null && citationRate >= 20
            ? "bg-blue-50 border-blue-200 text-blue-700"
            : "bg-gray-50 border-gray-200 text-gray-700"}
        />
        <StatPill
          value={isInvisible ? "None" : `L${discLevel}`}
          label="Discoverability"
          color={isInvisible
            ? "bg-red-50 border-red-200 text-red-700"
            : discLevel! <= 2
            ? "bg-emerald-50 border-emerald-200 text-emerald-700"
            : "bg-orange-50 border-orange-200 text-orange-700"}
        />
      </div>

      {/* Discoverability banner */}
      {discoverability && (
        <div className={`rounded-2xl px-6 py-4 border flex items-center gap-4 flex-wrap ${
          isInvisible
            ? "bg-red-50 border-red-200"
            : discLevel! <= 2
            ? "bg-emerald-50 border-emerald-200"
            : discLevel! <= 3
            ? "bg-yellow-50 border-yellow-200"
            : "bg-orange-50 border-orange-200"
        }`}>
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
            isInvisible ? "bg-red-100" : "bg-white/70"
          }`}>
            <Eye className={`w-4 h-4 ${
              isInvisible ? "text-red-500" : discLevel! <= 2 ? "text-emerald-600" : "text-orange-500"
            }`} />
          </div>
          <div className="flex-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-0.5">
              Discoverability Threshold
            </p>
            <p className={`text-sm font-semibold ${isInvisible ? "text-red-700" : "text-gray-900"}`}>
              {isInvisible ? "Invisible — not found by any AI engine" : `Visible at Level ${discLevel} — ${discoverability.description}`}
            </p>
          </div>

          {/* Level ladder */}
          {!isInvisible && (
            <div className="flex items-center gap-1.5 shrink-0">
              {[1, 2, 3, 4, 5].map((l) => (
                <div
                  key={l}
                  className={`w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-bold ${
                    l <= discLevel!
                      ? LEVEL_COLORS[l - 1] + " text-white"
                      : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {l}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
