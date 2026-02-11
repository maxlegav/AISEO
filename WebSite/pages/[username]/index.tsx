import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import DashboardLayout from "@/components/layout/DashboardLayout";
import ProjectList from "@/components/projects/ProjectList";
import { useLanguage } from "@/components/LanguageContext";
import Link from "next/link";
import {
  FolderKanban,
  FileText,
  TrendingUp,
  Zap,
  ArrowRight,
  Clock,
  CheckCircle2,
  Loader2,
} from "lucide-react";

interface Business {
  _id: string;
  name: string;
  slug: string;
  primaryUrl: string;
  category: string;
}

// Mock audit data for visualization
const MOCK_RECENT_AUDITS = [
  {
    id: "mock-1",
    projectName: "Mon Site Web",
    score: 72,
    status: "completed" as const,
    date: "2026-02-06",
    engines: ["ChatGPT", "Claude", "Perplexity"],
  },
  {
    id: "mock-2",
    projectName: "E-commerce Store",
    score: 45,
    status: "completed" as const,
    date: "2026-02-04",
    engines: ["ChatGPT", "Claude", "DeepSeek"],
  },
  {
    id: "mock-3",
    projectName: "Blog Tech",
    score: 0,
    status: "processing" as const,
    date: "2026-02-08",
    engines: ["ChatGPT", "Claude", "Perplexity", "DeepSeek"],
  },
];

function ScoreColor(score: number) {
  if (score >= 70) return "text-green-600";
  if (score >= 40) return "text-orange-500";
  return "text-red-500";
}

function StatusBadge({ status }: { status: "completed" | "processing" | "pending" }) {
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

export default function UserProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { username } = router.query;
  const { t } = useLanguage();
  const [projects, setProjects] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);

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

    const fetchProjects = async () => {
      try {
        const res = await fetch("/api/businesses/list");
        const data = await res.json();
        if (data.success) {
          setProjects(data.data);
        }
      } catch (err) {
        console.error("Failed to fetch projects:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [status]);

  if (status === "loading" || loading) {
    return (
      <DashboardLayout activeMenu="dashboard">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 bg-gray-200 rounded-2xl" />
            ))}
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-gray-200 rounded-2xl" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Mock stats
  const stats = [
    {
      label: String(t("dashboard.totalProjects")),
      value: projects.length || 3,
      icon: FolderKanban,
      gradient: "from-purple-500 to-purple-600",
    },
    {
      label: String(t("dashboard.totalAudits")),
      value: 7,
      icon: FileText,
      gradient: "from-orange-500 to-amber-500",
    },
    {
      label: String(t("dashboard.avgScore")),
      value: "58%",
      icon: TrendingUp,
      gradient: "from-purple-600 to-orange-500",
    },
    {
      label: String(t("dashboard.creditsUsed")),
      value: "3/10",
      icon: Zap,
      gradient: "from-amber-500 to-orange-500",
    },
  ];

  return (
    <DashboardLayout activeMenu="dashboard">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-serif font-medium text-gray-900 mb-2">
          {String(t("dashboard.welcome"))}, {session?.user?.name?.split(" ")[0]}
        </h1>
        <p className="text-gray-500">
          {String(t("dashboard.projectsSubtitle"))}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center`}>
                <stat.icon className="w-5 h-5 text-white" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-sm text-gray-500">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Projects Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-serif font-medium text-gray-900 mb-4">
          {String(t("dashboard.projects"))}
        </h2>
        <ProjectList
          projects={projects}
          username={session?.user?.username || ""}
        />
      </div>

      {/* Recent Audits */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-serif font-medium text-gray-900">
            {String(t("dashboard.recentAudits"))}
          </h2>
          <Link
            href={`/${session?.user?.username}/audits`}
            className="text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
          >
            {String(t("dashboard.viewAllAudits"))}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="divide-y divide-gray-100">
          {MOCK_RECENT_AUDITS.map((audit) => (
            <Link
              key={audit.id}
              href={`/${session?.user?.username}/audits/${audit.id}`}
              className="flex items-center justify-between p-5 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-100 to-orange-100 flex items-center justify-center">
                  {audit.status === "completed" ? (
                    <span className={`text-lg font-bold ${ScoreColor(audit.score)}`}>
                      {audit.score}
                    </span>
                  ) : (
                    <Loader2 className="w-5 h-5 text-purple-500 animate-spin" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{audit.projectName}</p>
                  <p className="text-sm text-gray-500">{audit.date}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="hidden sm:flex items-center gap-1.5">
                  {audit.engines.map((engine) => (
                    <span
                      key={engine}
                      className="px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-600"
                    >
                      {engine}
                    </span>
                  ))}
                </div>
                <StatusBadge status={audit.status} />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
