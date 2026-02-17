import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useLanguage } from "@/components/LanguageContext";
import {
  Globe,
  Briefcase,
  Calendar,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from "lucide-react";

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

/* ─── Mock audit data for project detail ─── */
const MOCK_AUDIT: Record<
  string,
  {
    geoScore: number;
    geoLabel: string;
    aiVisibility: number;
    aiVisibilityTrend: string;
    technicalHealth: number;
    technicalHealthTrend: string;
    aiSummary: string;
    actions: {
      title: string;
      severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
      audience: string;
      aiSymptom: string;
      technicalCause: string;
      remedy: string;
    }[];
    categories: { name: string; score: number }[];
    benchmark: { name: string; score: number; isYou?: boolean }[];
  }
> = {
  default: {
    geoScore: 34,
    geoLabel: "CRITICAL",
    aiVisibility: 74,
    aiVisibilityTrend: "+5%",
    technicalHealth: 91,
    technicalHealthTrend: "-2%",
    aiSummary:
      '"Acme Corp demonstrates strong technical fundamentals, yet remains invisible to major LLM reasoning engines. While your site is indexable, the lack of structured semantic connections prevents AI models from recommending you during discovery phases. We\'ve detected a significant \'authority gap\' in the Comparison and Product categories."',
    actions: [
      {
        title: "Missing Product Schema JSON-LD",
        severity: "CRITICAL",
        audience: "DEVELOPER",
        aiSymptom:
          "Bots cannot identify pricing or features during direct comparison queries.",
        technicalCause:
          "Product pages lack structured data in the script tag.",
        remedy:
          "Inject standardized Schema.org markup for all Product and Pricing objects.",
      },
      {
        title: "No FAQ Structured Data",
        severity: "HIGH",
        audience: "CONTENT",
        aiSymptom:
          "AI engines cannot surface your answers for industry questions.",
        technicalCause:
          "FAQ content exists in plain HTML without FAQPage schema.",
        remedy:
          "Add FAQPage JSON-LD to all pages with question-answer content.",
      },
      {
        title: "Weak Internal Linking Structure",
        severity: "MEDIUM",
        audience: "SEO",
        aiSymptom:
          "LLMs have difficulty understanding topical relationships between pages.",
        technicalCause:
          "Key pages have fewer than 3 internal links pointing to them.",
        remedy:
          "Create a topic cluster strategy linking related content pages.",
      },
    ],
    categories: [
      { name: "Discovery", score: 88 },
      { name: "Trust & Authority", score: 42 },
      { name: "Product Specific", score: 12 },
      { name: "Comparison Ranking", score: 5 },
    ],
    benchmark: [
      { name: "BASE44", score: 74, isYou: true },
      { name: "Competitor A", score: 68 },
      { name: "Competitor B", score: 52 },
      { name: "Industry Avg", score: 41 },
    ],
  },
};

/* ─── GEO Health Score Ring ─── */
function GeoScoreRing({
  score,
  label,
}: {
  score: number;
  label: string;
}) {
  const size = 180;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const labelColor =
    score >= 70
      ? "text-emerald-600"
      : score >= 40
      ? "text-orange-500"
      : "text-red-500";

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
            stroke="url(#geoGrad)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-1000"
          />
          <defs>
            <linearGradient id="geoGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-5xl font-bold text-gray-900">{score}%</span>
          <span className={`text-xs font-bold uppercase tracking-wider ${labelColor}`}>
            {label}
          </span>
        </div>
      </div>
      <p className="text-sm text-gray-400 italic mt-3 text-center max-w-[200px]">
        &ldquo;Brand proximity threshold not met for AI mentions.&rdquo;
      </p>
    </div>
  );
}

/* ─── Score Card ─── */
function ScoreCard({
  title,
  score,
  trend,
  color = "emerald",
}: {
  title: string;
  score: number;
  trend: string;
  color?: "emerald" | "blue";
}) {
  const isPositive = trend.startsWith("+");
  const borderColor =
    color === "emerald" ? "border-emerald-200" : "border-blue-200";
  const barColor =
    color === "emerald" ? "bg-emerald-500" : "bg-blue-500";
  const trendColor = isPositive ? "text-emerald-600" : "text-red-500";

  return (
    <div className={`bg-white/90 rounded-2xl p-6 border ${borderColor}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
          {title}
        </span>
        <span className={`text-sm font-semibold ${trendColor}`}>{trend}</span>
      </div>
      <p className="text-4xl font-bold text-gray-900 mb-4">{score}%</p>
      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full ${barColor} rounded-full transition-all`}
          style={{ width: `${score}%` }}
        />
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
      ? "bg-blue-500"
      : score >= 20
      ? "bg-orange-500"
      : "bg-red-500";
  const textColor =
    score >= 70
      ? "text-emerald-600"
      : score >= 40
      ? "text-blue-600"
      : score >= 20
      ? "text-orange-600"
      : "text-red-600";

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm text-gray-700">{name}</span>
        <span className={`text-sm font-bold ${textColor}`}>{score}%</span>
      </div>
      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full ${barColor} rounded-full transition-all`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

/* ─── Action Item ─── */
function ActionItem({
  action,
  index,
}: {
  action: {
    title: string;
    severity: string;
    audience: string;
    aiSymptom: string;
    technicalCause: string;
    remedy: string;
  };
  index: number;
}) {
  const [open, setOpen] = useState(index === 0);

  const severityColor: Record<string, string> = {
    CRITICAL: "bg-red-500 text-white",
    HIGH: "bg-orange-500 text-white",
    MEDIUM: "bg-yellow-500 text-white",
    LOW: "bg-blue-500 text-white",
  };

  return (
    <div className="bg-white/90 rounded-xl border border-gray-100 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50/50 transition-colors"
      >
        <div>
          <h4 className="font-semibold text-gray-900 mb-2">{action.title}</h4>
          <div className="flex items-center gap-2">
            <span
              className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                severityColor[action.severity] || "bg-gray-500 text-white"
              }`}
            >
              {action.severity}
            </span>
            <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-100 text-blue-700">
              {action.audience}
            </span>
          </div>
        </div>
        {open ? (
          <ChevronUp className="w-5 h-5 text-gray-400 shrink-0" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400 shrink-0" />
        )}
      </button>

      {open && (
        <div className="px-5 pb-5 space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-orange-50/60 rounded-lg p-4">
              <p className="text-[10px] font-bold text-orange-600 uppercase tracking-wider mb-1.5">
                AI SYMPTOM
              </p>
              <p className="text-sm text-gray-700">{action.aiSymptom}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                TECHNICAL CAUSE
              </p>
              <p className="text-sm text-gray-700">{action.technicalCause}</p>
            </div>
          </div>
          <div className="bg-emerald-50/60 rounded-lg p-4">
            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-1.5">
              CONCRETE REMEDY
            </p>
            <p className="text-sm text-gray-700">{action.remedy}</p>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Page ─── */
export default function ProjectDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { username, projectSlug } = router.query;
  const { t } = useLanguage();
  const [project, setProject] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);

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

  if (status === "loading" || loading) {
    return (
      <DashboardLayout activeMenu="dashboard">
        <div className="animate-pulse space-y-6">
          <div className="h-10 bg-white/50 rounded-xl w-1/3" />
          <div className="grid md:grid-cols-3 gap-6">
            <div className="h-64 bg-white/50 rounded-2xl" />
            <div className="h-64 bg-white/50 rounded-2xl col-span-2" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Use mock data for display - works for both real and mock projects
  const audit = MOCK_AUDIT["default"]!;
  const projectName =
    project?.name || (typeof projectSlug === "string" ? projectSlug : "Project");
  const projectUrl = project?.primaryUrl || "example.com";
  const projectCategory = project?.category || "General";

  return (
    <DashboardLayout activeMenu="dashboard">
      {/* Project Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-heading font-medium text-gray-900 mb-2">
          {projectName}
        </h1>
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <span className="flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5" />
            {projectUrl}
          </span>
          <span className="flex items-center gap-1.5">
            <Briefcase className="w-3.5 h-3.5" />
            {projectCategory}
          </span>
          <span className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            Oct 24, 2023
          </span>
        </div>
      </div>

      {/* Top Row: GEO Score + Score Cards + AI Summary */}
      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        {/* GEO Health Score */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 border border-white/60 flex flex-col items-center justify-center">
          <h2 className="text-lg font-heading font-medium text-gray-900 mb-6">
            GEO Health Score
          </h2>
          <GeoScoreRing score={audit.geoScore} label={audit.geoLabel} />
        </div>

        {/* Score Cards + AI Summary */}
        <div className="lg:col-span-2 space-y-6">
          {/* Score Cards */}
          <div className="grid md:grid-cols-2 gap-5">
            <ScoreCard
              title="AI VISIBILITY SCORE"
              score={audit.aiVisibility}
              trend={audit.aiVisibilityTrend}
              color="emerald"
            />
            <ScoreCard
              title="TECHNICAL HEALTH"
              score={audit.technicalHealth}
              trend={audit.technicalHealthTrend}
              color="emerald"
            />
          </div>

          {/* AI Synthesis Summary */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-white/60">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <h3 className="font-heading font-medium text-gray-900">
                AI Synthesis Summary
              </h3>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed italic">
              {audit.aiSummary}
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Row: Action List + Sidebar */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Prioritized Action List */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-heading font-semibold text-gray-900">
              Prioritized Action List
            </h2>
            <span className="text-sm text-gray-400">
              Showing {audit.actions.length} of 12 items
            </span>
          </div>
          <div className="space-y-3">
            {audit.actions.map((action, i) => (
              <ActionItem key={i} action={action} index={i} />
            ))}
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Visibility Categories */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-white/60">
            <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-5">
              VISIBILITY CATEGORIES
            </h3>
            {audit.categories.map((cat) => (
              <CategoryBar key={cat.name} name={cat.name} score={cat.score} />
            ))}
          </div>

          {/* Market Benchmark */}
          <div className="bg-gray-800 rounded-2xl p-6 text-white">
            <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-5">
              MARKET BENCHMARK
            </h3>
            <div className="space-y-3">
              {audit.benchmark.map((item) => (
                <div key={item.name}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      {item.isYou && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-600 text-white">
                          {item.name}
                        </span>
                      )}
                      {!item.isYou && (
                        <span className="text-sm text-gray-300">
                          {item.name}
                        </span>
                      )}
                    </div>
                    <span className="text-sm font-bold text-gray-200">
                      {item.score}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        item.isYou ? "bg-blue-500" : "bg-gray-500"
                      }`}
                      style={{ width: `${item.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* User Info */}
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white text-xs font-bold">
              {(
                session?.user?.displayName ||
                session?.user?.name ||
                "U"
              )[0]?.toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                {session?.user?.displayName || session?.user?.name || "User"}
              </p>
              <p className="text-xs text-gray-400">
                {String(t("settings.currentPlan"))}: Pro
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
