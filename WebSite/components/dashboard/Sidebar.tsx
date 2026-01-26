import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useSession, signOut } from "next-auth/react";
import Image from "next/image";
import { useLanguage } from "@/components/LanguageContext";

// Icônes
const HomeIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const InvoiceIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <path d="M14 2v6h6" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <line x1="10" y1="9" x2="8" y2="9" />
  </svg>
);

const ClientsIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const AgendaIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const ReminderIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M22 17H2a3 3 0 0 0 3-3V9a7 7 0 0 1 14 0v5a3 3 0 0 0 3 3Z"></path>
    <path d="M9 17v1a3 3 0 0 0 6 0v-1"></path>
  </svg>
);

const SettingsIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

const LogoutIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

const LanguageIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    <path d="M2 12h20" />
  </svg>
);

export default function Sidebar() {
  const router = useRouter();
  const { data: session } = useSession();
  const [collapsed, setCollapsed] = useState(false);
  const { language, setLanguage, t } = useLanguage();

  const menuItems = [
    {
      name: t("sidebar.dashboard").toString(),
      path: "/dashboard-view",
      icon: <HomeIcon />,
    },
    {
      name: t("sidebar.invoices").toString(),
      path: "/dashboard-view/invoices",
      icon: <InvoiceIcon />,
    },
    {
      name: t("sidebar.clients").toString(),
      path: "/dashboard-view/clients",
      icon: <ClientsIcon />,
    },
    {
      name: t("sidebar.agenda").toString(),
      path: "/dashboard-view/agenda",
      icon: <AgendaIcon />,
    },
    {
      name: t("sidebar.reminders").toString(),
      path: "/dashboard-view/reminders",
      icon: <ReminderIcon />,
    },
    {
      name: t("sidebar.settings").toString(),
      path: "/dashboard-view/settings",
      icon: <SettingsIcon />,
    },
  ];

  const isActive = (path: string) => {
    if (path === "/dashboard-view") {
      return router.pathname === "/dashboard-view";
    }
    return router.pathname.startsWith(path);
  };

  return (
    <aside
      className={`${
        collapsed ? "w-20" : "w-64"
      } transition-width duration-300 h-screen bg-white border-r border-gray-200 flex flex-col`}
    >
      <div className="p-4 flex items-center justify-between border-b border-gray-200">
        <div className="flex items-center gap-2">
          {!collapsed && (
            <span className="text-xl font-bold text-[#0F0F0F]">
              AutoInvoice
            </span>
          )}
          {collapsed && (
            <span className="text-xl font-bold text-[#0F0F0F]">AI</span>
          )}
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded hover:bg-[#F5F5F5]"
        >
          {collapsed ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          )}
        </button>
      </div>

      <nav className="flex-grow py-6">
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.path}>
              <Link href={item.path}>
                <div
                  className={`flex items-center py-3 px-4 ${
                    isActive(item.path)
                      ? "bg-[#F5F5F5] text-[#0F0F0F] border-r-4 border-[#0F0F0F]"
                      : "text-gray-700 hover:bg-[#F5F5F5]"
                  }`}
                >
                  <span className="mr-3">{item.icon}</span>
                  {!collapsed && <span>{item.name}</span>}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="border-t border-gray-200 p-4">
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-[#F5F5F5] flex-shrink-0 overflow-hidden">
            {session?.user?.image ? (
              <Image
                src={session.user.image}
                alt="Avatar"
                width={32}
                height={32}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[#0F0F0F]">
                {session?.user?.name?.charAt(0)?.toUpperCase() || "U"}
              </div>
            )}
          </div>
          {!collapsed && (
            <div className="ml-3 truncate">
              <p className="text-sm font-medium text-gray-800 truncate">
                {session?.user?.name || "Utilisateur"}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {session?.user?.email || ""}
              </p>
            </div>
          )}
        </div>

        <button
          onClick={() => setLanguage(language === "fr" ? "en" : "fr")}
          className={`mt-4 flex items-center py-2 px-3 w-full rounded text-blue-600 hover:bg-blue-50 transition-colors`}
        >
          <span className="mr-3">
            <LanguageIcon />
          </span>
          {!collapsed && (
            <span>
              {language === "fr"
                ? t("sidebar.switchToEnglish").toString()
                : t("sidebar.switchToFrench").toString()}
            </span>
          )}
        </button>

        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className={`mt-2 flex items-center py-2 px-3 w-full rounded text-red-600 hover:bg-red-50 transition-colors`}
        >
          <span className="mr-3">
            <LogoutIcon />
          </span>
          {!collapsed && <span>{t("sidebar.logout").toString()}</span>}
        </button>
      </div>
    </aside>
  );
}
