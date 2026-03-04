import { useEffect, useState, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useLanguage } from "@/components/LanguageContext";
import {
  ArrowLeft,
  Loader2,
  Clock,
  XCircle,
  RefreshCw,
  CheckCircle2,
  Eye,
  Globe,
  Target,
  Layers,
  Users,
  MessageSquare,
  FileSearch,
  Check,
  X,
  AlertTriangle,
  ExternalLink,
  Zap,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface EngineResult {
  mentioned: boolean;
  quality: number;
  position: number;
  responseTime: number;
  error: string | null;
  rawResponse?: string;
}

interface PromptResult {
  promptId: number;
  level: number;
  category: string;
  question: string;
  promptScore: number;
  mentionRate: number;
  engines: Record<string, EngineResult>;
}

interface CategoryScore {
  score: number;
  promptCount: number;
  avgMentionRate: number;
}

interface LevelScore {
  score: number;
  promptCount: number;
  avgMentionRate: number;
}

interface CompetitorResult {
  competitorUrl: string;
  competitorName: string;
  auditEngineScore: number;
  mentionRate: number;
  categoryScores: Record<string, number>;
  levelScores: Record<string, number>;
}

type HtmlScanRecord = Record<string, unknown>;

interface HtmlScan {
  url?: string;
  metaTags?: HtmlScanRecord;
  schemaOrg?: HtmlScanRecord;
  headingStructure?: HtmlScanRecord;
  imageAltText?: HtmlScanRecord;
  keywords?: { word: string; count: number; tfidf?: number }[];
  aiBotAccessibility?: HtmlScanRecord;
  robotsTxtAnalysis?: HtmlScanRecord;
  sitemapAnalysis?: HtmlScanRecord;
  legalPages?: HtmlScanRecord;
  llmsTxtAnalysis?: HtmlScanRecord;
  htmlScannerScore?: number;
  scanCompleteness?: Record<string, boolean>;
  scanErrors?: string[];
  hasBlockedUrls?: boolean;
  subPagesScanned?: { url: string; score: number }[];
}

interface AuditDoc {
  _id: string;
  businessId?: string;
  businessName?: string;
  status: string;
  geoScore?: number | null;
  createdAt?: string;
  completedAt?: string;
  error?: string;
  results?: {
    auditEngineScore?: number | null;
    htmlScannerScore?: number | null;
    discoverabilityThreshold?: {
      level: number | null;
      description: string;
    };
    categoryScores?: Record<string, CategoryScore>;
    levelScores?: Record<string, LevelScore>;
    competitorResults?: CompetitorResult[];
    enginesUsed?: string[];
    enginesSucceeded?: string[];
    totalPromptsProcessed?: number;
    totalResponsesReceived?: number;
    processingTimeMs?: number;
    promptResults?: PromptResult[];
    htmlScan?: HtmlScan | null;
    businessSnapshot?: {
      name?: string;
      primaryUrl?: string;
      category?: string;
      description?: string;
      businessType?: string;
      localityTier?: string;
      targetKeywords?: string[];
    };
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function mapUIStatus(status: string): "pending" | "processing" | "completed" | "failed" {
  if (status === "completed") return "completed";
  if (status === "failed" || status === "rejected") return "failed";
  if (status === "pending") return "pending";
  return "processing";
}

function scoreColor(score: number): string {
  if (score >= 70) return "#10b981";
  if (score >= 40) return "#f97316";
  return "#ef4444";
}

function scoreLabel(score: number): string {
  if (score >= 70) return "GOOD";
  if (score >= 40) return "MODERATE";
  return "CRITICAL";
}

function scoreTextClass(score: number): string {
  if (score >= 70) return "text-emerald-600";
  if (score >= 40) return "text-orange-500";
  return "text-red-500";
}

function scoreBarClass(score: number): string {
  if (score >= 70) return "bg-emerald-500";
  if (score >= 40) return "bg-orange-500";
  return "bg-red-500";
}

function pct(val: number): number {
  return Math.round(val * 100);
}

function getBool(obj: HtmlScanRecord | undefined, key: string): boolean | undefined {
  const val = obj?.[key];
  return typeof val === "boolean" ? val : undefined;
}

function getString(obj: HtmlScanRecord | undefined, key: string): string | undefined {
  const val = obj?.[key];
  return typeof val === "string" ? val : undefined;
}

function getNumber(obj: HtmlScanRecord | undefined, key: string): number | undefined {
  const val = obj?.[key];
  return typeof val === "number" ? val : undefined;
}

const CATEGORY_META: Record<string, { label: string; bar: string; pill: string }> = {
  discovery:   { label: "Discovery",   bar: "bg-blue-500",    pill: "bg-blue-50 text-blue-700" },
  comparison:  { label: "Comparison",  bar: "bg-purple-500",  pill: "bg-purple-50 text-purple-700" },
  reputation:  { label: "Reputation",  bar: "bg-amber-500",   pill: "bg-amber-50 text-amber-700" },
  product:     { label: "Product",     bar: "bg-teal-500",    pill: "bg-teal-50 text-teal-700" },
  alternative: { label: "Alternative", bar: "bg-orange-500",  pill: "bg-orange-50 text-orange-700" },
  trust:       { label: "Trust",       bar: "bg-emerald-500", pill: "bg-emerald-50 text-emerald-700" },
};

const LEVEL_COLORS = ["bg-emerald-500", "bg-green-500", "bg-yellow-500", "bg-orange-500", "bg-red-500"];
const LEVEL_TEXT   = ["text-emerald-600", "text-green-600", "text-yellow-600", "text-orange-600", "text-red-600"];
const LEVEL_LABELS: Record<number, string> = {
  1: "Broad queries",
  2: "Niche market",
  3: "Descriptive",
  4: "Very specific",
  5: "By name only",
};

const ENGINE_ABBR: Record<string, string> = {
  chatgpt:    "GPT",
  claude:     "CLN",
  perplexity: "PPX",
  gemini:     "GEM",
};

const POLL_INTERVAL_MS = 12_000;

// ─── Sub-components ───────────────────────────────────────────────────────────

function ScoreRing({ score, size = 148 }: { score: number; size?: number }) {
  const sw = 11;
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

function MiniScoreBar({
  label, sublabel, score, barClass,
}: {
  label: string; sublabel: string; score: number | null | undefined; barClass: string;
}) {
  const s = score ?? 0;
  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-5 border border-white/60 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{label}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">{sublabel}</p>
        </div>
        <span className={`text-2xl font-bold tabular-nums ${scoreTextClass(s)}`}>
          {score != null ? `${Math.round(s)}%` : "—"}
        </span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full ${barClass} rounded-full transition-all duration-700`}
          style={{ width: `${s}%` }}
        />
      </div>
    </div>
  );
}

function CategoryRow({ name, cat }: { name: string; cat: CategoryScore }) {
  const meta = CATEGORY_META[name] ?? { label: name, bar: "bg-gray-400", pill: "bg-gray-50 text-gray-700" };
  const scorePct = pct(cat.score);
  const mentionPct = pct(cat.avgMentionRate);
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${meta.pill}`}>
            {meta.label}
          </span>
          <span className="text-[11px] text-gray-400">{cat.promptCount} prompts</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-gray-400">
            {mentionPct}% mentioned
          </span>
          <span className={`text-sm font-bold tabular-nums ${scoreTextClass(scorePct)}`}>
            {scorePct}%
          </span>
        </div>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full ${meta.bar} rounded-full transition-all`}
          style={{ width: `${scorePct}%` }}
        />
      </div>
    </div>
  );
}

function LevelRow({ levelNum, data }: { levelNum: number; data: LevelScore }) {
  const idx = levelNum - 1;
  const barClass = LEVEL_COLORS[idx] ?? "bg-gray-400";
  const textClass = LEVEL_TEXT[idx] ?? "text-gray-600";
  const scorePct = pct(data.score);
  const mentionPct = pct(data.avgMentionRate);
  const levelLabel = LEVEL_LABELS[levelNum] ?? `Level ${levelNum}`;

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold tabular-nums ${textClass}`}>L{levelNum}</span>
          <span className="text-sm text-gray-600">{levelLabel}</span>
          <span className="text-[11px] text-gray-400">{data.promptCount} prompts</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-gray-400">{mentionPct}% mentioned</span>
          <span className={`text-sm font-bold tabular-nums ${textClass}`}>{scorePct}%</span>
        </div>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full ${barClass} rounded-full transition-all`}
          style={{ width: `${scorePct}%` }}
        />
      </div>
    </div>
  );
}

function EngineDot({ result, engine }: { result: EngineResult | undefined; engine: string }) {
  const abbr = ENGINE_ABBR[engine] ?? engine.slice(0, 3).toUpperCase();
  if (!result) return null;

  let dotClass = "bg-gray-200";
  let title = `${engine}: no data`;

  if (result.error) {
    dotClass = "bg-gray-300";
    title = `${engine}: error`;
  } else if (!result.mentioned) {
    dotClass = "bg-red-200";
    title = `${engine}: not mentioned`;
  } else if (result.quality >= 3) {
    dotClass = "bg-emerald-500";
    title = `${engine}: mentioned (quality ${result.quality}, rank ${result.position})`;
  } else if (result.quality >= 2) {
    dotClass = "bg-emerald-300";
    title = `${engine}: mentioned (quality ${result.quality}, rank ${result.position})`;
  } else {
    dotClass = "bg-yellow-400";
    title = `${engine}: mentioned (quality ${result.quality}, rank ${result.position})`;
  }

  return (
    <div className="flex flex-col items-center gap-0.5" title={title}>
      <div className={`w-2.5 h-2.5 rounded-full ${dotClass}`} />
      <span className="text-[9px] text-gray-400 font-mono">{abbr}</span>
    </div>
  );
}

function CheckRow({
  label, pass, info,
}: {
  label: string; pass: boolean | undefined; info?: string;
}) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
      <span className="text-sm text-gray-700">{label}</span>
      <div className="flex items-center gap-2">
        {info && <span className="text-xs text-gray-400">{info}</span>}
        {pass === true  && <Check className="w-4 h-4 text-emerald-500" />}
        {pass === false && <X className="w-4 h-4 text-red-400" />}
        {pass === undefined && <span className="text-xs text-gray-300">—</span>}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AuditDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { username, auditId } = router.query;
  const { t } = useLanguage();

  const [audit, setAudit] = useState<AuditDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [promptFilter, setPromptFilter] = useState<string>("all");
  const [expandedPrompt, setExpandedPrompt] = useState<number | null>(null);
  const [htmlTab, setHtmlTab] = useState<"overview" | "keywords" | "technical">("overview");

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* Auth guard */
  useEffect(() => {
    if (status === "unauthenticated") { router.push("/login"); return; }
    if (
      status === "authenticated" &&
      session?.user?.username && username &&
      session.user.username !== username
    ) router.push(`/${session.user.username}`);
  }, [status, session, username, router]);

  const fetchAudit = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/audits/${id}`);
      const data = await res.json();
      if (data.success) { setAudit(data.data); return data.data as AuditDoc; }
    } catch (err) {
      console.error("Failed to fetch audit:", err);
    } finally {
      setLoading(false);
    }
    return null;
  }, []);

  useEffect(() => {
    if (status !== "authenticated" || !auditId || typeof auditId !== "string") return;
    fetchAudit(auditId).then((fetched) => {
      if (!fetched) return;
      const ui = mapUIStatus(fetched.status);
      if (ui === "pending" || ui === "processing") {
        pollRef.current = setInterval(async () => {
          const updated = await fetchAudit(auditId);
          if (updated) {
            const updatedUI = mapUIStatus(updated.status);
            if (updatedUI === "completed" || updatedUI === "failed") {
              if (pollRef.current) clearInterval(pollRef.current);
            }
          }
        }, POLL_INTERVAL_MS);
      }
    });
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [status, auditId, fetchAudit]);

  /* Loading skeleton */
  if (status === "loading" || loading) {
    return (
      <DashboardLayout activeMenu="audits">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-white/50 rounded-xl w-1/3" />
          <div className="h-48 bg-white/50 rounded-2xl" />
          <div className="grid grid-cols-2 gap-4">
            <div className="h-24 bg-white/50 rounded-2xl" />
            <div className="h-24 bg-white/50 rounded-2xl" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const uiStatus = audit ? mapUIStatus(audit.status) : "pending";

  /* ── Pending / Processing ─────────────────────────────────────────────── */
  if (!audit || uiStatus === "pending" || uiStatus === "processing") {
    return (
      <DashboardLayout activeMenu="audits">
        <div className="flex items-center gap-2 mb-8">
          <button
            onClick={() => router.push(`/${session?.user?.username}/audits`)}
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" />
            {String(t("dashboard.audits"))}
          </button>
        </div>
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-16 border border-white/60 flex flex-col items-center justify-center text-center">
          {uiStatus === "processing" ? (
            <>
              <div className="w-24 h-24 rounded-full border-4 border-blue-100 flex items-center justify-center mb-6">
                <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
              </div>
              <h2 className="text-2xl font-heading font-medium text-gray-900 mb-2">
                {String(t("audit.status.processing"))}
              </h2>
              <p className="text-gray-500 max-w-sm leading-relaxed mb-6">
                {String(t("project.auditRunning"))}
              </p>
              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                {String(t("project.autoRefresh"))}
              </div>
            </>
          ) : (
            <>
              <div className="w-24 h-24 rounded-full border-4 border-gray-100 flex items-center justify-center mb-6">
                <Clock className="w-12 h-12 text-gray-300" />
              </div>
              <h2 className="text-2xl font-heading font-medium text-gray-900 mb-2">
                {String(t("audit.status.pending"))}
              </h2>
              <p className="text-gray-500 max-w-sm leading-relaxed mb-6">
                {String(t("project.auditQueued"))}
              </p>
              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                {String(t("project.autoRefresh"))}
              </div>
            </>
          )}
        </div>
      </DashboardLayout>
    );
  }

  /* ── Failed ───────────────────────────────────────────────────────────── */
  if (uiStatus === "failed") {
    return (
      <DashboardLayout activeMenu="audits">
        <div className="flex items-center gap-2 mb-8">
          <button
            onClick={() => router.push(`/${session?.user?.username}/audits`)}
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" />
            {String(t("dashboard.audits"))}
          </button>
        </div>
        <div className="bg-white/90 rounded-2xl p-16 border border-red-100 flex flex-col items-center text-center">
          <XCircle className="w-16 h-16 text-red-400 mb-4" />
          <h2 className="text-2xl font-heading font-medium text-gray-900 mb-2">
            {String(t("audit.status.failed"))}
          </h2>
          <p className="text-gray-500 max-w-sm">
            {audit?.error || String(t("project.auditFailed"))}
          </p>
        </div>
      </DashboardLayout>
    );
  }

  /* ── Completed ────────────────────────────────────────────────────────── */
  const r = audit.results ?? {};
  const geoScore = audit.geoScore ?? 0;
  const aiScore = r.auditEngineScore ?? null;
  const htmlScore = r.htmlScannerScore ?? null;
  const discoverability = r.discoverabilityThreshold;
  const categoryScores = r.categoryScores ?? {};
  const levelScores = r.levelScores ?? {};
  const competitors = r.competitorResults ?? [];
  const engines = r.enginesSucceeded ?? r.enginesUsed ?? [];
  const promptResults = r.promptResults ?? [];
  const htmlScan = r.htmlScan ?? null;
  const snap = r.businessSnapshot;

  const formattedDate = audit.completedAt
    ? new Date(audit.completedAt).toLocaleDateString("fr-FR", {
        day: "2-digit", month: "long", year: "numeric",
      })
    : null;

  const processingMin = r.processingTimeMs
    ? (r.processingTimeMs / 60_000).toFixed(1)
    : null;

  /* Prompts filter */
  const categories = Array.from(new Set(promptResults.map((p) => p.category))).sort();
  const filteredPrompts =
    promptFilter === "all"
      ? promptResults
      : promptResults.filter((p) => p.category === promptFilter);

  /* Discoverability visual */
  const discLevel = discoverability?.level ?? null;
  const isInvisible = discLevel === null;

  return (
    <DashboardLayout activeMenu="audits">

      {/* ── Breadcrumb ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push(`/${session?.user?.username}/audits`)}
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" />
            {String(t("dashboard.audits"))}
          </button>
          <span className="text-gray-300">/</span>
          <span className="text-sm text-gray-900 font-medium">
            {audit.businessName ?? "Audit"}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full">
          <CheckCircle2 className="w-3.5 h-3.5" />
          {String(t("audit.status.completed"))}
        </div>
      </div>

      {/* ── Hero card ──────────────────────────────────────────────────── */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 border border-white/60 mb-4">
        <div className="flex items-start justify-between gap-8 flex-wrap">
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
            <div className="flex items-center gap-2 flex-wrap">
              {engines.map((e) => (
                <span key={e} className="px-2.5 py-1 bg-gray-50 border border-gray-100 rounded-full text-xs text-gray-600 font-medium capitalize">
                  {e}
                </span>
              ))}
              {r.totalPromptsProcessed != null && (
                <span className="px-2.5 py-1 bg-blue-50 border border-blue-100 rounded-full text-xs text-blue-600 font-medium">
                  {r.totalResponsesReceived ?? "?"}/{r.totalPromptsProcessed * engines.length} responses
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
              {snap?.businessType && (
                <span className="px-2.5 py-1 bg-gray-50 border border-gray-100 rounded-full text-xs text-gray-500">
                  {snap.businessType}
                </span>
              )}
            </div>
          </div>

          {/* GEO Score Ring */}
          <div className="flex flex-col items-center gap-2 shrink-0">
            <ScoreRing score={geoScore} />
            <span className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">GEO Score</span>
          </div>
        </div>
      </div>

      {/* ── Score decomposition ─────────────────────────────────────────── */}
      {(aiScore != null || htmlScore != null) && (
        <div className="grid grid-cols-2 gap-4 mb-4">
          <MiniScoreBar
            label="AI Prompt Score"
            sublabel="70% of GEO score — AI engine visibility"
            score={aiScore}
            barClass={scoreBarClass(aiScore ?? 0)}
          />
          <MiniScoreBar
            label="HTML Technical Score"
            sublabel="30% of GEO score — Technical SEO & AI readiness"
            score={htmlScore}
            barClass={scoreBarClass(htmlScore ?? 0)}
          />
        </div>
      )}

      {/* ── Discoverability Threshold ───────────────────────────────────── */}
      {discoverability && (
        <div
          className={`rounded-2xl p-6 border mb-4 ${
            isInvisible
              ? "bg-red-50 border-red-200"
              : discLevel! <= 2
              ? "bg-emerald-50 border-emerald-200"
              : discLevel! <= 3
              ? "bg-yellow-50 border-yellow-200"
              : "bg-orange-50 border-orange-200"
          }`}
        >
          <div className="flex items-start gap-4 flex-wrap">
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                isInvisible ? "bg-red-100" : "bg-white/70"
              }`}
            >
              <Eye
                className={`w-5 h-5 ${
                  isInvisible
                    ? "text-red-500"
                    : discLevel! <= 2
                    ? "text-emerald-600"
                    : "text-orange-500"
                }`}
              />
            </div>
            <div className="flex-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                Discoverability Threshold
              </p>
              <p
                className={`text-base font-semibold mb-1 ${
                  isInvisible ? "text-red-700" : "text-gray-900"
                }`}
              >
                {isInvisible
                  ? "Invisible — not found by any AI engine"
                  : `Visible at Level ${discLevel}`}
              </p>
              <p className="text-sm text-gray-600">{discoverability.description}</p>
            </div>

            {/* Level ladder */}
            {!isInvisible && (
              <div className="flex items-center gap-1.5 shrink-0">
                {[1, 2, 3, 4, 5].map((l) => (
                  <div key={l} className="flex flex-col items-center gap-1">
                    <div
                      className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold ${
                        l <= discLevel!
                          ? LEVEL_COLORS[l - 1] + " text-white"
                          : "bg-gray-100 text-gray-400"
                      }`}
                    >
                      {l}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Performance Grid ────────────────────────────────────────────── */}
      {(Object.keys(categoryScores).length > 0 || Object.keys(levelScores).length > 0) && (
        <div className="grid lg:grid-cols-2 gap-4 mb-4">

          {/* Category Scores */}
          {Object.keys(categoryScores).length > 0 && (
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-white/60">
              <div className="flex items-center gap-2 mb-5">
                <Target className="w-4 h-4 text-gray-400" />
                <h2 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  {String(t("audit.categoryScores"))}
                </h2>
              </div>
              {Object.entries(categoryScores)
                .sort(([, a], [, b]) => b.score - a.score)
                .map(([cat, data]) => (
                  <CategoryRow key={cat} name={cat} cat={data} />
                ))}
            </div>
          )}

          {/* Level Scores */}
          {Object.keys(levelScores).length > 0 && (
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-white/60">
              <div className="flex items-center gap-2 mb-5">
                <Layers className="w-4 h-4 text-gray-400" />
                <h2 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  Specificity Levels
                </h2>
              </div>
              <p className="text-xs text-gray-400 mb-4 leading-relaxed">
                Level 1 = broad queries, Level 5 = cited by name. Lower discovery level = better.
              </p>
              {[1, 2, 3, 4, 5].map((l) => {
                const key = `level${l}`;
                const data = levelScores[key];
                if (!data) return null;
                return <LevelRow key={key} levelNum={l} data={data} />;
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Competitor Comparison ───────────────────────────────────────── */}
      {competitors.length > 0 && (
        <div className="bg-gray-900 rounded-2xl p-6 text-white mb-4">
          <div className="flex items-center gap-2 mb-5">
            <Users className="w-4 h-4 text-gray-400" />
            <h2 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              {String(t("audit.competitorComparison"))}
            </h2>
          </div>

          <div className="space-y-4">
            {/* Your business */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <div>
                  <span className="text-sm font-semibold text-blue-300">{audit.businessName}</span>
                  <span className="ml-2 text-[10px] text-blue-400/70 uppercase tracking-wider">You</span>
                </div>
                <span className={`text-sm font-bold tabular-nums ${scoreTextClass(geoScore)}`}>
                  {geoScore}%
                </span>
              </div>
              <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${geoScore}%` }} />
              </div>
            </div>

            {/* Competitors */}
            {competitors.map((comp, i) => {
              const compScore = Math.round(comp.auditEngineScore);
              const mentionPct = Math.round(comp.mentionRate * 100);
              return (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm text-gray-300 truncate max-w-[200px]">
                        {comp.competitorName || comp.competitorUrl}
                      </span>
                      {comp.competitorUrl && (
                        <a
                          href={comp.competitorUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="shrink-0"
                        >
                          <ExternalLink className="w-3 h-3 text-gray-500 hover:text-gray-300" />
                        </a>
                      )}
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-[11px] text-gray-500">{mentionPct}% mentioned</span>
                      <span
                        className={`text-sm font-bold tabular-nums ${
                          compScore >= geoScore ? "text-red-400" : "text-gray-300"
                        }`}
                      >
                        {compScore}%
                      </span>
                    </div>
                  </div>
                  <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        compScore >= geoScore ? "bg-red-500/70" : "bg-gray-500"
                      }`}
                      style={{ width: `${compScore}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Prompt Results Explorer ─────────────────────────────────────── */}
      {promptResults.length > 0 && (
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-white/60 mb-4">
          <div className="flex items-center gap-2 mb-5">
            <MessageSquare className="w-4 h-4 text-gray-400" />
            <h2 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
              AI Prompts — {promptResults.length} questions tested
            </h2>
          </div>

          {/* Category filter */}
          <div className="flex items-center gap-2 flex-wrap mb-4">
            <button
              onClick={() => setPromptFilter("all")}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                promptFilter === "all"
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              All ({promptResults.length})
            </button>
            {categories.map((cat) => {
              const meta = CATEGORY_META[cat];
              const count = promptResults.filter((p) => p.category === cat).length;
              return (
                <button
                  key={cat}
                  onClick={() => setPromptFilter(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    promptFilter === cat
                      ? "bg-gray-900 text-white"
                      : meta
                      ? `${meta.pill} hover:opacity-80`
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {meta?.label ?? cat} ({count})
                </button>
              );
            })}
          </div>

          {/* Engine legend */}
          {engines.length > 0 && (
            <div className="flex items-center gap-4 mb-3 flex-wrap">
              <span className="text-[11px] text-gray-400 font-medium">Engine legend:</span>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-[11px] text-gray-500">high quality mention</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                <span className="text-[11px] text-gray-500">low quality mention</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-200" />
                <span className="text-[11px] text-gray-500">not mentioned</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-gray-300" />
                <span className="text-[11px] text-gray-500">error</span>
              </div>
            </div>
          )}

          {/* Prompts table */}
          <div className="divide-y divide-gray-50">
            {filteredPrompts.map((p) => {
              const mentionPct = Math.round(p.mentionRate * 100);
              const meta = CATEGORY_META[p.category];
              const isExpanded = expandedPrompt === p.promptId;

              return (
                <div key={p.promptId}>
                  <button
                    className="w-full flex items-center gap-3 py-3 hover:bg-gray-50/50 rounded-lg px-2 transition-colors text-left"
                    onClick={() => setExpandedPrompt(isExpanded ? null : p.promptId)}
                  >
                    {/* Prompt # */}
                    <span className="text-[11px] text-gray-400 font-mono w-6 shrink-0 text-right">
                      {p.promptId}
                    </span>

                    {/* Category pill */}
                    {meta && (
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded shrink-0 ${meta.pill}`}>
                        {meta.label.slice(0, 4)}
                      </span>
                    )}

                    {/* Level badge */}
                    <span className={`text-[10px] font-bold shrink-0 ${LEVEL_TEXT[p.level - 1] ?? "text-gray-400"}`}>
                      L{p.level}
                    </span>

                    {/* Question */}
                    <span className="text-sm text-gray-700 flex-1 min-w-0 truncate">
                      {p.question}
                    </span>

                    {/* Mention rate */}
                    <span className={`text-xs font-bold tabular-nums shrink-0 ${
                      mentionPct >= 75 ? "text-emerald-600" : mentionPct >= 25 ? "text-orange-500" : "text-red-500"
                    }`}>
                      {mentionPct}%
                    </span>

                    {/* Engine dots */}
                    <div className="flex items-center gap-2 shrink-0">
                      {engines.map((e) => (
                        <EngineDot key={e} engine={e} result={p.engines[e]} />
                      ))}
                    </div>

                    {/* Expand chevron */}
                    {isExpanded
                      ? <ChevronUp className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      : <ChevronDown className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    }
                  </button>

                  {/* Expanded raw responses */}
                  {isExpanded && (
                    <div className="mx-2 mb-3 bg-gray-50 rounded-xl p-4 space-y-3">
                      <p className="text-xs font-semibold text-gray-600 mb-2">Raw AI responses:</p>
                      {engines.map((e) => {
                        const eng = p.engines[e];
                        if (!eng) return null;
                        return (
                          <div key={e} className="text-xs">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-gray-700 capitalize">{e}</span>
                              {eng.error ? (
                                <span className="text-red-500">Error: {eng.error}</span>
                              ) : eng.mentioned ? (
                                <span className="text-emerald-600">
                                  Mentioned · quality {eng.quality}/3 · rank {eng.position}
                                  {eng.responseTime > 0 && ` · ${eng.responseTime}ms`}
                                </span>
                              ) : (
                                <span className="text-red-400">Not mentioned</span>
                              )}
                            </div>
                            {eng.rawResponse && (
                              <p className="text-gray-500 leading-relaxed line-clamp-4 pl-3 border-l-2 border-gray-200">
                                {eng.rawResponse.slice(0, 400)}
                                {eng.rawResponse.length > 400 ? "…" : ""}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── HTML Technical Scan ─────────────────────────────────────────── */}
      {htmlScan && (
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-white/60 mb-4">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <FileSearch className="w-4 h-4 text-gray-400" />
              <h2 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                HTML Technical Scan
              </h2>
            </div>
            {htmlScan.htmlScannerScore != null && (
              <div className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full ${
                htmlScan.htmlScannerScore >= 70
                  ? "bg-emerald-50 text-emerald-700"
                  : htmlScan.htmlScannerScore >= 40
                  ? "bg-orange-50 text-orange-700"
                  : "bg-red-50 text-red-700"
              }`}>
                <Globe className="w-3.5 h-3.5" />
                {Math.round(htmlScan.htmlScannerScore)}%
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 mb-6 bg-gray-50 rounded-xl p-1 w-fit">
            {(["overview", "keywords", "technical"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setHtmlTab(tab)}
                className={`px-4 py-2 rounded-lg text-xs font-medium transition-all capitalize ${
                  htmlTab === tab
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Overview tab */}
          {htmlTab === "overview" && (
            <div className="space-y-6">

              {/* Meta tags */}
              {htmlScan.metaTags && Object.keys(htmlScan.metaTags).length > 0 && (
                <div>
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">
                    Meta Tags
                  </p>
                  <div className="space-y-2">
                    {Object.entries(htmlScan.metaTags).map(([key, val]) => {
                      if (typeof val !== "string" && typeof val !== "number") return null;
                      return (
                        <div key={key} className="flex items-start gap-3 text-sm">
                          <span className="text-gray-400 font-mono text-xs w-32 shrink-0 pt-0.5">{key}</span>
                          <span className="text-gray-700 break-all">{String(val).slice(0, 200)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Schema.org */}
              {htmlScan.schemaOrg && (
                <div>
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">
                    Schema.org / Structured Data
                  </p>
                  {(() => {
                    const types = htmlScan.schemaOrg?.["types"];
                    const count = htmlScan.schemaOrg?.["count"];
                    const hasSchema = Array.isArray(types) ? types.length > 0 : (typeof count === "number" ? count > 0 : false);
                    return (
                      <div className="flex items-center gap-3">
                        {hasSchema
                          ? <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                          : <AlertTriangle className="w-4 h-4 text-orange-400 shrink-0" />
                        }
                        <div>
                          {Array.isArray(types) && types.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5">
                              {(types as string[]).map((type) => (
                                <span key={type} className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded font-mono">
                                  {type}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-sm text-orange-600">
                              {hasSchema ? "Structured data detected" : "No structured data found — add Schema.org markup"}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Heading structure */}
              {htmlScan.headingStructure && Object.keys(htmlScan.headingStructure).length > 0 && (
                <div>
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">
                    Heading Structure
                  </p>
                  <div className="flex items-center gap-4 flex-wrap">
                    {(["h1", "h2", "h3", "h4", "h5", "h6"] as const).map((tag) => {
                      const val = getNumber(htmlScan.headingStructure, tag);
                      if (val == null) return null;
                      return (
                        <div key={tag} className="flex items-center gap-1.5">
                          <span className="text-xs font-mono text-gray-500 uppercase">{tag}</span>
                          <span className={`text-sm font-bold ${
                            tag === "h1" && val !== 1 ? "text-orange-500" : "text-gray-700"
                          }`}>{val}</span>
                        </div>
                      );
                    })}
                    {(() => {
                      const h1 = getNumber(htmlScan.headingStructure, "h1");
                      if (h1 != null && h1 !== 1) {
                        return (
                          <span className="text-xs text-orange-500 flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            {h1 === 0 ? "Missing H1" : `${h1} H1 tags (should be 1)`}
                          </span>
                        );
                      }
                      return null;
                    })()}
                  </div>
                </div>
              )}

              {/* Image alt text */}
              {htmlScan.imageAltText && (
                <div>
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">
                    Image Alt Text
                  </p>
                  {(() => {
                    const total = getNumber(htmlScan.imageAltText, "total");
                    const withAlt = getNumber(htmlScan.imageAltText, "withAlt") ?? getNumber(htmlScan.imageAltText, "with_alt");
                    const withoutAlt = getNumber(htmlScan.imageAltText, "withoutAlt") ?? getNumber(htmlScan.imageAltText, "without_alt");
                    if (total == null && withAlt == null) {
                      return <p className="text-sm text-gray-500">No image data</p>;
                    }
                    const totalVal = total ?? (withAlt ?? 0) + (withoutAlt ?? 0);
                    const pctAlt = totalVal > 0 ? Math.round(((withAlt ?? 0) / totalVal) * 100) : 0;
                    return (
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5">
                          <Check className="w-4 h-4 text-emerald-500" />
                          <span className="text-sm text-gray-700">{withAlt ?? 0} with alt</span>
                        </div>
                        {withoutAlt != null && withoutAlt > 0 && (
                          <div className="flex items-center gap-1.5">
                            <X className="w-4 h-4 text-red-400" />
                            <span className="text-sm text-gray-700">{withoutAlt} missing alt</span>
                          </div>
                        )}
                        <div className="h-1.5 w-24 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full"
                            style={{ width: `${pctAlt}%` }}
                          />
                        </div>
                        <span className={`text-xs font-bold ${pctAlt >= 80 ? "text-emerald-600" : "text-orange-500"}`}>
                          {pctAlt}%
                        </span>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* AI Bot Accessibility */}
              {htmlScan.aiBotAccessibility && Object.keys(htmlScan.aiBotAccessibility).length > 0 && (
                <div>
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">
                    AI Bot Accessibility
                  </p>
                  <div className="flex items-center gap-3 flex-wrap">
                    {Object.entries(htmlScan.aiBotAccessibility).map(([bot, accessible]) => (
                      <div key={bot} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border ${
                        accessible === true
                          ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                          : accessible === false
                          ? "bg-red-50 border-red-200 text-red-700"
                          : "bg-gray-50 border-gray-200 text-gray-600"
                      }`}>
                        {accessible === true
                          ? <Check className="w-3.5 h-3.5" />
                          : accessible === false
                          ? <X className="w-3.5 h-3.5" />
                          : <span className="w-3.5 h-3.5" />
                        }
                        {bot}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Keywords tab */}
          {htmlTab === "keywords" && (
            <div>
              {htmlScan.keywords && htmlScan.keywords.length > 0 ? (
                <>
                  <p className="text-sm text-gray-500 mb-4">
                    Top {htmlScan.keywords.length} keywords by TF-IDF frequency on your site.
                  </p>
                  <div className="flex items-start gap-2 flex-wrap">
                    {htmlScan.keywords.map((kw, i) => {
                      const maxCount = htmlScan.keywords?.[0]?.count ?? 1;
                      const relSize = 0.7 + (kw.count / maxCount) * 0.8;
                      return (
                        <span
                          key={i}
                          className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-lg font-medium"
                          style={{ fontSize: `${Math.max(11, Math.min(18, relSize * 14))}px` }}
                          title={`Count: ${kw.count}${kw.tfidf != null ? ` | TF-IDF: ${kw.tfidf.toFixed(3)}` : ""}`}
                        >
                          {kw.word}
                        </span>
                      );
                    })}
                  </div>

                  {/* Keywords table */}
                  <div className="mt-6 overflow-hidden rounded-xl border border-gray-100">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                        <tr>
                          <th className="text-left px-4 py-2.5 font-semibold">Keyword</th>
                          <th className="text-right px-4 py-2.5 font-semibold">Count</th>
                          {htmlScan.keywords[0]?.tfidf != null && (
                            <th className="text-right px-4 py-2.5 font-semibold">TF-IDF</th>
                          )}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {htmlScan.keywords.map((kw, i) => (
                          <tr key={i} className="hover:bg-gray-50/50">
                            <td className="px-4 py-2 text-gray-800">{kw.word}</td>
                            <td className="px-4 py-2 text-right text-gray-600 tabular-nums">{kw.count}</td>
                            {kw.tfidf != null && (
                              <td className="px-4 py-2 text-right text-gray-500 tabular-nums font-mono text-xs">
                                {kw.tfidf.toFixed(4)}
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <p className="text-sm text-gray-400">No keyword data available.</p>
              )}
            </div>
          )}

          {/* Technical tab */}
          {htmlTab === "technical" && (
            <div className="grid sm:grid-cols-2 gap-6">

              {/* robots.txt */}
              {htmlScan.robotsTxtAnalysis && (
                <div>
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                    robots.txt
                  </p>
                  <div className="bg-gray-50 rounded-xl p-4 space-y-0">
                    <CheckRow
                      label="robots.txt found"
                      pass={getBool(htmlScan.robotsTxtAnalysis, "found")}
                    />
                    <CheckRow
                      label="AI bots allowed"
                      pass={(() => {
                        const blocked = htmlScan.robotsTxtAnalysis?.["aiBotsBlocked"];
                        if (Array.isArray(blocked)) return blocked.length === 0;
                        const val = getBool(htmlScan.robotsTxtAnalysis, "aiBotsAllowed");
                        return val;
                      })()}
                    />
                    {(() => {
                      const blocked = htmlScan.robotsTxtAnalysis?.["aiBotsBlocked"];
                      if (Array.isArray(blocked) && blocked.length > 0) {
                        return (
                          <div className="pt-2">
                            <p className="text-xs text-red-500 font-medium mb-1">Blocked AI bots:</p>
                            <div className="flex flex-wrap gap-1">
                              {(blocked as string[]).map((b) => (
                                <span key={b} className="px-2 py-0.5 bg-red-50 text-red-600 text-xs rounded font-mono">{b}</span>
                              ))}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>
                </div>
              )}

              {/* Sitemap */}
              {htmlScan.sitemapAnalysis && (
                <div>
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                    Sitemap
                  </p>
                  <div className="bg-gray-50 rounded-xl p-4 space-y-0">
                    <CheckRow
                      label="sitemap.xml found"
                      pass={getBool(htmlScan.sitemapAnalysis, "found")}
                    />
                    <CheckRow
                      label="Valid format"
                      pass={getBool(htmlScan.sitemapAnalysis, "valid")}
                      info={
                        getNumber(htmlScan.sitemapAnalysis, "urlCount") != null
                          ? `${getNumber(htmlScan.sitemapAnalysis, "urlCount")} URLs`
                          : undefined
                      }
                    />
                  </div>
                </div>
              )}

              {/* llms.txt */}
              {htmlScan.llmsTxtAnalysis && (
                <div>
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                    llms.txt <span className="text-orange-500 ml-1">⚡ GEO key</span>
                  </p>
                  <div className="bg-gray-50 rounded-xl p-4 space-y-0">
                    <CheckRow
                      label="llms.txt present"
                      pass={getBool(htmlScan.llmsTxtAnalysis, "found")}
                    />
                    {getBool(htmlScan.llmsTxtAnalysis, "found") === false && (
                      <p className="text-xs text-orange-500 pt-2">
                        Adding llms.txt significantly improves AI engine visibility.
                      </p>
                    )}
                    {getString(htmlScan.llmsTxtAnalysis, "content") && (
                      <div className="mt-2">
                        <p className="text-xs text-gray-500 font-medium mb-1">Content preview:</p>
                        <pre className="text-xs text-gray-600 bg-white rounded-lg p-2 overflow-auto max-h-32 leading-relaxed">
                          {getString(htmlScan.llmsTxtAnalysis, "content")?.slice(0, 300)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Legal pages */}
              {htmlScan.legalPages && Object.keys(htmlScan.legalPages).length > 0 && (
                <div>
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                    Legal Pages
                  </p>
                  <div className="bg-gray-50 rounded-xl p-4 space-y-0">
                    {Object.entries(htmlScan.legalPages).map(([page, found]) => (
                      <CheckRow
                        key={page}
                        label={page.replace(/([A-Z])/g, " $1").replace(/_/g, " ").trim()}
                        pass={typeof found === "boolean" ? found : undefined}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Scan completeness */}
              {htmlScan.scanCompleteness && Object.keys(htmlScan.scanCompleteness).length > 0 && (
                <div>
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                    Scan Completeness
                  </p>
                  <div className="bg-gray-50 rounded-xl p-4 space-y-0">
                    {Object.entries(htmlScan.scanCompleteness).map(([check, ran]) => (
                      <CheckRow
                        key={check}
                        label={check.replace(/([A-Z])/g, " $1").replace(/_/g, " ").trim()}
                        pass={ran === true ? true : ran === false ? false : undefined}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Scan errors */}
              {htmlScan.scanErrors && htmlScan.scanErrors.length > 0 && (
                <div className="sm:col-span-2">
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                    Scan Errors
                  </p>
                  <div className="space-y-1">
                    {htmlScan.scanErrors.map((err, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-red-600">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        {err}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Business Snapshot ───────────────────────────────────────────── */}
      {snap && (snap.category || snap.description || (snap.targetKeywords && snap.targetKeywords.length > 0)) && (
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-white/60 mb-4">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-4 h-4 text-gray-400" />
            <h2 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
              Business Context at Audit Time
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            {snap.category && (
              <div>
                <p className="text-[11px] text-gray-400 mb-1">Category</p>
                <p className="text-gray-700">{snap.category}</p>
              </div>
            )}
            {snap.businessType && (
              <div>
                <p className="text-[11px] text-gray-400 mb-1">Business type</p>
                <p className="text-gray-700 capitalize">{snap.businessType}</p>
              </div>
            )}
            {snap.localityTier && (
              <div>
                <p className="text-[11px] text-gray-400 mb-1">Locality</p>
                <p className="text-gray-700 capitalize">{snap.localityTier.replace("_", " ")}</p>
              </div>
            )}
            {snap.description && (
              <div className="sm:col-span-2">
                <p className="text-[11px] text-gray-400 mb-1">Description</p>
                <p className="text-gray-700 leading-relaxed">{snap.description}</p>
              </div>
            )}
            {snap.targetKeywords && snap.targetKeywords.length > 0 && (
              <div className="sm:col-span-2">
                <p className="text-[11px] text-gray-400 mb-2">Target keywords</p>
                <div className="flex flex-wrap gap-1.5">
                  {snap.targetKeywords.map((kw) => (
                    <span key={kw} className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full">
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </DashboardLayout>
  );
}
