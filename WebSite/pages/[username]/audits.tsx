import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useLanguage } from "@/components/LanguageContext";
import Link from "next/link";
import {
  CheckCircle2,
  Clock,
  Loader2,
  XCircle,
} from "lucide-react";

type UIStatus = "completed" | "processing" | "pending" | "failed";

interface Audit {
  _id: string;
  businessId?: string;
  businessName?: string;
  businessPrimaryUrl?: string;
  status: string;
  geoScore?: number;
  createdAt?: string;
  completedAt?: string;
}

function mapToUIStatus(dbStatus: string): UIStatus {
  if (dbStatus === "completed") return "completed";
  if (dbStatus === "pending") return "pending";
  if (dbStatus === "failed" || dbStatus === "rejected") return "failed";
  return "processing";
}

function scoreColor(score: number) {
  if (score >= 70) return "text-emerald-600";
  if (score >= 40) return "text-orange-500";
  return "text-red-500";
}

function StatusBadge({ status }: { status: UIStatus }) {
  const { t } = useLanguage();
  const config: Record<UIStatus, { bg: string; icon: React.ReactNode; label: string }> = {
    completed: {
      bg: "bg-emerald-50 text-emerald-700",
      icon: <CheckCircle2 className="w-3.5 h-3.5" />,
      label: String(t("audit.status.completed")),
    },
    processing: {
      bg: "bg-blue-50 text-blue-700",
      icon: <Loader2 className="w-3.5 h-3.5 animate-spin" />,
      label: String(t("audit.status.processing")),
    },
    pending: {
      bg: "bg-gray-100 text-gray-600",
      icon: <Clock className="w-3.5 h-3.5" />,
      label: String(t("audit.status.pending")),
    },
    failed: {
      bg: "bg-red-50 text-red-600",
      icon: <XCircle className="w-3.5 h-3.5" />,
      label: String(t("audit.status.failed")),
    },
  };
  const c = config[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${c.bg}`}
    >
      {c.icon}
      {c.label}
    </span>
  );
}

function ScoreRing({ score, size = 56 }: { score: number; size?: number }) {
  const radius = (size - 6) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={4}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#auditScoreGrad)"
          strokeWidth={4}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700"
        />
        <defs>
          <linearGradient
            id="auditScoreGrad"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="0%"
          >
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`text-sm font-bold ${scoreColor(score)}`}>
          {score}%
        </span>
      </div>
    </div>
  );
}

export default function AuditsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { username } = router.query;
  const { t } = useLanguage();
  const [filter, setFilter] = useState<"all" | UIStatus>("all");
  const [audits, setAudits] = useState<Audit[]>([]);
  const [loadingAudits, setLoadingAudits] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    if (status === "authenticated" && !session?.user?.username) {
      router.push("/username-setup");
      return;
    }
    if (
      status === "authenticated" &&
      session?.user?.username &&
      username &&
      session.user.username !== username
    ) {
      router.push(`/${session.user.username}`);
      return;
    }
  }, [status, session, username, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    const fetchAudits = async () => {
      try {
        const res = await fetch("/api/audits/list");
        const data = await res.json();
        if (data.success) {
          setAudits(data.data);
        }
      } catch (err) {
        console.error("Failed to fetch audits:", err);
      } finally {
        setLoadingAudits(false);
      }
    };
    fetchAudits();
  }, [status]);

  const uiAudits = audits.map((a) => ({
    ...a,
    uiStatus: mapToUIStatus(a.status),
  }));

  const filteredAudits =
    filter === "all"
      ? uiAudits
      : uiAudits.filter((a) => a.uiStatus === filter);

  const counts = {
    all: uiAudits.length,
    completed: uiAudits.filter((a) => a.uiStatus === "completed").length,
    processing: uiAudits.filter((a) => a.uiStatus === "processing").length,
    pending: uiAudits.filter((a) => a.uiStatus === "pending").length,
    failed: uiAudits.filter((a) => a.uiStatus === "failed").length,
  };

  const filterTabs: { key: "all" | UIStatus; label: string; count: number }[] =
    [
      { key: "all", label: String(t("audit.filterAll")), count: counts.all },
      {
        key: "completed",
        label: String(t("audit.filterCompleted")),
        count: counts.completed,
      },
      {
        key: "processing",
        label: String(t("audit.filterProcessing")),
        count: counts.processing,
      },
      {
        key: "pending",
        label: String(t("audit.filterPending")),
        count: counts.pending,
      },
      ...(counts.failed > 0
        ? [
            {
              key: "failed" as UIStatus,
              label: String(t("audit.status.failed")),
              count: counts.failed,
            },
          ]
        : []),
    ];

  if (status === "loading" || loadingAudits) {
    return (
      <DashboardLayout activeMenu="audits">
        <div className="animate-pulse space-y-6">
          <div className="h-10 bg-white/50 rounded-xl w-1/3" />
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-white/50 rounded-2xl" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout activeMenu="audits">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-heading font-medium text-gray-900 mb-2">
          {String(t("audit.listTitle"))}
        </h1>
        <p className="text-gray-500">{String(t("audit.listSubtitle"))}</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        {filterTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              filter === tab.key
                ? "bg-gray-900 text-white shadow-md"
                : "bg-white/80 text-gray-600 hover:bg-white border border-gray-200/60"
            }`}
          >
            {tab.label}
            <span
              className={`ml-1.5 ${
                filter === tab.key ? "text-white/70" : "text-gray-400"
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Audit Cards */}
      <div className="space-y-3">
        {filteredAudits.length === 0 ? (
          <div className="bg-white/90 rounded-2xl p-12 border border-white/60 text-center">
            <p className="text-gray-500">{String(t("audit.noAudits"))}</p>
          </div>
        ) : (
          filteredAudits.map((audit) => {
            const formattedDate = audit.createdAt
              ? new Date(audit.createdAt).toLocaleDateString("fr-FR", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })
              : "-";

            return (
              <Link
                key={audit._id}
                href={`/${session?.user?.username}/audits/${audit._id}`}
                className="block bg-white/90 backdrop-blur-sm rounded-2xl border border-white/60 hover:shadow-md transition-all p-5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-5">
                    {audit.uiStatus === "completed" && audit.geoScore != null ? (
                      <ScoreRing score={audit.geoScore} />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center">
                        {audit.uiStatus === "processing" ? (
                          <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                        ) : audit.uiStatus === "failed" ? (
                          <XCircle className="w-5 h-5 text-red-400" />
                        ) : (
                          <Clock className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                    )}

                    <div>
                      <h3 className="font-semibold text-gray-900 text-[16px]">
                        {audit.businessName || "—"}
                      </h3>
                      {audit.businessPrimaryUrl && (
                        <p className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">
                          {audit.businessPrimaryUrl}
                        </p>
                      )}
                      <p className="text-sm text-gray-400 mt-0.5">
                        {formattedDate}
                      </p>
                    </div>
                  </div>

                  <StatusBadge status={audit.uiStatus} />
                </div>
              </Link>
            );
          })
        )}
      </div>
    </DashboardLayout>
  );
}
