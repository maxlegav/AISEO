import Head from "next/head";
import type { GetServerSideProps } from "next";
import { TrendingUp } from "lucide-react";
import MonitoringLayout from "@/components/monitoring/MonitoringLayout";
import ProjectNotFound from "@/components/monitoring/ProjectNotFound";
import PendingFirstRun from "@/components/monitoring/PendingFirstRun";
import DemoBanner from "@/components/monitoring/DemoBanner";
import {
  DeltaBadge,
  LLMBadge,
  scoreColor,
} from "@/components/monitoring/widgets";
import { LLM_ORDER, type Project } from "@/lib/mock/monitoring";
import { getSessionWorkspace, loginRedirect } from "@/lib/app-auth";
import { getProjectDashboard } from "@/lib/monitoring/dashboard";

interface CompetitorsProps {
  project: Project | null;
  demo: boolean;
}

export default function CompetitorsView({ project, demo }: CompetitorsProps) {
  if (!project) return <ProjectNotFound />;
  if (project.pendingFirstRun) {
    return (
      <MonitoringLayout
        project={project}
        active="competitors"
        title="Concurrents"
      >
        <PendingFirstRun projectId={project.id} />
      </MonitoringLayout>
    );
  }

  const rows = [...project.competitorTable].sort((a, b) => b.global - a.global);
  const you = rows.find((r) => r.isYou);
  const ahead = rows.filter((r) => !r.isYou && you && r.global > you.global);

  return (
    <>
      <Head>
        <title>{project.brandName} · Concurrents</title>
        <meta name="robots" content="noindex" />
      </Head>
      <MonitoringLayout
        project={project}
        active="competitors"
        title="Concurrents"
        subtitle="Comparez votre visibilité IA à celle de vos concurrents, moteur par moteur."
        demo={demo}
      >
        <DemoBanner demo={demo} />
        {you && (
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-violet-100 bg-violet-50/70 p-4">
            <TrendingUp className="mt-0.5 h-5 w-5 shrink-0 text-violet-600" />
            <p className="text-sm text-gray-700">
              {ahead.length === 0 ? (
                <>
                  Vous êtes <strong>en tête</strong> de votre panel concurrentiel
                  sur le score global.
                </>
              ) : (
                <>
                  <strong>
                    {ahead.map((r) => r.name).join(", ")}
                  </strong>{" "}
                  vous {ahead.length > 1 ? "dépassent" : "dépasse"} sur le score
                  global. Votre plus gros écart est sur{" "}
                  <strong>Claude</strong> : voir les recommandations.
                </>
              )}
            </p>
          </div>
        )}

        <div className="overflow-hidden rounded-2xl border border-white/60 bg-white/80 shadow-premium backdrop-blur-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs uppercase tracking-wide text-gray-400">
                  <th className="px-5 py-3 font-semibold">Marque</th>
                  <th className="px-5 py-3 font-semibold">Global</th>
                  {LLM_ORDER.map((llm) => (
                    <th key={llm} className="px-5 py-3 font-semibold">
                      <LLMBadge llm={llm} size={16} showName={false} />
                    </th>
                  ))}
                  <th className="px-5 py-3 font-semibold">7 j</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr
                    key={r.name}
                    className={
                      r.isYou
                        ? "bg-violet-50/50"
                        : "border-t border-gray-50 hover:bg-gray-50/50"
                    }
                  >
                    <td className="px-5 py-3.5 font-medium text-gray-900">
                      <span className="flex items-center gap-2">
                        {r.name}
                        {r.isYou && (
                          <span className="rounded-full bg-violet-600 px-1.5 py-0.5 text-[10px] font-bold uppercase text-white">
                            Vous
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className="font-bold"
                        style={{ color: scoreColor(r.global) }}
                      >
                        {r.global}
                      </span>
                    </td>
                    {LLM_ORDER.map((llm) => (
                      <td key={llm} className="px-5 py-3.5">
                        <span className="flex items-center gap-2">
                          <span className="h-1.5 w-10 overflow-hidden rounded-full bg-gray-100">
                            <span
                              className="block h-full rounded-full"
                              style={{
                                width: `${r.scores[llm]}%`,
                                backgroundColor: scoreColor(r.scores[llm]),
                              }}
                            />
                          </span>
                          <span className="text-xs font-semibold text-gray-600">
                            {r.scores[llm]}
                          </span>
                        </span>
                      </td>
                    ))}
                    <td className="px-5 py-3.5">
                      <DeltaBadge value={r.trend} suffix="" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </MonitoringLayout>
    </>
  );
}

export const getServerSideProps: GetServerSideProps<CompetitorsProps> = async (
  ctx,
) => {
  const session = await getSessionWorkspace(ctx);
  if (!session) return loginRedirect("/app");
  const projectId = ctx.params?.projectId as string;
  const { project, demo } = await getProjectDashboard(
    session.workspace.organizationId,
    projectId,
  );
  return { props: { project, demo } };
};
