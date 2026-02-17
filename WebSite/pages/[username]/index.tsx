import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useLanguage } from "@/components/LanguageContext";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Plus,
  MoreVertical,
  SlidersHorizontal,
  LayoutGrid,
  Building2,
  Loader2,
  User,
  Clock,
} from "lucide-react";

interface Business {
  _id: string;
  name: string;
  slug: string;
  primaryUrl: string;
  category: string;
  description?: string;
  createdAt: string;
}

/* ─── Mock projects for demo ─── */
const MOCK_PROJECTS: (Business & {
  score?: number;
  trend?: "up" | "down" | "flat" | "stable";
  trendValue?: string;
  auditStatus?: "completed" | "processing" | "pending";
})[] = [
  {
    _id: "mock-1",
    name: "Acme Corp",
    slug: "acme-corp",
    primaryUrl: "https://acme-corp.com",
    category: "SaaS",
    createdAt: "2023-10-24T00:00:00Z",
    score: 34,
    trend: "down",
    trendValue: "-5%",
    auditStatus: "completed",
  },
  {
    _id: "mock-2",
    name: "Fine Dining Paris",
    slug: "fine-dining-paris",
    primaryUrl: "https://finedining.fr",
    category: "Restaurant Le Jardin",
    createdAt: "2025-09-12T00:00:00Z",
    score: 78,
    trend: "up",
    trendValue: "+12%",
    auditStatus: "completed",
  },
  {
    _id: "mock-3",
    name: "Luxury Retail",
    slug: "luxury-retail",
    primaryUrl: "https://luxuryretail.com",
    category: "Maison & Objet",
    createdAt: "2025-10-01T00:00:00Z",
    auditStatus: "pending",
  },
  {
    _id: "mock-4",
    name: "Tech Startups NY",
    slug: "tech-startups-ny",
    primaryUrl: "https://techstartups.io",
    category: "Innovate Inc.",
    createdAt: "2025-11-15T00:00:00Z",
    score: 28,
    trend: "down",
    trendValue: "-5%",
    auditStatus: "completed",
  },
  {
    _id: "mock-5",
    name: "Artisan Coffee",
    slug: "artisan-coffee",
    primaryUrl: "https://artisancoffee.co.uk",
    category: "London Brews",
    createdAt: "2025-08-20T00:00:00Z",
    score: 62,
    trend: "up",
    trendValue: "+4%",
    auditStatus: "completed",
  },
];

/* ─── Mini Sparkline SVG ─── */
function MiniSparkline({
  trend,
  color,
}: {
  trend: "up" | "down" | "flat" | "stable";
  color: string;
}) {
  if (trend === "stable") {
    return (
      <svg
        viewBox="0 0 120 24"
        className="w-full h-6"
        preserveAspectRatio="none"
      >
        <line
          x1="0"
          y1="12"
          x2="120"
          y2="12"
          stroke={color}
          strokeWidth="2.5"
          strokeDasharray="8 6"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  const paths: Record<string, string> = {
    up: "M0,20 C20,18 35,14 50,11 C65,8 80,5 100,4 C110,3 115,2 120,2",
    down: "M0,4 C20,6 35,9 50,13 C65,16 80,19 100,21 C110,22 115,22 120,22",
    flat: "M0,14 C15,11 25,16 40,12 C55,15 65,10 80,14 C95,11 110,15 120,12",
  };

  return (
    <svg
      viewBox="0 0 120 24"
      className="w-full h-6"
      preserveAspectRatio="none"
    >
      <path
        d={paths[trend]}
        stroke={color}
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}

/* ─── Trend Badge ─── */
function TrendBadge({
  value,
  trend,
}: {
  value: string;
  trend: "up" | "down" | "flat" | "stable";
}) {
  const config = {
    up: { cls: "text-emerald-600 bg-emerald-50", icon: "\u2197" },
    down: { cls: "text-red-500 bg-red-50", icon: "\u2198" },
    flat: { cls: "text-orange-500", icon: "\u2192" },
    stable: { cls: "text-gray-400 border border-gray-200", icon: "\u2014" },
  };
  const c = config[trend];
  return (
    <span
      className={`inline-flex items-center gap-0.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${c.cls}`}
    >
      {c.icon} {value}
    </span>
  );
}

/* ─── Project Card ─── */
function ProjectCard({
  business,
  username,
  score,
  trend = "stable",
  trendValue,
  auditStatus,
}: {
  business: Business;
  username: string;
  score?: number;
  trend?: "up" | "down" | "flat" | "stable";
  trendValue?: string;
  auditStatus?: "completed" | "processing" | "pending";
}) {
  const { t } = useLanguage();

  const sparklineColors = {
    up: "#10b981",
    down: "#ef4444",
    flat: "#f97316",
    stable: "#cbd5e1",
  } as const;

  const created = new Date(business.createdAt);
  const formattedDate = created.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
  });

  const isPending = auditStatus === "pending";
  const isProcessing = auditStatus === "processing";

  return (
    <Link href={`/${username}/${business.slug}`}>
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 hover:shadow-lg transition-all cursor-pointer group h-full flex flex-col border border-white/60">
        {/* Header */}
        <div className="flex items-start justify-between mb-1">
          <div className="min-w-0 flex-1">
            <h3 className="text-[17px] font-heading font-semibold text-gray-900 group-hover:text-gray-700 transition-colors leading-snug">
              {business.name}
            </h3>
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mt-0.5">
              {business.category}
            </p>
          </div>
          <button
            className="text-gray-300 hover:text-gray-500 transition-colors p-1 shrink-0"
            onClick={(e) => e.preventDefault()}
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>

        {/* Score / Pending state */}
        <div className="mt-4 flex-1">
          {isPending || isProcessing ? (
            <div className="flex flex-col items-center justify-center py-4">
              {isProcessing ? (
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-2" />
              ) : (
                <Clock className="w-8 h-8 text-gray-300 mb-2" />
              )}
              <span className="text-sm text-gray-400 font-medium">
                {isPending
                  ? String(t("audit.status.pending"))
                  : String(t("audit.status.processing"))}
              </span>
              <span className="text-[11px] text-gray-300 mt-1">
                {String(t("project.noScoreYet"))}
              </span>
            </div>
          ) : (
            <>
              <p className="text-[11px] text-gray-400 mb-1">
                {String(t("dashboard.visibilityScore"))}
              </p>
              <div className="flex items-end justify-between">
                <span className="text-[44px] font-bold text-gray-900 leading-none tracking-tight">
                  {score !== undefined ? score : "\u2014"}
                </span>
                {trendValue && (
                  <TrendBadge value={trendValue} trend={trend} />
                )}
              </div>
            </>
          )}
        </div>

        {/* Sparkline */}
        {!isPending && !isProcessing && (
          <div className="mt-3 mb-4">
            <MiniSparkline trend={trend} color={sparklineColors[trend]} />
          </div>
        )}

        {/* Footer */}
        <div
          className={`flex items-center justify-between text-[12px] text-gray-400 ${
            isPending || isProcessing ? "mt-4" : ""
          }`}
        >
          <div className="flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5" />
            <span>1 {String(t("dashboard.business"))}</span>
          </div>
          <span>Created {formattedDate}</span>
        </div>
      </div>
    </Link>
  );
}

/* ─── Display Name Modal ─── */
function DisplayNameModal({ onSave }: { onSave: (name: string) => void }) {
  const { t } = useLanguage();
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || submitting) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/user/set-display-name", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName: name.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        onSave(data.data.displayName);
      }
    } catch {
      // silently fail
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div className="p-8">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-orange-600" />
            </div>
            <h3 className="text-2xl font-heading font-medium text-gray-900 mb-2">
              {String(t("displayName.title"))}
            </h3>
            <p className="text-gray-500 text-sm">
              {String(t("displayName.subtitle"))}
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <label
              htmlFor="displayName"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              {String(t("displayName.label"))}
            </label>
            <input
              id="displayName"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={String(t("displayName.placeholder"))}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none text-gray-900 mb-6"
              maxLength={50}
              autoFocus
            />
            <Button
              type="submit"
              disabled={!name.trim() || submitting}
              className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white h-12 text-base rounded-xl disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                String(t("displayName.confirm"))
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

/* ─── Page ─── */
export default function UserProfilePage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const { username } = router.query;
  const { t } = useLanguage();
  const [projects, setProjects] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDisplayNameModal, setShowDisplayNameModal] = useState(false);
  const [localDisplayName, setLocalDisplayName] = useState<string | null>(null);
  const [hasClosedModal, setHasClosedModal] = useState(false);

  /* Auth redirects */
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    if (status === "authenticated" && !session?.user?.username) {
      router.push("/dashboard");
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

  /* Display name popup */
  useEffect(() => {
    if (
      status === "authenticated" &&
      session?.user &&
      !session.user.displayName &&
      !localDisplayName &&
      !hasClosedModal
    ) {
      setShowDisplayNameModal(true);
    }
  }, [status, session, localDisplayName, hasClosedModal]);

  /* Fetch projects */
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

  /* Loading skeleton */
  if (status === "loading" || loading) {
    return (
      <DashboardLayout activeMenu="dashboard">
        <div className="animate-pulse space-y-6">
          <div className="h-10 bg-white/50 rounded-xl w-1/3" />
          <div className="h-5 bg-white/30 rounded w-2/3" />
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 mt-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-64 bg-white/50 rounded-2xl" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Merge real projects with mock projects (mock first for demo)
  const allProjects = [...MOCK_PROJECTS, ...projects.map((p) => ({ ...p }))];

  return (
    <DashboardLayout activeMenu="dashboard">
      {/* Display Name Popup */}
      {showDisplayNameModal && (
        <DisplayNameModal
          onSave={async (name) => {
            setLocalDisplayName(name);
            setHasClosedModal(true);
            setShowDisplayNameModal(false);
            await update();
          }}
        />
      )}

      {/* Page Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-4xl font-heading font-medium text-gray-900 mb-2">
            {String(t("dashboard.projects"))}
          </h1>
          <p className="text-gray-500 text-[15px] max-w-2xl leading-relaxed">
            {String(t("dashboard.projectsDescription"))}
          </p>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-white/60">
            <SlidersHorizontal className="w-5 h-5" />
          </button>
          <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-white/60">
            <LayoutGrid className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Project Cards Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Create New Project Card */}
        <Link href="/projects/create">
          <div className="bg-gradient-to-br from-orange-300/90 via-orange-200/80 to-amber-100/70 rounded-2xl p-6 h-full flex flex-col items-center justify-center text-center cursor-pointer hover:shadow-lg transition-all min-h-[280px] group border border-orange-200/40">
            <div className="w-16 h-16 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center mb-5 group-hover:bg-white/50 transition-all">
              <Plus className="w-7 h-7 text-orange-800/50" />
            </div>
            <h3 className="text-lg font-heading font-semibold text-gray-800 mb-1">
              {String(t("dashboard.createNewProject"))}
            </h3>
            <p className="text-sm text-orange-800/50">
              {String(t("dashboard.startTracking"))}
            </p>
          </div>
        </Link>

        {/* Project Cards */}
        {allProjects.map((project) => {
          const mock = MOCK_PROJECTS.find((m) => m._id === project._id);
          return (
            <ProjectCard
              key={project._id}
              business={project}
              username={session?.user?.username || ""}
              score={mock?.score}
              trend={mock?.trend}
              trendValue={mock?.trendValue}
              auditStatus={mock?.auditStatus}
            />
          );
        })}
      </div>
    </DashboardLayout>
  );
}
