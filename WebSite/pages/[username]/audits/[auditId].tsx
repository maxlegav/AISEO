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
} from "lucide-react";

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
    categoryScores?: Record<string, number>;
    competitorResults?: { name: string; url?: string; score: number }[];
    enginesUsed?: string[];
    enginesSucceeded?: string[];
    htmlScan?: {
      hasSchema?: boolean;
      schemaTypes?: string[];
      metaTitle?: string;
      metaDescription?: string;
    } | null;
    htmlScannerScore?: number | null;
    totalPromptsProcessed?: number;
    totalResponsesReceived?: number;
  };
}

function mapUIStatus(
  status: string
): "pending" | "processing" | "completed" | "failed" {
  if (status === "completed") return "completed";
  if (status === "failed" || status === "rejected") return "failed";
  if (status === "pending") return "pending";
  return "processing";
}

const POLL_INTERVAL_MS = 12000;

/* ─── Score Ring ─── */
function ScoreRing({
  score,
  size = 140,
}: {
  score: number;
  size?: number;
}) {
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color =
    score >= 70 ? "#10b981" : score >= 40 ? "#f97316" : "#ef4444";
  const label =
    score >= 70 ? "GOOD" : score >= 40 ? "MODERATE" : "CRITICAL";

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-gray-900">{score}%</span>
        <span
          className="text-[10px] font-bold uppercase tracking-wider mt-0.5"
          style={{ color }}
        >
          {label}
        </span>
      </div>
    </div>
  );
}

/* ─── Category Bar ─── */
function CategoryBar({ name, score }: { name: string; score: number }) {
  const barColor =
    score >= 70
      ? "bg-emerald-500"
      : score >= 40
      ? "bg-orange-500"
      : "bg-red-500";
  const textColor =
    score >= 70
      ? "text-emerald-600"
      : score >= 40
      ? "text-orange-600"
      : "text-red-600";

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm text-gray-700 capitalize">{name}</span>
        <span className={`text-sm font-bold ${textColor}`}>
          {Math.round(score * 100)}%
        </span>
      </div>
      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full ${barColor} rounded-full transition-all`}
          style={{ width: `${Math.round(score * 100)}%` }}
        />
      </div>
    </div>
  );
}

export default function AuditDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { username, auditId } = router.query;
  const { t } = useLanguage();
  const [audit, setAudit] = useState<AuditDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* Auth guard */
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    if (
      status === "authenticated" &&
      session?.user?.username &&
      username &&
      session.user.username !== username
    ) {
      router.push(`/${session.user.username}`);
    }
  }, [status, session, username, router]);

  const fetchAudit = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/audits/${id}`);
      const data = await res.json();
      if (data.success) {
        setAudit(data.data);
        return data.data as AuditDoc;
      }
    } catch (err) {
      console.error("Failed to fetch audit:", err);
    } finally {
      setLoading(false);
    }
    return null;
  }, []);

  useEffect(() => {
    if (status !== "authenticated" || !auditId || typeof auditId !== "string")
      return;

    fetchAudit(auditId).then((fetched) => {
      if (!fetched) return;
      const uiStatus = mapUIStatus(fetched.status);
      if (uiStatus === "pending" || uiStatus === "processing") {
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

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [status, auditId, fetchAudit]);

  /* Loading skeleton */
  if (status === "loading" || loading) {
    return (
      <DashboardLayout activeMenu="audits">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-white/50 rounded-xl w-1/3" />
          <div className="h-64 bg-white/50 rounded-2xl" />
        </div>
      </DashboardLayout>
    );
  }

  const uiStatus = audit ? mapUIStatus(audit.status) : "pending";

  /* ── Pending / Processing ── */
  if (!audit || uiStatus === "pending" || uiStatus === "processing") {
    return (
      <DashboardLayout activeMenu="audits">
        {/* Breadcrumb */}
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

  /* ── Failed ── */
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

  /* ── Completed ── */
  const geoScore = audit.geoScore ?? 0;
  const categoryScores = audit.results?.categoryScores ?? {};
  const competitors = audit.results?.competitorResults ?? [];
  const enginesUsed = audit.results?.enginesSucceeded ?? audit.results?.enginesUsed ?? [];
  const totalPrompts = audit.results?.totalPromptsProcessed;
  const totalResponses = audit.results?.totalResponsesReceived;

  const formattedDate = audit.completedAt
    ? new Date(audit.completedAt).toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <DashboardLayout activeMenu="audits">
      {/* Breadcrumb */}
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

      {/* Header card: score + meta */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 border border-white/60 mb-6">
        <div className="flex items-center justify-between gap-8 flex-wrap">
          <div>
            <h1 className="text-3xl font-heading font-medium text-gray-900 mb-1">
              {audit.businessName ?? "Audit Report"}
            </h1>
            {formattedDate && (
              <p className="text-sm text-gray-400">{formattedDate}</p>
            )}
            {enginesUsed.length > 0 && (
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                {enginesUsed.map((e) => (
                  <span
                    key={e}
                    className="px-2.5 py-1 bg-gray-50 border border-gray-100 rounded-full text-xs text-gray-600 font-medium capitalize"
                  >
                    {e}
                  </span>
                ))}
              </div>
            )}
            {totalPrompts != null && (
              <p className="text-xs text-gray-400 mt-3">
                {totalResponses}/{totalPrompts * enginesUsed.length} responses collected
              </p>
            )}
          </div>
          <ScoreRing score={geoScore} />
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Category Scores */}
        {Object.keys(categoryScores).length > 0 && (
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-white/60">
            <h2 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-5">
              {String(t("audit.categoryScores"))}
            </h2>
            {Object.entries(categoryScores).map(([cat, score]) => (
              <CategoryBar key={cat} name={cat} score={score} />
            ))}
          </div>
        )}

        {/* Competitor Comparison */}
        {competitors.length > 0 && (
          <div className="bg-gray-900 rounded-2xl p-6 text-white">
            <h2 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-5">
              {String(t("audit.competitorComparison"))}
            </h2>
            <div className="space-y-4">
              {/* Your score */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-semibold text-blue-300">
                    {audit.businessName}
                  </span>
                  <span className="text-sm font-bold text-gray-200">
                    {geoScore}%
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${geoScore}%` }}
                  />
                </div>
              </div>
              {/* Competitors */}
              {competitors.map((comp, i) => {
                const compScore = Math.round(comp.score * 100);
                return (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm text-gray-300 truncate max-w-[180px]">
                        {comp.name || comp.url}
                      </span>
                      <span className="text-sm font-bold text-gray-300">
                        {compScore}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gray-500 rounded-full"
                        style={{ width: `${compScore}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
