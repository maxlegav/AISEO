import { useEffect, useState, useRef } from "react";
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
  Trash2,
  Zap,
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

interface LatestAudit {
  _id: string;
  businessId: string;
  status: string;
  geoScore?: number;
}

function mapAuditUIStatus(dbStatus: string): "completed" | "processing" | "pending" {
  if (dbStatus === "completed") return "completed";
  if (dbStatus === "pending" || dbStatus === "failed" || dbStatus === "rejected") return "pending";
  return "processing";
}

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
  latestAudit,
  trend = "stable",
  trendValue,
  onDelete,
}: {
  business: Business;
  username: string;
  latestAudit?: LatestAudit;
  trend?: "up" | "down" | "flat" | "stable";
  trendValue?: string;
  onDelete: (id: string) => void;
}) {
  const { t } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handle = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [menuOpen]);

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

  // Derive status and score from the latest audit
  const auditStatus = latestAudit
    ? mapAuditUIStatus(latestAudit.status)
    : "pending";
  const isPending = auditStatus === "pending";
  const isProcessing = auditStatus === "processing";
  const score =
    latestAudit?.status === "completed" ? latestAudit.geoScore : undefined;

  // Link to latest audit detail if available, otherwise to business page
  const href = latestAudit
    ? `/${username}/audits/${latestAudit._id}`
    : `/${username}/${business.slug}`;

  return (
    <Link href={href}>
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
          {/* ─── Context menu ─── */}
          <div ref={menuRef} className="relative shrink-0">
            <button
              className="text-gray-300 hover:text-gray-500 transition-colors p-1"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setMenuOpen((o) => !o);
              }}
            >
              <MoreVertical className="w-4 h-4" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-7 z-30 bg-white border border-gray-100 rounded-xl shadow-lg py-1 w-44">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setMenuOpen(false);
                    onDelete(business._id);
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  {String(t("project.delete"))}
                </button>
              </div>
            )}
          </div>
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
            <span className="truncate max-w-[140px]">{business.primaryUrl}</span>
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
  const [latestAudits, setLatestAudits] = useState<Map<string, LatestAudit>>(new Map());
  const [loading, setLoading] = useState(true);
  const [showDisplayNameModal, setShowDisplayNameModal] = useState(false);
  const [localDisplayName, setLocalDisplayName] = useState<string | null>(null);
  const [hasClosedModal, setHasClosedModal] = useState(false);
  const [auditCredits, setAuditCredits] = useState<number | null>(null);

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

  /* Fetch businesses + latest audits + credits */
  const fetchData = async () => {
    try {
      const [projectsRes, auditsRes, creditsRes] = await Promise.all([
        fetch("/api/businesses/list"),
        fetch("/api/audits/list"),
        fetch("/api/user/check-subscription"),
      ]);
      const [projectsData, auditsData, creditsData] = await Promise.all([
        projectsRes.json(),
        auditsRes.json(),
        creditsRes.json(),
      ]);

      if (projectsData.success) {
        setProjects(projectsData.data);
      }

      if (auditsData.success) {
        // Build a map: businessId → latest audit (audits are sorted desc by createdAt)
        const auditMap = new Map<string, LatestAudit>();
        for (const audit of auditsData.data as LatestAudit[]) {
          const bid = audit.businessId?.toString();
          if (bid && !auditMap.has(bid)) {
            auditMap.set(bid, audit);
          }
        }
        setLatestAudits(auditMap);
      }

      if (creditsData.success) {
        setAuditCredits(creditsData.auditCredits ?? 0);
      }
    } catch (err) {
      console.error("Failed to fetch data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status !== "authenticated") return;
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const handleDeleteProject = async (businessId: string) => {
    if (!confirm(String(t("project.deleteConfirm")))) return;
    const res = await fetch(`/api/businesses/${businessId}`, {
      method: "DELETE",
    });
    const data = await res.json();
    if (data.success) {
      // Re-fetch to get updated project list + credits
      await fetchData();
    }
  };

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
        <div className="flex items-center gap-3 mt-2">
          {/* Audit credits badge */}
          {auditCredits !== null && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/80 border border-white/60 rounded-full text-sm text-gray-600 shadow-sm">
              <Zap className="w-3.5 h-3.5 text-orange-500" />
              <span className="font-medium text-gray-800">{auditCredits}</span>
              <span className="text-gray-400">{String(t("settings.auditCreditsRemaining"))}</span>
            </div>
          )}
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

        {/* Business + Audit Cards */}
        {projects.map((project) => (
          <ProjectCard
            key={project._id}
            business={project}
            username={session?.user?.username || ""}
            latestAudit={latestAudits.get(project._id)}
            trend="stable"
            onDelete={handleDeleteProject}
          />
        ))}
      </div>
    </DashboardLayout>
  );
}
