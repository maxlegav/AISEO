import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useLanguage } from "@/components/LanguageContext";
import Link from "next/link";
import {
  Globe,
  Briefcase,
  Calendar,
  Loader2,
  Clock,
  XCircle,
  ChevronRight,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface Business {
  _id: string;
  name: string;
  slug: string;
  primaryUrl: string;
  subUrls: string[];
  competitorUrls: string[];
  category: string;
  description?: string;
  createdAt: string;
}

interface Audit {
  _id: string;
  businessId: string;
  userId: string;
  businessName?: string;
  status: string;
  geoScore?: number | null;
  createdAt?: string;
  completedAt?: string;
  error?: string;
}

function mapUIStatus(status: string): "pending" | "processing" | "completed" | "failed" {
  if (status === "completed") return "completed";
  if (status === "failed" || status === "rejected") return "failed";
  if (status === "pending") return "pending";
  return "processing";
}

const POLL_INTERVAL_MS = 12000;

/* ─── GEO Score Ring ─── */
function GeoScoreRing({ score }: { score: number }) {
  const size = 160;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const color =
    score >= 70 ? "#10b981" : score >= 40 ? "#f97316" : "#ef4444";
  const label =
    score >= 70 ? "GOOD" : score >= 40 ? "MODERATE" : "CRITICAL";

  return (
    <div className="flex flex-col items-center">
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
          <span className="text-4xl font-bold text-gray-900">{score}%</span>
          <span
            className="text-[10px] font-bold uppercase tracking-wider mt-1"
            style={{ color }}
          >
            {label}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ─── Audit State Card ─── */
function AuditStateCard({
  audit,
  username,
  onRetry,
  onDelete,
}: {
  audit: Audit | null;
  username: string;
  onRetry?: () => void;
  onDelete?: () => void;
}) {
  const { t } = useLanguage();
  const uiStatus = audit ? mapUIStatus(audit.status) : "pending";

  if (!audit || uiStatus === "pending") {
    return (
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-10 border border-white/60 flex flex-col items-center justify-center text-center min-h-[260px] relative">
        {audit && onDelete && (
          <button
            onClick={onDelete}
            title="Delete audit"
            className="absolute top-4 right-4 text-gray-300 hover:text-red-400 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
        <Clock className="w-12 h-12 text-gray-300 mb-4" />
        <h3 className="text-lg font-semibold text-gray-700 mb-1">
          {String(t("audit.status.pending"))}
        </h3>
        <p className="text-sm text-gray-400 max-w-xs">
          {String(t("project.auditQueued"))}
        </p>
      </div>
    );
  }

  if (uiStatus === "processing") {
    return (
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-10 border border-white/60 flex flex-col items-center justify-center text-center min-h-[260px] relative">
        {onDelete && (
          <button
            onClick={onDelete}
            title="Delete audit"
            className="absolute top-4 right-4 text-gray-300 hover:text-red-400 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
        <div className="relative mb-6">
          <div className="w-20 h-20 rounded-full border-4 border-blue-100 flex items-center justify-center">
            <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
          </div>
        </div>
        <h3 className="text-lg font-semibold text-gray-800 mb-1">
          {String(t("audit.status.processing"))}
        </h3>
        <p className="text-sm text-gray-400 max-w-xs leading-relaxed">
          {String(t("project.auditRunning"))}
        </p>
        <div className="mt-4 flex items-center gap-1.5 text-xs text-gray-400">
          <RefreshCw className="w-3 h-3 animate-spin" />
          {String(t("project.autoRefresh"))}
        </div>
      </div>
    );
  }

  if (uiStatus === "failed") {
    return (
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-10 border border-red-100 flex flex-col items-center justify-center text-center min-h-[260px] relative">
        {onDelete && (
          <button
            onClick={onDelete}
            title="Delete audit"
            className="absolute top-4 right-4 text-gray-300 hover:text-red-400 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
        <XCircle className="w-12 h-12 text-red-400 mb-4" />
        <h3 className="text-lg font-semibold text-gray-700 mb-1">
          {String(t("audit.status.failed"))}
        </h3>
        <p className="text-sm text-gray-400 max-w-xs mb-5">
          {audit.error || String(t("project.auditFailed"))}
        </p>
        {onRetry && (
          <Button
            onClick={onRetry}
            variant="outline"
            className="rounded-full text-sm"
          >
            {String(t("project.retryAudit"))}
          </Button>
        )}
      </div>
    );
  }

  // Completed
  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 border border-white/60 relative">
      {onDelete && (
        <button
          onClick={onDelete}
          title="Delete audit"
          className="absolute top-4 right-4 text-gray-300 hover:text-red-400 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}
      <div className="flex items-center justify-between flex-wrap gap-6">
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            GEO Health Score
          </p>
          <GeoScoreRing score={audit.geoScore ?? 0} />
          {audit.completedAt && (
            <p className="text-xs text-gray-400 mt-3 text-center">
              {new Date(audit.completedAt).toLocaleDateString("fr-FR", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </p>
          )}
        </div>
        <div className="flex-1 min-w-[200px]">
          <h3 className="text-xl font-heading font-semibold text-gray-900 mb-2">
            {String(t("project.auditCompleted"))}
          </h3>
          <p className="text-sm text-gray-500 mb-6 leading-relaxed">
            {String(t("project.auditCompletedDesc"))}
          </p>
          <Link href={`/${username}/audits/${audit._id}`}>
            <Button className="bg-gray-900 hover:bg-gray-800 text-white rounded-full flex items-center gap-2">
              {String(t("project.viewFullReport"))}
              <ChevronRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ─── Page ─── */
export default function ProjectDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { username, projectSlug } = router.query;
  const [project, setProject] = useState<Business | null>(null);
  const [audit, setAudit] = useState<Audit | null>(null);
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

  /* Fetch business + latest audit */
  const fetchData = async (projectSlugVal: string) => {
    try {
      const businessRes = await fetch("/api/businesses/list");
      const businessData = await businessRes.json();
      if (businessData.success) {
        const found = businessData.data.find(
          (b: Business) => b.slug === projectSlugVal
        );
        if (found) {
          setProject(found);

          // Fetch latest audit for this business
          const auditRes = await fetch(
            `/api/audits/list?businessId=${found._id}`
          );
          const auditData = await auditRes.json();
          if (auditData.success && auditData.data.length > 0) {
            setAudit(auditData.data[0]); // already sorted by createdAt desc
            return auditData.data[0] as Audit;
          }
        }
      }
    } catch (err) {
      console.error("Failed to fetch project data:", err);
    } finally {
      setLoading(false);
    }
    return null;
  };

  useEffect(() => {
    if (status !== "authenticated" || !projectSlug) return;

    const slug = typeof projectSlug === "string" ? projectSlug : "";

    fetchData(slug).then((latestAudit) => {
      // Start polling if audit is not in a terminal state
      if (latestAudit) {
        const uiStatus = mapUIStatus(latestAudit.status);
        if (uiStatus === "pending" || uiStatus === "processing") {
          pollRef.current = setInterval(async () => {
            const updated = await fetchData(slug);
            if (updated) {
              const updatedUI = mapUIStatus(updated.status);
              if (updatedUI === "completed" || updatedUI === "failed") {
                if (pollRef.current) clearInterval(pollRef.current);
              }
            }
          }, POLL_INTERVAL_MS);
        }
      }
    });

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, projectSlug]);

  const handleDeleteAudit = async () => {
    if (!audit) return;
    if (!confirm("Delete this audit? This action cannot be undone.")) return;

    // Stop polling while deleting
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }

    await fetch(`/api/audits/${audit._id}`, { method: "DELETE" });
    setAudit(null);
  };

  const handleRetry = async () => {
    if (!project) return;
    await fetch("/api/audits/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        businessId: project._id,
        businessName: project.name,
        businessUrl: project.primaryUrl,
        businessType: project.category,
        category: project.category,
        description: project.description || project.category,
        subUrls: project.subUrls || [],
        competitorUrls: project.competitorUrls || [],
        language: "fr",
      }),
    });
    // Refetch
    if (typeof projectSlug === "string") {
      setLoading(true);
      fetchData(projectSlug);
    }
  };

  /* Loading skeleton */
  if (status === "loading" || loading) {
    return (
      <DashboardLayout activeMenu="dashboard">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-white/50 rounded-xl w-1/3" />
          <div className="h-5 bg-white/30 rounded w-1/2" />
          <div className="h-64 bg-white/50 rounded-2xl mt-8" />
        </div>
      </DashboardLayout>
    );
  }

  const createdDate = project?.createdAt
    ? new Date(project.createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
      })
    : null;

  return (
    <DashboardLayout activeMenu="dashboard">
      {/* Project Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-heading font-medium text-gray-900 mb-2">
          {project?.name ?? String(projectSlug)}
        </h1>
        <div className="flex items-center gap-4 text-sm text-gray-500 flex-wrap">
          {project?.primaryUrl && (
            <span className="flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5" />
              {project.primaryUrl}
            </span>
          )}
          {project?.category && (
            <span className="flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5" />
              {project.category}
            </span>
          )}
          {createdDate && (
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              {createdDate}
            </span>
          )}
        </div>
      </div>

      {/* Audit State */}
      <AuditStateCard
        audit={audit}
        username={typeof username === "string" ? username : ""}
        onRetry={handleRetry}
        onDelete={audit ? handleDeleteAudit : undefined}
      />
    </DashboardLayout>
  );
}
