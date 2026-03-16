import { useEffect, useRef, useCallback, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import {
  ArrowLeft, Loader2, Clock, XCircle, RefreshCw, CheckCircle2,
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useLanguage } from "@/components/LanguageContext";
import AuditHero from "@/components/audit/AuditHero";
import ActionPlan from "@/components/audit/ActionPlan";
import GeoQuickWins from "@/components/audit/GeoQuickWins";
import CompetitorComparison from "@/components/audit/CompetitorComparison";
import DeepDive from "@/components/audit/DeepDive";
import type { AuditDoc, IssueItem, PromptGapItem } from "@/components/audit/auditTypes";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mapUIStatus(status: string): "pending" | "processing" | "completed" | "failed" {
  if (status === "completed") return "completed";
  if (status === "failed" || status === "rejected") return "failed";
  if (status === "pending") return "pending";
  return "processing";
}

const POLL_INTERVAL_MS = 12_000;

// ─── Page ─────────────────────────────────────────────────────────────────────

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
          <div className="h-56 bg-white/50 rounded-2xl" />
          <div className="grid grid-cols-4 gap-3">
            {[0,1,2,3].map((i) => <div key={i} className="h-20 bg-white/50 rounded-2xl" />)}
          </div>
          <div className="h-48 bg-white/50 rounded-2xl" />
        </div>
      </DashboardLayout>
    );
  }

  const uiStatus = audit ? mapUIStatus(audit.status) : "pending";

  /* ── Pending / Processing ────────────────────────────────────────────────── */
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

  /* ── Failed ──────────────────────────────────────────────────────────────── */
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

  /* ── Completed ───────────────────────────────────────────────────────────── */
  const r = audit.results ?? {};
  const issues = (r.issues ?? []) as IssueItem[];
  const promptGaps = (r.promptGaps ?? []) as PromptGapItem[];
  const competitors = r.competitorResults ?? [];
  const engines = r.enginesSucceeded ?? r.enginesUsed ?? [];
  const promptResults = r.promptResults ?? [];
  const htmlScan = r.htmlScan ?? null;
  const categoryScores = r.categoryScores ?? {};
  const levelScores = r.levelScores ?? {};
  const citationStats = r.citationStats ?? null;
  const llmsTxtContent = r.llmsTxtContent ?? null;
  const llmHijackPrompt = r.llmHijackPrompt ?? null;
  const snap = r.businessSnapshot;
  const geoScore = audit.geoScore ?? 0;

  const hasQuickWins = !!(llmsTxtContent || llmHijackPrompt);

  return (
    <DashboardLayout activeMenu="audits">

      {/* ── Breadcrumb ─────────────────────────────────────────────────────── */}
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

      {/* ── Section 1: Hero ────────────────────────────────────────────────── */}
      <AuditHero audit={audit} results={r} />

      {/* ── Section 2: Action Plan ─────────────────────────────────────────── */}
      <ActionPlan issues={issues} promptGaps={promptGaps} hasQuickWins={hasQuickWins} />

      {/* ── Section 3: GEO Quick Wins ──────────────────────────────────────── */}
      <GeoQuickWins llmsTxtContent={llmsTxtContent} llmHijackPrompt={llmHijackPrompt} />

      {/* ── Section 4: Competitor Comparison ──────────────────────────────── */}
      <CompetitorComparison
        competitors={competitors}
        geoScore={geoScore}
        businessName={audit.businessName}
      />

      {/* ── Section 5: Deep Dive ───────────────────────────────────────────── */}
      <DeepDive
        promptResults={promptResults}
        htmlScan={htmlScan}
        citationStats={citationStats}
        categoryScores={categoryScores}
        levelScores={levelScores}
        engines={engines}
        htmlScore={r.htmlScannerScore ?? null}
      />

      {/* ── Business Snapshot ──────────────────────────────────────────────── */}
      {snap && (snap.category || snap.description || (snap.targetKeywords && snap.targetKeywords.length > 0)) && (
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-white/60 mb-4">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
              Business Context at Audit Time
            </h3>
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
