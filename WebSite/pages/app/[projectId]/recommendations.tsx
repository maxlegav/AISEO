import Head from "next/head";
import type { GetServerSideProps } from "next";
import { ArrowRight } from "lucide-react";
import MonitoringLayout from "@/components/monitoring/MonitoringLayout";
import ProjectNotFound from "@/components/monitoring/ProjectNotFound";
import PendingFirstRun from "@/components/monitoring/PendingFirstRun";
import DemoBanner from "@/components/monitoring/DemoBanner";
import { LLMBadge } from "@/components/monitoring/widgets";
import { priorityLabel, Recommendation, type Project } from "@/lib/mock/monitoring";
import { getSessionUserId, loginRedirect } from "@/lib/app-auth";
import { getProjectDashboard } from "@/lib/monitoring/dashboard";

const priorityStyles: Record<
  Recommendation["priority"],
  { dot: string; badge: string }
> = {
  high: { dot: "bg-red-500", badge: "bg-red-50 text-red-600" },
  medium: { dot: "bg-amber-500", badge: "bg-amber-50 text-amber-700" },
  low: { dot: "bg-emerald-500", badge: "bg-emerald-50 text-emerald-700" },
};

interface RecommendationsProps {
  project: Project | null;
  demo: boolean;
}

export default function RecommendationsView({
  project,
  demo,
}: RecommendationsProps) {
  if (!project) return <ProjectNotFound />;
  if (project.pendingFirstRun) {
    return (
      <MonitoringLayout
        project={project}
        active="recommendations"
        title="Recommandations"
      >
        <PendingFirstRun projectId={project.id} />
      </MonitoringLayout>
    );
  }

  const order = { high: 0, medium: 1, low: 2 };
  const recs = [...project.recommendations].sort(
    (a, b) => order[a.priority] - order[b.priority]
  );

  return (
    <>
      <Head>
        <title>{project.brandName} · Recommandations</title>
        <meta name="robots" content="noindex" />
      </Head>
      <MonitoringLayout
        project={project}
        active="recommendations"
        title="Recommandations"
        subtitle="Des actions concrètes, spécifiques à chaque moteur où vous êtes faible."
        demo={demo}
      >
        <DemoBanner demo={demo} />
        <div className="space-y-4">
          {recs.map((r, i) => {
            const st = priorityStyles[r.priority];
            return (
              <div
                key={i}
                className="rounded-2xl border border-white/60 bg-white/80 p-5 shadow-premium backdrop-blur-sm"
              >
                <div className="mb-2.5 flex flex-wrap items-center gap-2.5">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${st.badge}`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
                    {priorityLabel(r.priority)}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-100 bg-white px-2.5 py-1 text-xs">
                    <LLMBadge llm={r.llm} size={15} />
                  </span>
                </div>
                <h3 className="mb-1.5 text-base font-semibold text-gray-900">
                  {r.title}
                </h3>
                <p className="text-sm leading-relaxed text-gray-600">
                  {r.detail}
                </p>
              </div>
            );
          })}
        </div>

        <div className="mt-6 flex items-center justify-between rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50 to-fuchsia-50 p-5">
          <div>
            <p className="text-sm font-semibold text-gray-900">
              Ces recommandations sont recalculées à chaque run.
            </p>
            <p className="text-sm text-gray-500">
              Appliquez, laissez tourner, et mesurez l&apos;impact semaine après
              semaine.
            </p>
          </div>
          <ArrowRight className="h-5 w-5 text-violet-500" />
        </div>
      </MonitoringLayout>
    </>
  );
}

export const getServerSideProps: GetServerSideProps<RecommendationsProps> = async (
  ctx,
) => {
  const userId = await getSessionUserId(ctx);
  if (!userId) return loginRedirect("/app");
  const projectId = ctx.params?.projectId as string;
  const { project, demo } = await getProjectDashboard(userId, projectId);
  return { props: { project, demo } };
};
