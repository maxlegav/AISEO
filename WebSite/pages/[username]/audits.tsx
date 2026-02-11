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
    projectName: "Mon Site Web",
    score: 72,
    status: "completed",
    date: "2026-02-06",
    engines: ["ChatGPT", "Claude", "Perplexity"],
  },
  {
    id: "mock-2",
    projectName: "E-commerce Store",
    score: 45,
    status: "completed",
    date: "2026-02-04",
    engines: ["ChatGPT", "Claude", "DeepSeek"],
  },
  {
    id: "mock-3",
    projectName: "Blog Tech",
    score: 0,
    status: "processing",
    date: "2026-02-08",
    engines: ["ChatGPT", "Claude", "Perplexity", "DeepSeek"],
  },
  {
    id: "mock-4",
    projectName: "Restaurant Le Gourmet",
    score: 83,
    status: "completed",
    date: "2026-01-28",
    engines: ["ChatGPT", "Claude", "Perplexity", "DeepSeek"],
  },
  {
    id: "mock-5",
    projectName: "Agence Marketing Pro",
    score: 31,
    status: "completed",
    date: "2026-01-25",
    engines: ["ChatGPT", "Claude"],
  },
  {
    id: "mock-6",
    projectName: "SaaS Platform",
    score: 0,
    status: "pending",
    date: "2026-02-08",
    engines: ["ChatGPT", "Claude", "Perplexity", "DeepSeek"],
  },
  {
    id: "mock-7",
    projectName: "Mon Site Web",
    score: 58,
    status: "completed",
    date: "2026-01-15",
    engines: ["ChatGPT", "Claude", "Perplexity"],
  },
];

function scoreColor(score: number) {
  if (score >= 70) return "text-green-600";
  if (score >= 40) return "text-orange-500";
  return "text-red-500";
}

function scoreBg(score: number) {
  if (score >= 70) return "from-green-400 to-green-500";
  if (score >= 40) return "from-orange-400 to-amber-500";
  return "from-red-400 to-red-500";
}

function StatusBadge({ status }: { status: AuditStatus }) {
  const { t } = useLanguage();
  const config = {
    completed: {
      bg: "bg-green-100 text-green-700",
      icon: <CheckCircle2 className="w-3.5 h-3.5" />,
      label: String(t("audit.status.completed")),
    },
    processing: {
      bg: "bg-blue-100 text-blue-700",
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
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${c.bg}`}>
      {c.icon}
      {c.label}
    </span>
  );
}

function ScoreRing({ score, size = 64 }: { score: number; size?: number }) {
  const radius = (size - 8) / 2;
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
          stroke="url(#scoreGrad)"
          strokeWidth={4}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700"
        />
        <defs>
          <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#9333ea" />
            <stop offset="100%" stopColor="#f97316" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`text-sm font-bold ${scoreColor(score)}`}>{score}%</span>
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

  const filteredAudits = filter === "all"
    ? MOCK_AUDITS
    : MOCK_AUDITS.filter((a) => a.status === filter);

  const filterTabs: { key: "all" | AuditStatus; label: string; count: number }[] = [
    { key: "all", label: String(t("audit.filterAll")), count: MOCK_AUDITS.length },
    { key: "completed", label: String(t("audit.filterCompleted")), count: MOCK_AUDITS.filter((a) => a.status === "completed").length },
    { key: "processing", label: String(t("audit.filterProcessing")), count: MOCK_AUDITS.filter((a) => a.status === "processing").length },
    { key: "pending", label: String(t("audit.filterPending")), count: MOCK_AUDITS.filter((a) => a.status === "pending").length },
  ];

  if (status === "loading") {
    return (
      <DashboardLayout activeMenu="audits">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-2xl" />
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
        <h1 className="text-4xl font-serif font-medium text-gray-900 mb-2">
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
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              filter === tab.key
                ? "bg-gradient-to-r from-purple-600 to-orange-500 text-white shadow-md"
                : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
            }`}
          >
            {tab.label}
            <span className={`ml-1.5 ${filter === tab.key ? "text-white/80" : "text-gray-400"}`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Audit Cards */}
      <div className="space-y-4">
        {filteredAudits.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 border border-gray-200 text-center">
            <p className="text-gray-500">{String(t("audit.noAudits"))}</p>
          </div>
        ) : (
          filteredAudits.map((audit) => (
            <Link
              key={audit.id}
              href={`/${session?.user?.username}/audits/${audit.id}`}
              className="block bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all p-6"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-5">
                  {audit.status === "completed" ? (
                    <ScoreRing score={audit.score} />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                      {audit.status === "processing" ? (
                        <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                      ) : (
                        <Clock className="w-6 h-6 text-gray-400" />
                      )}
                    </div>
                  )}

                  <div>
                    <h3 className="font-semibold text-gray-900 text-lg">{audit.projectName}</h3>
                    <p className="text-sm text-gray-500 mt-0.5">{audit.date}</p>
                    <div className="flex items-center gap-1.5 mt-2">
                      {audit.engines.map((engine) => (
                        <span
                          key={engine}
                          className="px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-600"
                        >
                          {engine}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <StatusBadge status={audit.status} />
                  {audit.status === "completed" && (
                    <div className="flex items-center gap-1">
                      <div className={`w-20 h-2 rounded-full bg-gradient-to-r ${scoreBg(audit.score)}`} />
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </DashboardLayout>
  );
}
