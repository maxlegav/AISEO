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
} from "lucide-react";

type AuditStatus = "completed" | "processing" | "pending";

interface MockAudit {
  id: string;
  projectName: string;
  score: number;
  status: AuditStatus;
  date: string;
  engines: string[];
}

const MOCK_AUDITS: MockAudit[] = [
  {
    id: "mock-1",
    projectName: "Acme Corp",
    score: 34,
    status: "completed",
    date: "2026-02-06",
    engines: ["ChatGPT", "Claude", "Perplexity", "DeepSeek"],
  },
  {
    id: "mock-2",
    projectName: "Fine Dining Paris",
    score: 78,
    status: "completed",
    date: "2026-02-04",
    engines: ["ChatGPT", "Claude", "Perplexity"],
  },
  {
    id: "mock-3",
    projectName: "Artisan Coffee",
    score: 62,
    status: "completed",
    date: "2026-01-28",
    engines: ["ChatGPT", "Claude", "Perplexity", "DeepSeek"],
  },
  {
    id: "mock-4",
    projectName: "Tech Startups NY",
    score: 28,
    status: "completed",
    date: "2026-01-25",
    engines: ["ChatGPT", "Claude"],
  },
  {
    id: "mock-5",
    projectName: "Luxury Retail",
    score: 0,
    status: "pending",
    date: "2026-02-08",
    engines: ["ChatGPT", "Claude", "Perplexity", "DeepSeek"],
  },
  {
    id: "mock-6",
    projectName: "Acme Corp",
    score: 0,
    status: "processing",
    date: "2026-02-08",
    engines: ["ChatGPT", "Claude", "Perplexity", "DeepSeek"],
  },
];

function scoreColor(score: number) {
  if (score >= 70) return "text-emerald-600";
  if (score >= 40) return "text-orange-500";
  return "text-red-500";
}

function StatusBadge({ status }: { status: AuditStatus }) {
  const { t } = useLanguage();
  const config = {
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
  const [filter, setFilter] = useState<"all" | AuditStatus>("all");

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

  const filteredAudits =
    filter === "all"
      ? MOCK_AUDITS
      : MOCK_AUDITS.filter((a) => a.status === filter);

  const filterTabs: {
    key: "all" | AuditStatus;
    label: string;
    count: number;
  }[] = [
    {
      key: "all",
      label: String(t("audit.filterAll")),
      count: MOCK_AUDITS.length,
    },
    {
      key: "completed",
      label: String(t("audit.filterCompleted")),
      count: MOCK_AUDITS.filter((a) => a.status === "completed").length,
    },
    {
      key: "processing",
      label: String(t("audit.filterProcessing")),
      count: MOCK_AUDITS.filter((a) => a.status === "processing").length,
    },
    {
      key: "pending",
      label: String(t("audit.filterPending")),
      count: MOCK_AUDITS.filter((a) => a.status === "pending").length,
    },
  ];

  if (status === "loading") {
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
        <p className="text-gray-500">
          {String(t("audit.listSubtitle"))}
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 mb-6">
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
          filteredAudits.map((audit) => (
            <Link
              key={audit.id}
              href={`/${session?.user?.username}/audits/${audit.id}`}
              className="block bg-white/90 backdrop-blur-sm rounded-2xl border border-white/60 hover:shadow-md transition-all p-5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-5">
                  {audit.status === "completed" ? (
                    <ScoreRing score={audit.score} />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center">
                      {audit.status === "processing" ? (
                        <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                      ) : (
                        <Clock className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  )}

                  <div>
                    <h3 className="font-semibold text-gray-900 text-[16px]">
                      {audit.projectName}
                    </h3>
                    <p className="text-sm text-gray-400 mt-0.5">{audit.date}</p>
                    <div className="flex items-center gap-1.5 mt-2">
                      {audit.engines.map((engine) => (
                        <span
                          key={engine}
                          className="px-2 py-0.5 bg-gray-50 rounded text-[11px] text-gray-500 font-medium"
                        >
                          {engine}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <StatusBadge status={audit.status} />
              </div>
            </Link>
          ))
        )}
      </div>
    </DashboardLayout>
  );
}
