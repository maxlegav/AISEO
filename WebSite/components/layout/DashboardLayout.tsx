import { ReactNode, useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import {
  LayoutDashboard,
  FileText,
  Settings,
  Plus,
  Search,
  ChevronDown,
  Zap,
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

export default function DashboardLayout({
  children,
  activeMenu = "dashboard",
}: DashboardLayoutProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t } = useLanguage();
  const [auditCredits, setAuditCredits] = useState(0);
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch audit credits
  useEffect(() => {
    if (status === "authenticated") {
      setAuditCredits(session?.user?.auditCredits || 0);
    }
  }, [status, session]);

  // Fetch projects for dropdown
  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/businesses/list")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setProjects(data.data);
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
    }
  }, [status, router]);

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
            {auditCredits}
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
              <button className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
                {String(t("dashboard.feedback"))}
              </button>
              <Link href="/projects/create">
                <button className="bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium rounded-full px-5 h-9 flex items-center gap-2 transition-colors">
                  <Plus className="w-3.5 h-3.5" />
                  {String(t("dashboard.newAudit"))}
                </button>
              </Link>
              
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="px-8 pb-8 flex-1">{children}</div>
      </main>
    </div>
  );
}
