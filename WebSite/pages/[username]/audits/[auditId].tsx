import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useLanguage } from "@/components/LanguageContext";
import {
  ArrowLeft,
  Download,
  CheckCircle2,
  AlertTriangle,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// Mock audit detail data
const MOCK_AUDIT_DATA: Record<string, {
  projectName: string;
  score: number;
  date: string;
  engines: { name: string; score: number }[];
  recommendations: { title: string; priority: "high" | "medium" | "low"; description: string }[];
  htmlScan: { label: string; status: "pass" | "warning" | "fail"; detail: string }[];
  competitors: { name: string; score: number }[];
}> = {
  "mock-1": {
    projectName: "Mon Site Web",
    score: 72,
    date: "2026-02-06",
    engines: [
      { name: "ChatGPT", score: 78 },
      { name: "Claude", score: 82 },
      { name: "Perplexity", score: 65 },
      { name: "DeepSeek", score: 63 },
    ],
    recommendations: [
      { title: "Add FAQ schema markup", priority: "high", description: "Your site lacks FAQ structured data. Adding schema.org FAQPage markup will significantly improve AI engine citations." },
      { title: "Improve meta descriptions", priority: "high", description: "47% of your pages have missing or duplicate meta descriptions. Write unique, keyword-rich descriptions for each page." },
      { title: "Add alt text to images", priority: "medium", description: "23 images are missing alt text. Descriptive alt text helps AI engines understand your visual content." },
      { title: "Optimize heading structure", priority: "medium", description: "Some pages have multiple H1 tags or skip heading levels. Use a clean H1 > H2 > H3 hierarchy." },
      { title: "Add Organization schema", priority: "low", description: "Adding Organization structured data helps AI engines identify and cite your brand correctly." },
    ],
    htmlScan: [
      { label: "Schema.org", status: "warning", detail: "Found: Organization. Missing: FAQPage, Product, BreadcrumbList" },
      { label: "Meta Tags", status: "warning", detail: "47% of pages missing unique meta descriptions" },
      { label: "Heading Structure", status: "pass", detail: "Clean H1-H3 hierarchy on 89% of pages" },
      { label: "Alt Text", status: "fail", detail: "23 images missing alt text out of 45 total" },
      { label: "Keywords", status: "pass", detail: "Top keywords: SaaS, automation, productivity, workflow, integration" },
    ],
    competitors: [
      { name: "competitor-a.com", score: 81 },
      { name: "competitor-b.com", score: 65 },
      { name: "competitor-c.com", score: 54 },
    ],
  },
};

// Fallback for unknown audit IDs
const DEFAULT_AUDIT = MOCK_AUDIT_DATA["mock-1"]!;

function scoreColor(score: number) {
  if (score >= 70) return "text-green-600";
  if (score >= 40) return "text-orange-500";
  return "text-red-500";
}

function ScoreRing({ score, size = 160 }: { score: number; size?: number }) {
  const radius = (size - 12) / 2;
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
          stroke="#f3f4f6"
          strokeWidth={8}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#scoreGradLarge)"
          strokeWidth={8}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000"
        />
        <defs>
          <linearGradient id="scoreGradLarge" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#9333ea" />
            <stop offset="100%" stopColor="#f97316" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-4xl font-bold ${scoreColor(score)}`}>{score}</span>
        <span className="text-sm text-gray-400">/ 100</span>
      </div>
    </div>
  );
}

function PriorityBadge({ priority }: { priority: "high" | "medium" | "low" }) {
  const { t } = useLanguage();
  const config = {
    high: { bg: "bg-red-100 text-red-700", label: String(t("audit.priority.high")) },
    medium: { bg: "bg-orange-100 text-orange-700", label: String(t("audit.priority.medium")) },
    low: { bg: "bg-green-100 text-green-700", label: String(t("audit.priority.low")) },
  };
  const c = config[priority];
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${c.bg}`}>
      {c.label}
    </span>
  );
}

function ScanStatusIcon({ status }: { status: "pass" | "warning" | "fail" }) {
  if (status === "pass") return <CheckCircle2 className="w-5 h-5 text-green-500" />;
  if (status === "warning") return <AlertTriangle className="w-5 h-5 text-orange-500" />;
  return <AlertTriangle className="w-5 h-5 text-red-500" />;
}

export default function AuditDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { username, auditId } = router.query;
  const { t } = useLanguage();
  const [toast, setToast] = useState(false);

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

  const auditData = (typeof auditId === "string" && MOCK_AUDIT_DATA[auditId]) || DEFAULT_AUDIT;

  const handleDownload = () => {
    setToast(true);
    setTimeout(() => setToast(false), 3000);
  };

  if (status === "loading") {
    return (
      <DashboardLayout activeMenu="audits">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="h-64 bg-gray-200 rounded-2xl" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout activeMenu="audits">
      {/* Toast */}
      {toast && (
        <div className="fixed top-20 right-8 z-50 bg-white border border-orange-200 rounded-xl p-4 shadow-lg animate-in slide-in-from-right">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-orange-500" />
            <p className="text-sm text-gray-700">{String(t("audit.comingSoon"))}</p>
          </div>
        </div>
      )}

      {/* Breadcrumb + Actions */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push(`/${session?.user?.username}/audits`)}
            className="text-sm text-purple-600 hover:text-purple-700 flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" />
            {String(t("dashboard.audits"))}
          </button>
          <span className="text-gray-400">/</span>
          <span className="text-sm text-gray-600">{auditData.projectName}</span>
        </div>
        <Button
          onClick={handleDownload}
          className="bg-gradient-to-r from-purple-600 to-orange-500 hover:from-purple-700 hover:to-orange-600 text-white flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          {String(t("audit.downloadPdf"))}
        </Button>
      </div>

      {/* Header with Score */}
      <div className="bg-gradient-to-r from-purple-600 to-orange-500 rounded-2xl p-8 mb-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-serif font-medium mb-2">
              {String(t("audit.detailTitle"))}
            </h1>
            <p className="text-white/80 text-lg">{auditData.projectName}</p>
            <p className="text-white/60 text-sm mt-1">{auditData.date}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
            <ScoreRing score={auditData.score} />
          </div>
        </div>
      </div>

      {/* Score Breakdown by Engine */}
      <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm mb-8">
        <h2 className="text-xl font-serif font-medium text-gray-900 mb-6">
          {String(t("audit.scoreBreakdown"))}
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {auditData.engines.map((engine) => (
            <div key={engine.name} className="text-center">
              <ScoreRing score={engine.score} size={100} />
              <p className="mt-3 font-medium text-gray-900">{engine.name}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8 mb-8">
        {/* Recommendations */}
        <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm">
          <h2 className="text-xl font-serif font-medium text-gray-900 mb-6">
            {String(t("audit.recommendations"))}
          </h2>
          <div className="space-y-4">
            {auditData.recommendations.map((rec, i) => (
              <div key={i} className="p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-900">{rec.title}</h3>
                  <PriorityBadge priority={rec.priority} />
                </div>
                <p className="text-sm text-gray-600">{rec.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* HTML Scan Results */}
        <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm">
          <h2 className="text-xl font-serif font-medium text-gray-900 mb-6">
            {String(t("audit.htmlScanResults"))}
          </h2>
          <div className="space-y-4">
            {auditData.htmlScan.map((item, i) => (
              <div key={i} className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                <ScanStatusIcon status={item.status} />
                <div>
                  <h3 className="font-medium text-gray-900">{item.label}</h3>
                  <p className="text-sm text-gray-600 mt-0.5">{item.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Competitor Comparison */}
      <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm">
        <h2 className="text-xl font-serif font-medium text-gray-900 mb-6">
          {String(t("audit.competitorComparison"))}
        </h2>
        <div className="space-y-4">
          {/* Your site */}
          <div className="flex items-center gap-4">
            <span className="w-40 text-sm font-medium text-gray-900 truncate">
              {auditData.projectName}
            </span>
            <div className="flex-1 h-8 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-600 to-orange-500 rounded-full flex items-center justify-end pr-3"
                style={{ width: `${auditData.score}%` }}
              >
                <span className="text-xs font-bold text-white">{auditData.score}%</span>
              </div>
            </div>
          </div>
          {/* Competitors */}
          {auditData.competitors.map((comp, i) => (
            <div key={i} className="flex items-center gap-4">
              <span className="w-40 text-sm text-gray-600 truncate">{comp.name}</span>
              <div className="flex-1 h-8 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gray-400 rounded-full flex items-center justify-end pr-3"
                  style={{ width: `${comp.score}%` }}
                >
                  <span className="text-xs font-bold text-white">{comp.score}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
