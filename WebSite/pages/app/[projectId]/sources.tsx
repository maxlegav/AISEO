import Head from "next/head";
import type { GetServerSideProps } from "next";
import { useState } from "react";
import { Check, ExternalLink, X } from "lucide-react";
import MonitoringLayout from "@/components/monitoring/MonitoringLayout";
import ProjectNotFound from "@/components/monitoring/ProjectNotFound";
import PendingFirstRun from "@/components/monitoring/PendingFirstRun";
import DemoBanner from "@/components/monitoring/DemoBanner";
import { LLMBadge } from "@/components/monitoring/widgets";
import { LLMId, LLMS, LLM_ORDER, type Project } from "@/lib/mock/monitoring";
import { getSessionUserId, loginRedirect } from "@/lib/app-auth";
import { getProjectDashboard } from "@/lib/monitoring/dashboard";
import { cn } from "@/lib/utils";

interface SourcesProps {
  project: Project | null;
  demo: boolean;
}

export default function SourcesView({ project, demo }: SourcesProps) {
  const [filter, setFilter] = useState<LLMId | "all">("all");

  if (!project) return <ProjectNotFound />;
  if (project.pendingFirstRun) {
    return (
      <MonitoringLayout project={project} active="sources" title="Sources citées">
        <PendingFirstRun projectId={project.id} />
      </MonitoringLayout>
    );
  }

  const sources =
    filter === "all"
      ? project.sources
      : project.sources.filter((s) => s.llms.includes(filter));

  return (
    <>
      <Head>
        <title>{project.brandName} · Sources citées</title>
        <meta name="robots" content="noindex" />
      </Head>
      <MonitoringLayout
        project={project}
        active="sources"
        title="Sources citées"
        subtitle="Les pages que les IA citent sur vos requêtes — et si elles mentionnent votre marque."
        demo={demo}
      >
        <DemoBanner demo={demo} />
        <div className="mb-5 flex flex-wrap items-center gap-2">
          <button
            onClick={() => setFilter("all")}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
              filter === "all"
                ? "bg-gray-900 text-white"
                : "border border-white/60 bg-white/70 text-gray-600 hover:bg-white"
            )}
          >
            Tous les moteurs
          </button>
          {LLM_ORDER.map((llm) => (
            <button
              key={llm}
              onClick={() => setFilter(llm)}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
                filter === llm
                  ? "bg-gray-900 text-white"
                  : "border border-white/60 bg-white/70 text-gray-600 hover:bg-white"
              )}
            >
              <LLMBadge llm={llm} size={15} showName={false} />
              {LLMS[llm].name}
            </button>
          ))}
        </div>

        <div className="space-y-2.5">
          {sources.map((s) => (
            <div
              key={s.url}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/60 bg-white/80 p-4 shadow-premium backdrop-blur-sm"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="truncate font-medium text-gray-900">
                    {s.domain}
                  </span>
                  <ExternalLink className="h-3.5 w-3.5 shrink-0 text-gray-300" />
                </div>
                <p className="truncate text-xs text-gray-400">{s.url}</p>
              </div>

              <div className="flex items-center gap-4">
                <span className="text-xs text-gray-400">
                  cité sur <strong className="text-gray-600">{s.citations}</strong>{" "}
                  requêtes
                </span>
                <div className="flex items-center gap-1">
                  {s.llms.map((llm) => (
                    <LLMBadge key={llm} llm={llm} size={16} showName={false} />
                  ))}
                </div>
                {s.citesBrand ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
                    <Check className="h-3 w-3" />
                    Vous cite
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-500">
                    <X className="h-3 w-3" />
                    Ne vous cite pas
                  </span>
                )}
              </div>
            </div>
          ))}

          {sources.length === 0 && (
            <div className="rounded-2xl border border-white/60 bg-white/70 py-16 text-center text-sm text-gray-400 shadow-premium">
              Aucune source pour ce moteur sur la période.
            </div>
          )}
        </div>
      </MonitoringLayout>
    </>
  );
}

export const getServerSideProps: GetServerSideProps<SourcesProps> = async (
  ctx,
) => {
  const userId = await getSessionUserId(ctx);
  if (!userId) return loginRedirect("/app");
  const projectId = ctx.params?.projectId as string;
  const { project, demo } = await getProjectDashboard(userId, projectId);
  return { props: { project, demo } };
};
