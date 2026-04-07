import { useEffect, useRef, useCallback, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import {
  ArrowLeft, Loader2, Clock, XCircle, RefreshCw, CheckCircle2,
  Share2, Copy, Check, X, Download,
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useLanguage } from "@/components/LanguageContext";
import AuditHero from "@/components/audit/AuditHero";
import ActionPlan from "@/components/audit/ActionPlan";
import GeoQuickWins from "@/components/audit/GeoQuickWins";
import CompetitorComparison from "@/components/audit/CompetitorComparison";
import DeepDive from "@/components/audit/DeepDive";
import AuditComparison from "@/components/audit/AuditComparison";
import type { AuditDoc, IssueItem, PromptGapItem, HtmlScan } from "@/components/audit/auditTypes";
import { buildSignalItems } from "@/components/audit/auditHelpers";

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

  // Share state
  const [shareModal, setShareModal] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [shareLoading, setShareLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  /* Auth guard */
  useEffect(() => {
    if (status === "unauthenticated") { router.push("/login"); return; }
    if (
      status === "authenticated" &&
      session?.user?.username && username &&
      session.user.username !== username
    ) router.push(`/${session.user.username}`);
  }, [status, session, username, router]);

  const handleShare = async () => {
    if (!audit) return;
    if (audit.shareToken) {
      // Already shared — reuse existing URL
      const url = `${window.location.origin}/share/${audit.shareToken}`;
      setShareUrl(url);
      setShareModal(true);
      return;
    }
    setShareLoading(true);
    try {
      const res = await fetch(`/api/audits/${audit._id}/share`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setShareUrl(data.data.shareUrl);
        setAudit((prev) => prev ? { ...prev, shareToken: data.data.shareToken } : prev);
        setShareModal(true);
      }
    } finally {
      setShareLoading(false);
    }
  };

  const handleCopy = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleRevokeShare = async () => {
    if (!audit) return;
    await fetch(`/api/audits/${audit._id}/share`, { method: 'DELETE' });
    setAudit((prev) => prev ? { ...prev, shareToken: null } : prev);
    setShareUrl(null);
    setShareModal(false);
  };

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

  const faqSchemaContent: string | null = promptGaps.length > 0
    ? `<script type="application/ld+json">\n{\n  "@context": "https://schema.org",\n  "@type": "FAQPage",\n  "mainEntity": [\n${
        promptGaps.map((gap) => {
          const answer = `${snap?.name ?? "We"} — [fill in your specific answer to this question]. Add details about ${gap.category === "comparison" ? "how you compare to alternatives" : gap.category === "reputation" ? "your credentials and track record" : gap.category === "trust" ? "your guarantees and certifications" : "your products and services"}.`;
          return `    {\n      "@type": "Question",\n      "name": ${JSON.stringify(gap.question)},\n      "acceptedAnswer": {\n        "@type": "Answer",\n        "text": ${JSON.stringify(answer)}\n      }\n    }`;
        }).join(",\n")
      }\n  ]\n}\n</script>`
    : null;

  const hasQuickWins = !!(llmsTxtContent || llmHijackPrompt || faqSchemaContent);
  const signalItems = htmlScan ? buildSignalItems(htmlScan as HtmlScan) : [];

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
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {String(t("audit.status.completed"))}
          </div>
          <a
            href={audit ? `/api/audits/${audit._id}/export-json` : "#"}
            download
            className="flex items-center gap-1.5 text-xs text-gray-600 bg-white hover:bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-full transition-colors"
            title="Télécharger les données brutes JSON"
          >
            <Download className="w-3.5 h-3.5" />
            JSON
          </a>
          <button
            onClick={handleShare}
            disabled={shareLoading}
            className="flex items-center gap-1.5 text-xs text-gray-600 bg-white hover:bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-full transition-colors disabled:opacity-50"
          >
            {shareLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Share2 className="w-3.5 h-3.5" />}
            Share report
          </button>
        </div>
      </div>

      {/* ── Share Modal ───────────────────────────────────────────────────── */}
      {shareModal && shareUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-gray-900">Share this report</h3>
                <p className="text-xs text-gray-500 mt-0.5">Anyone with this link can view the report — no login required.</p>
              </div>
              <button onClick={() => setShareModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 mb-4">
              <span className="text-xs text-gray-600 truncate flex-1">{shareUrl}</span>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 text-xs font-medium text-violet-600 hover:text-violet-700 shrink-0"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            <div className="flex items-center justify-between">
              <button
                onClick={handleRevokeShare}
                className="text-xs text-red-500 hover:text-red-600 underline"
              >
                Revoke link
              </button>
              <button
                onClick={() => setShareModal(false)}
                className="text-xs text-gray-500 hover:text-gray-700 bg-gray-100 px-4 py-2 rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Section 1: Hero ────────────────────────────────────────────────── */}
      <AuditHero audit={audit} results={r} />

      {/* ── Comparison vs previous audit (Pro/Agency only) ───────────────── */}
      {(session?.user?.subscriptionTier === 'pro' || session?.user?.subscriptionTier === 'agency') ? (
        audit.previousAuditId && (
          <div className="mb-4">
            <AuditComparison
              previousAuditId={audit.previousAuditId}
              currentAudit={{ geoScore: audit.geoScore, results: audit.results }}
            />
          </div>
        )
      ) : null}

      {/* ── Section 2: Action Plan ─────────────────────────────────────────── */}
      <ActionPlan
        issues={issues}
        promptGaps={promptGaps}
        hasQuickWins={hasQuickWins}
        categoryScores={categoryScores}
        htmlKeywords={(htmlScan as { keywords?: { word: string; count: number; tfidf?: number }[] } | null)?.keywords ?? []}
        businessSnapshot={snap ? {
          name: snap.name,
          category: snap.category,
          description: snap.description,
          primaryUrl: snap.primaryUrl,
          targetKeywords: snap.targetKeywords,
        } : undefined}
        auditId={audit._id}
        signalItems={signalItems}
      />

      {/* ── Section 3: GEO Quick Wins ──────────────────────────────────────── */}
      <GeoQuickWins llmsTxtContent={llmsTxtContent} llmHijackPrompt={llmHijackPrompt} faqSchemaContent={faqSchemaContent} />

      {/* ── Section 4: Deep Dive ───────────────────────────────────────────── */}
      <div id="deep-dive">
        <DeepDive
          promptResults={promptResults}
          htmlScan={htmlScan}
          citationStats={citationStats}
          categoryScores={categoryScores}
          levelScores={levelScores}
          engines={engines}
          htmlScore={r.htmlScannerScore ?? null}
          businessSnapshot={snap ? {
            name: snap.name,
            category: snap.category,
            description: snap.description,
            primaryUrl: snap.primaryUrl,
            targetKeywords: snap.targetKeywords,
          } : undefined}
          promptGaps={promptGaps}
        />
      </div>

      {/* ── Section 5: Competitor Comparison ──────────────────────────────── */}
      <div id="competitors">
        <CompetitorComparison
          competitors={competitors}
          geoScore={geoScore}
          businessName={audit.businessName}
        />
      </div>

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
