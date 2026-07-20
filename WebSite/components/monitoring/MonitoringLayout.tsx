import { ReactNode, useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  LayoutGrid,
  Users,
  Link2,
  Lightbulb,
  Settings,
  ChevronDown,
  ChevronsLeft,
  Plus,
  Bell,
  Sparkles,
} from "lucide-react";
import { PROJECTS, Project } from "@/lib/mock/monitoring";
import { cn } from "@/lib/utils";

export type MonitoringSection =
  | "dashboard"
  | "competitors"
  | "sources"
  | "recommendations"
  | "settings";

interface MonitoringLayoutProps {
  children: ReactNode;
  project?: Project;
  active: MonitoringSection;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

function ProjectSwitcher({ current }: { current?: Project }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative px-3" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-2 rounded-xl border border-white/60 bg-white/70 px-3 py-2.5 text-left shadow-sm transition-colors hover:bg-white"
      >
        <span className="flex items-center gap-2.5 min-w-0">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-fuchsia-600 text-xs font-bold text-white">
            {current ? current.brandName.charAt(0) : "•"}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-[13px] font-semibold text-gray-900">
              {current ? current.brandName : "Tous les projets"}
            </span>
            <span className="block truncate text-[11px] text-gray-400">
              {current ? current.websiteUrl : `${PROJECTS.length} marques suivies`}
            </span>
          </span>
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-gray-400 transition-transform",
            open && "rotate-180"
          )}
        />
      </button>

      {open && (
        <div className="absolute left-3 right-3 top-full z-50 mt-1.5 rounded-xl border border-gray-200 bg-white py-1.5 shadow-xl">
          <Link
            href="/app"
            onClick={() => setOpen(false)}
            className="block px-3 py-2 text-[13px] text-gray-600 hover:bg-gray-50"
          >
            Tous les projets
          </Link>
          <div className="my-1 border-t border-gray-100" />
          {PROJECTS.map((p) => (
            <Link
              key={p.id}
              href={`/app/${p.id}`}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 text-[13px] hover:bg-gray-50",
                current?.id === p.id
                  ? "font-semibold text-gray-900"
                  : "text-gray-600"
              )}
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-violet-500 to-fuchsia-500 text-[11px] font-bold text-white">
                {p.brandName.charAt(0)}
              </span>
              {p.brandName}
            </Link>
          ))}
          <div className="my-1 border-t border-gray-100" />
          <Link
            href="/app/new"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2 text-[13px] font-medium text-violet-600 hover:bg-violet-50"
          >
            <Plus className="h-3.5 w-3.5" />
            Nouveau projet
          </Link>
        </div>
      )}
    </div>
  );
}

export default function MonitoringLayout({
  children,
  project,
  active,
  title,
  subtitle,
  actions,
}: MonitoringLayoutProps) {
  const base = project ? `/app/${project.id}` : "/app";

  const nav: {
    key: MonitoringSection;
    label: string;
    icon: typeof LayoutGrid;
    href: string;
    disabled?: boolean;
  }[] = [
    { key: "dashboard", label: "Vue projet", icon: LayoutGrid, href: base },
    {
      key: "competitors",
      label: "Concurrents",
      icon: Users,
      href: `${base}/competitors`,
      disabled: !project,
    },
    {
      key: "sources",
      label: "Sources citées",
      icon: Link2,
      href: `${base}/sources`,
      disabled: !project,
    },
    {
      key: "recommendations",
      label: "Recommandations",
      icon: Lightbulb,
      href: `${base}/recommendations`,
      disabled: !project,
    },
  ];

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-violet-50 via-purple-50/60 to-fuchsia-50/40">
      {/* Sidebar */}
      <aside className="flex w-60 shrink-0 flex-col border-r border-white/60 py-5">
        <Link href="/" className="mb-6 flex items-center gap-2 px-5">
          <Image
            src="/syb_logo_transparent.png"
            alt="ShowYourBrand"
            width={26}
            height={26}
          />
          <span className="text-[14px] font-semibold tracking-tight text-gray-900">
            ShowYourBrand
          </span>
        </Link>

        <ProjectSwitcher current={project} />

        <nav className="mt-5 flex-1 space-y-0.5 px-3">
          <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
            Monitoring
          </p>
          {nav.map((item) =>
            item.disabled ? (
              <span
                key={item.key}
                className="flex cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2.5 text-[13.5px] text-gray-300"
                title="Choisissez un projet"
              >
                <item.icon className="h-[17px] w-[17px]" strokeWidth={1.8} />
                {item.label}
              </span>
            ) : (
              <Link
                key={item.key}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13.5px] transition-all",
                  active === item.key
                    ? "bg-white/90 font-medium text-gray-900 shadow-sm"
                    : "text-gray-500 hover:bg-white/50 hover:text-gray-700"
                )}
              >
                <item.icon
                  className="h-[17px] w-[17px]"
                  strokeWidth={active === item.key ? 2.2 : 1.8}
                />
                {item.label}
              </Link>
            )
          )}

          <p className="px-3 pb-1.5 pt-4 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
            Compte
          </p>
          <Link
            href="/app/settings"
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13.5px] transition-all",
              active === "settings"
                ? "bg-white/90 font-medium text-gray-900 shadow-sm"
                : "text-gray-500 hover:bg-white/50 hover:text-gray-700"
            )}
          >
            <Settings
              className="h-[17px] w-[17px]"
              strokeWidth={active === "settings" ? 2.2 : 1.8}
            />
            Branding & équipe
          </Link>
        </nav>

        <div className="mx-3 rounded-xl border border-violet-100 bg-white/80 p-3.5 shadow-sm">
          <div className="mb-1 flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-violet-600" />
            <span className="text-[12px] font-semibold text-gray-800">
              Prototype
            </span>
          </div>
          <p className="text-[11px] leading-snug text-gray-500">
            Données de démonstration. Le monitoring live arrive avec le pipeline.
          </p>
        </div>
      </aside>

      {/* Main */}
      <main className="flex flex-1 flex-col overflow-y-auto">
        <header className="flex items-start justify-between gap-4 px-8 py-5">
          <div className="flex items-center gap-3">
            <Link
              href="/app"
              className="mt-0.5 rounded-lg border border-white/60 bg-white/60 p-1.5 text-gray-400 transition-colors hover:text-gray-700"
              title="Tous les projets"
            >
              <ChevronsLeft className="h-4 w-4" />
            </Link>
            <div>
              <h1 className="font-heading text-2xl font-semibold tracking-tight text-gray-900">
                {title}
              </h1>
              {subtitle && (
                <p className="mt-0.5 text-sm text-gray-500">{subtitle}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {actions}
            <button
              className="rounded-full border border-white/60 bg-white/60 p-2 text-gray-400 transition-colors hover:text-gray-700"
              title="Alertes"
            >
              <Bell className="h-4 w-4" />
            </button>
          </div>
        </header>

        <div className="flex-1 px-8 pb-10">{children}</div>
      </main>
    </div>
  );
}
