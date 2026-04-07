import { ReactNode, useEffect, useState, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/router";
import {
  LayoutDashboard,
  FileText,
  Settings,
  Plus,
  Search,
  ChevronDown,
  Zap,
  LogOut,
  MessageSquarePlus,
  Bug,
  Lightbulb,
  Wrench,
  HelpCircle,
  Loader2,
  CheckCircle2,
  X,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useLanguage } from "@/components/LanguageContext";

interface DashboardLayoutProps {
  children: ReactNode;
  activeMenu?: "dashboard" | "audits" | "settings";
}

interface ProjectItem {
  _id: string;
  name: string;
  slug: string;
}

type FeedbackType = "bug" | "feature" | "improvement" | "other";

const feedbackTypeIcons = {
  bug: Bug,
  feature: Lightbulb,
  improvement: Wrench,
  other: HelpCircle,
};

/* ─── Feedback Modal ─── */
function FeedbackModal({ onClose }: { onClose: () => void }) {
  const { t } = useLanguage();
  const [type, setType] = useState<FeedbackType>("feature");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const typeOptions: { value: FeedbackType; labelKey: string }[] = [
    { value: "feature", labelKey: "feedback.type.feature" },
    { value: "bug", labelKey: "feedback.type.bug" },
    { value: "improvement", labelKey: "feedback.type.improvement" },
    { value: "other", labelKey: "feedback.type.other" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || submitting) return;

    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/feedback/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          title: title.trim(),
          description: description.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSubmitted(true);
      } else {
        setError(data.message || "Something went wrong");
      }
    } catch {
      setError("Network error, please try again");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-0">
          <div className="flex items-center gap-2">
            <MessageSquarePlus className="w-5 h-5 text-orange-500" />
            <h3 className="text-lg font-semibold text-gray-900">
              {String(t("feedback.title"))}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-sm text-gray-500 px-6 mt-1">
          {String(t("feedback.subtitle"))}
        </p>

        {/* Body */}
        <div className="p-6">
          {submitted ? (
            <div className="flex flex-col items-center py-6">
              <CheckCircle2 className="w-12 h-12 text-green-500 mb-3" />
              <p className="text-lg font-medium text-gray-900 mb-1">
                {String(t("feedback.submitSuccess"))}
              </p>
              <p className="text-sm text-gray-500 mb-5">
                {String(t("feedback.submitSuccessDesc"))}
              </p>
              <button
                onClick={onClose}
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors underline"
              >
                {String(t("common.cancel"))}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Type selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {String(t("feedback.typeLabel"))}
                </label>
                <div className="flex gap-2 flex-wrap">
                  {typeOptions.map((opt) => {
                    const Icon = feedbackTypeIcons[opt.value];
                    const isActive = type === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setType(opt.value)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                          isActive
                            ? "bg-gray-900 text-white shadow-sm"
                            : "bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100"
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {String(t(opt.labelKey))}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Title */}
              <div>
                <label htmlFor="fb-title" className="block text-sm font-medium text-gray-700 mb-1">
                  {String(t("feedback.titleLabel"))}
                </label>
                <input
                  id="fb-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={String(t("feedback.titlePlaceholder"))}
                  className="w-full px-3.5 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none text-gray-900 text-sm"
                  maxLength={200}
                  autoFocus
                />
              </div>

              {/* Description */}
              <div>
                <label htmlFor="fb-desc" className="block text-sm font-medium text-gray-700 mb-1">
                  {String(t("feedback.descriptionLabel"))}
                </label>
                <textarea
                  id="fb-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={String(t("feedback.descriptionPlaceholder"))}
                  rows={4}
                  className="w-full px-3.5 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none text-gray-900 text-sm resize-none"
                  maxLength={2000}
                />
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                  {String(t("common.cancel"))}
                </button>
                <button
                  type="submit"
                  disabled={!title.trim() || !description.trim() || submitting}
                  className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-sm font-medium rounded-lg px-5 py-2 disabled:opacity-50 flex items-center gap-2 transition-all"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <MessageSquarePlus className="w-3.5 h-3.5" />
                      {String(t("feedback.submit"))}
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Dashboard Layout ─── */
export default function DashboardLayout({
  children,
  activeMenu = "dashboard",
}: DashboardLayoutProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t } = useLanguage();
  const [availableSlots, setAvailableSlots] = useState(0);
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch projects + compute available audit slots
  useEffect(() => {
    if (status !== "authenticated") return;

    Promise.all([
      fetch("/api/businesses/list").then((r) => r.json()),
      fetch("/api/user/check-subscription").then((r) => r.json()),
    ])
      .then(([projectsData, creditsData]) => {
        if (projectsData.success) setProjects(projectsData.data);

        if (creditsData.success) {
          const tierProjectLimits: Record<string, number> = {
            none: 0, basic: 1, pro: 1, premium: 10,
          };
          const tierLimit = tierProjectLimits[creditsData.subscriptionTier || "none"] ?? 0;
          const rawCredits = creditsData.auditCredits ?? 0;
          const activeProjects = projectsData.success ? (projectsData.data as unknown[]).length : 0;
          setAvailableSlots(Math.max(0, tierLimit + rawCredits - activeProjects));
        }
      })
      .catch(() => {});
  }, [status]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/dashboard");
      return;
    }

    // Subscription gate: block authenticated users without an active plan
    // or remaining credits from accessing any dashboard page.
    if (status === "authenticated") {
      const hasActiveSubscription =
        session?.user?.subscriptionStatus === "active" ||
        (session?.user?.auditCredits ?? 0) > 0;

      if (!hasActiveSubscription) {
        router.replace("/signup?step=4");
      }
    }
  }, [status, session, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-200 via-pink-100 via-40% to-orange-100">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-600">{String(t("common.loading"))}</p>
        </div>
      </div>
    );
  }

  const username = session?.user?.username;
  const displayName =
    session?.user?.displayName || session?.user?.name || "User";

  const menuItems = [
    {
      key: "dashboard" as const,
      icon: LayoutDashboard,
      label: String(t("btn.dashboard")),
      href: username ? `/${username}` : "/dashboard",
    },
    {
      key: "audits" as const,
      icon: FileText,
      label: String(t("dashboard.audits")),
      href: username ? `/${username}/audits` : "/dashboard",
    },
    {
      key: "settings" as const,
      icon: Settings,
      label: String(t("dashboard.settings")),
      href: "/settings",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-200 via-pink-100 via-40% to-orange-100 flex">
      {/* Feedback Modal */}
      {feedbackOpen && <FeedbackModal onClose={() => setFeedbackOpen(false)} />}

      {/* Sidebar */}
      <aside className="w-52 flex flex-col py-5 shrink-0">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 px-5 mb-6">
          <Image
            src="/syb_logo_transparent.png"
            alt="ShowYourBrand"
            width={28}
            height={28}
          />
          <span className="text-[14px] font-semibold text-gray-900 tracking-tight">
            ShowYourBrand
          </span>
        </Link>

        <nav className="flex-1 space-y-0.5 px-3">
          {menuItems.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-[13.5px] ${
                activeMenu === item.key
                  ? "bg-white/90 shadow-sm text-gray-900 font-medium"
                  : "text-gray-500 hover:bg-white/50 hover:text-gray-700"
              }`}
            >
              <item.icon
                className="w-[17px] h-[17px]"
                strokeWidth={activeMenu === item.key ? 2.2 : 1.8}
              />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Audit Credits Widget */}
        <div className="mx-3 bg-white/90 rounded-xl p-4 border border-gray-100/80 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Zap className="w-4 h-4 text-orange-500" />
            <span className="text-[13px] font-medium text-gray-700">
              {String(t("dashboard.auditsRemaining"))}
            </span>
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-2">
            {availableSlots}
          </p>
          <Link
            href="/settings#subscription"
            className="text-[13px] text-blue-600 hover:text-blue-700 font-medium"
          >
            {String(t("dashboard.buyMore"))}
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto flex flex-col">
        {/* Header */}
        <header className="px-8 py-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-sm">
              <Search className="w-4 h-4 text-gray-400 cursor-pointer hover:text-gray-600" />
              <span className="text-gray-300">/</span>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-br from-orange-400 to-amber-500" />
                <span className="font-medium text-gray-600">
                  {username || displayName}
                </span>
              </div>
              <span className="text-gray-300">/</span>

              {/* Projects Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-1 text-gray-900 font-semibold hover:text-gray-700 transition-colors"
                >
                  {String(t("dashboard.allProjects"))}
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-gray-500 transition-transform ${
                      dropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {dropdownOpen && (
                  <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                    {projects.length === 0 ? (
                      <p className="px-4 py-3 text-sm text-gray-400">
                        {String(t("dashboard.noProjects"))}
                      </p>
                    ) : (
                      projects.map((project) => (
                        <Link
                          key={project._id}
                          href={`/${username}/${project.slug}`}
                          onClick={() => setDropdownOpen(false)}
                          className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          {project.name}
                        </Link>
                      ))
                    )}
                    <div className="border-t border-gray-100 mt-1 pt-1">
                      <Link
                        href="/projects/create"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-orange-600 hover:bg-orange-50 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        {String(t("dashboard.createNewProject"))}
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => setFeedbackOpen(true)}
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                {String(t("dashboard.feedback"))}
              </button>
              <Link href="/projects/create">
                <button className="bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium rounded-full px-5 h-9 flex items-center gap-2 transition-colors">
                  <Plus className="w-3.5 h-3.5" />
                  {String(t("dashboard.newAudit"))}
                </button>
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-red-500 transition-colors"
                title={String(t("btn.logout"))}
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="px-8 pb-8 flex-1">{children}</div>
      </main>
    </div>
  );
}
