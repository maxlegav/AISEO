import { ReactNode, useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  FileText,
  FolderKanban,
  Settings,
  Bell,
  Plus,
  LogOut,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useLanguage } from "@/components/LanguageContext";

interface DashboardLayoutProps {
  children: ReactNode;
  activeMenu?: "dashboard" | "audits" | "projects" | "settings";
}

export default function DashboardLayout({
  children,
  activeMenu = "dashboard",
}: DashboardLayoutProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t } = useLanguage();
  const [creditsUsed, setCreditsUsed] = useState(0);
  const [creditsTotal, setCreditsTotal] = useState(0);

  // Fetch real credits data
  useEffect(() => {
    if (status === "authenticated") {
      setCreditsUsed(session?.user?.auditCredits || 0);
      const tier = session?.user?.subscriptionTier;
      if (tier === "premium") setCreditsTotal(20);
      else if (tier === "pro" || tier === "basic") setCreditsTotal(1);
      else setCreditsTotal(0);
    }
  }, [status, session]);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/dashboard");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-600">{String(t("common.loading"))}</p>
        </div>
      </div>
    );
  }

  const username = session?.user?.username;

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
      key: "projects" as const,
      icon: FolderKanban,
      label: String(t("dashboard.projects")),
      href: username ? `/${username}` : "/dashboard",
    },
    {
      key: "settings" as const,
      icon: Settings,
      label: String(t("dashboard.settings")),
      href: "/settings",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white/80 backdrop-blur-sm border-r border-gray-200 flex flex-col">
        <div className="p-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center">
              <Image
                src="/syb_logo_transparent.png"
                alt="ShowYourBrand"
                width={40}
                height={40}
              />
            </div>
            <span className="font-heading text-lg font-bold text-gray-900 tracking-tight">
              ShowYourBrand
            </span>
          </Link>
        </div>

        <div className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
          MENU
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {menuItems.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                activeMenu === item.key
                  ? "bg-white shadow-sm text-gray-900"
                  : "text-gray-600 hover:bg-white/50"
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Credits Widget */}
        <div className="p-4 m-4 bg-white rounded-xl border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              {String(t("dashboard.credits"))}
            </span>
            <span className="text-sm font-bold text-gray-900">
              {creditsUsed}/{creditsTotal}
            </span>
          </div>
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mb-3">
            <div
              className="h-full bg-gradient-to-r from-orange-500 to-amber-400 transition-all"
              style={{
                width: creditsTotal > 0 ? `${(creditsUsed / creditsTotal) * 100}%` : "0%",
              }}
            />
          </div>
          <Link href="/settings">
            <Button className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-sm h-9">
              {String(t("dashboard.upgradePlan"))}
            </Button>
          </Link>
        </div>

        {/* Logout Button */}
        <div className="px-4 pb-4">
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">{String(t("btn.logout"))}</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
          <div className="flex items-center justify-between px-8 py-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-amber-500 rounded-full flex items-center justify-center text-white font-semibold">
                  {(session?.user?.displayName || session?.user?.name)?.[0] || "U"}
                </div>
                <span className="font-medium text-gray-900">
                  {session?.user?.displayName || session?.user?.name || "User"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link href="/projects/create">
                <Button className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  {String(t("dashboard.newProject"))}
                </Button>
              </Link>
              <button className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center">
                <Bell className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
