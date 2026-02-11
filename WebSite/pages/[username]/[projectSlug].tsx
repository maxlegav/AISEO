import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  Globe,
  Play,
  CheckCircle2,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";

interface Business {
  _id: string;
  name: string;
  slug: string;
  primaryUrl: string;
  subUrls: string[];
  competitorUrls: string[];
  category: string;
  description?: string;
}

// Mock data
const MOCK_ACTIVITY = [
  { type: "audit", date: "2026-02-06", label: "GEO Audit completed - Score: 67%" },
  { type: "audit", date: "2026-01-28", label: "GEO Audit completed - Score: 52%" },
  { type: "created", date: "2026-01-20", label: "Project created" },
];

const MOCK_RECOMMENDATIONS = [
  { title: "Add FAQ schema markup", priority: "high" as const, description: "Your site lacks FAQ structured data for AI engines." },
  { title: "Improve meta descriptions", priority: "medium" as const, description: "47% of pages have missing meta descriptions." },
  { title: "Add Organization schema", priority: "low" as const, description: "Help AI engines correctly identify your brand." },
];

function ScoreRing({ score, size = 140 }: { score: number; size?: number }) {
  const radius = (size - 10) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 70 ? "text-green-600" : score >= 40 ? "text-orange-500" : "text-red-500";

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#f3f4f6" strokeWidth={6} />
        <circle
          cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke="url(#projScoreGrad)" strokeWidth={6} strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          className="transition-all duration-700"
        />
        <defs>
          <linearGradient id="projScoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#9333ea" />
            <stop offset="100%" stopColor="#f97316" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-3xl font-bold ${color}`}>{score}</span>
        <span className="text-xs text-gray-400">/ 100</span>
      </div>
    </div>
  );
}

function PriorityBadge({ priority }: { priority: "high" | "medium" | "low" }) {
  const config = {
    high: "bg-red-100 text-red-700",
    medium: "bg-orange-100 text-orange-700",
    low: "bg-green-100 text-green-700",
  };
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${config[priority]}`}>
      {priority}
    </span>
  );
}

export default function ProjectDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { username, projectSlug } = router.query;
  const { t } = useLanguage();
  const [project, setProject] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [auditToast, setAuditToast] = useState(false);

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
      return;
    }
  }, [status, session, username, router]);

  useEffect(() => {
    if (status !== "authenticated" || !projectSlug) return;

    const fetchProject = async () => {
      try {
        const res = await fetch("/api/businesses/list");
        const data = await res.json();
        if (data.success) {
          const found = data.data.find(
            (b: Business) => b.slug === projectSlug
          );
          if (found) {
            setProject(found);
          } else {
            router.push(`/${session?.user?.username}`);
          }
        }
      } catch (err) {
        console.error("Failed to fetch project:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [status, projectSlug, session, router]);

  const handleRunAudit = () => {
    setAuditToast(true);
    setTimeout(() => setAuditToast(false), 3000);
  };

  if (status === "loading" || loading) {
    return (
      <DashboardLayout activeMenu="projects">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="grid md:grid-cols-2 gap-6">
            <div className="h-64 bg-gray-200 rounded-2xl" />
            <div className="h-64 bg-gray-200 rounded-2xl" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!project) return null;

  const mockScore = 67;

  return (
    <DashboardLayout activeMenu="projects">
      {/* Toast */}
      {auditToast && (
        <div className="fixed top-20 right-8 z-50 bg-white border border-purple-200 rounded-xl p-4 shadow-lg animate-in slide-in-from-right">
          <p className="text-sm text-gray-700">
            {String(t("project.auditComingSoon"))}
          </p>
        </div>
      )}

      {/* Project Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <button
            onClick={() => router.push(`/${session?.user?.username}`)}
            className="text-sm text-purple-600 hover:text-purple-700"
          >
            {String(t("dashboard.projects"))}
          </button>
          <span className="text-gray-400">/</span>
          <span className="text-sm text-gray-600">{project.name}</span>
        </div>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-serif font-medium text-gray-900 mb-2">
              {project.name}
            </h1>
            <div className="flex items-center gap-2 text-gray-500">
              <Globe className="w-4 h-4" />
              <span className="hover:text-purple-600 transition-colors">
                {project.primaryUrl}
              </span>
            </div>
          </div>

          <Button
            onClick={handleRunAudit}
            className="bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white flex items-center gap-2"
          >
            <Play className="w-4 h-4" />
            {String(t("project.runAudit"))}
          </Button>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* GEO Score Card */}
        <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">
              {String(t("dashboard.geoScore"))}
            </h2>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <div className="flex items-center justify-center">
            <ScoreRing score={mockScore} />
          </div>
          <p className="text-center text-sm text-gray-500 mt-4">
            +15 pts vs previous audit
          </p>
        </div>

        {/* Competitive Gap Card */}
        <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">
            {String(t("project.competitiveGap"))}
          </h2>
          <div className="space-y-4">
            {/* Your site */}
            <div className="flex items-center gap-3">
              <span className="w-28 text-sm font-medium text-gray-900 truncate">{project.name}</span>
              <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-600 to-orange-500 rounded-full flex items-center justify-end pr-2"
                  style={{ width: `${mockScore}%` }}
                >
                  <span className="text-[10px] font-bold text-white">{mockScore}%</span>
                </div>
              </div>
            </div>
            {/* Competitors */}
            {(project.competitorUrls.length > 0
              ? project.competitorUrls.slice(0, 3)
              : ["competitor-a.com", "competitor-b.com"]
            ).map((url, i) => {
              const fakeScore = [81, 54][i] ?? 60;
              return (
                <div key={i} className="flex items-center gap-3">
                  <span className="w-28 text-sm text-gray-600 truncate">{url}</span>
                  <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gray-400 rounded-full flex items-center justify-end pr-2"
                      style={{ width: `${fakeScore}%` }}
                    >
                      <span className="text-[10px] font-bold text-white">{fakeScore}%</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm mb-8">
        <h2 className="text-2xl font-serif font-medium text-gray-900 mb-6">
          {String(t("project.recentActivity"))}
        </h2>
        <div className="space-y-4">
          {MOCK_ACTIVITY.map((item, i) => (
            <div key={i} className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                item.type === "audit" ? "bg-purple-100" : "bg-green-100"
              }`}>
                {item.type === "audit" ? (
                  <CheckCircle2 className="w-4 h-4 text-purple-600" />
                ) : (
                  <Clock className="w-4 h-4 text-green-600" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-900">{item.label}</p>
                <p className="text-xs text-gray-500">{item.date}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm mb-8">
        <h2 className="text-2xl font-serif font-medium text-gray-900 mb-6">
          {String(t("project.recommendationPlaceholder"))}
        </h2>
        <div className="space-y-4">
          {MOCK_RECOMMENDATIONS.map((rec, i) => (
            <div key={i} className="p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className={`w-4 h-4 ${
                    rec.priority === "high" ? "text-red-500" : rec.priority === "medium" ? "text-orange-500" : "text-green-500"
                  }`} />
                  <h3 className="font-medium text-gray-900">{rec.title}</h3>
                </div>
                <PriorityBadge priority={rec.priority} />
              </div>
              <p className="text-sm text-gray-600 ml-6">{rec.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Project Details */}
      <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          {String(t("project.details"))}
        </h2>
        <dl className="space-y-4">
          <div>
            <dt className="text-sm font-medium text-gray-500">{String(t("project.category"))}</dt>
            <dd className="text-gray-900">{project.category}</dd>
          </div>
          {project.description && (
            <div>
              <dt className="text-sm font-medium text-gray-500">{String(t("project.description"))}</dt>
              <dd className="text-gray-900">{project.description}</dd>
            </div>
          )}
          {project.subUrls.length > 0 && (
            <div>
              <dt className="text-sm font-medium text-gray-500">{String(t("project.subUrls"))}</dt>
              <dd className="space-y-1">
                {project.subUrls.map((url, i) => (
                  <div key={i} className="text-gray-900 text-sm">{url}</div>
                ))}
              </dd>
            </div>
          )}
        </dl>
      </div>
    </DashboardLayout>
  );
}
