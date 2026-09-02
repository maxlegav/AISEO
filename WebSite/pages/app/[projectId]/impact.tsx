import Head from "next/head";
import type { GetServerSideProps } from "next";
import MonitoringLayout from "@/components/monitoring/MonitoringLayout";
import {
  listSwitcherProjects,
  type SwitcherEntry,
} from "@/lib/monitoring/dashboard";
import ProjectNotFound from "@/components/monitoring/ProjectNotFound";
import PendingFirstRun from "@/components/monitoring/PendingFirstRun";
import RunButton from "@/components/monitoring/RunButton";
import ImpactManager from "@/components/monitoring/ImpactManager";
import type { Project } from "@/lib/mock/monitoring";
import { getSessionWorkspace, loginRedirect } from "@/lib/app-auth";
import { getImpactData, type ImpactPageData } from "@/lib/monitoring/impact-page";

/** Build the minimal UI project the layout needs (switcher + header). */
function layoutProject(meta: NonNullable<ImpactPageData["project"]>): Project {
  return {
    id: meta.id,
    brandName: meta.brandName,
    websiteUrl: meta.websiteUrl,
    category: "",
    competitors: [],
    prompts: meta.prompts.length,
    frequency: "Hebdomadaire",
    globalScore: 0,
    globalDelta: 0,
    llmScores: [],
    weekly: [],
    competitorTable: [],
    sources: [],
    recommendations: [],
  };
}

export default function ImpactView({
  data,
  switcherProjects,
}: {
  data: ImpactPageData;
  switcherProjects: SwitcherEntry[];
}) {
  if (!data.project) return <ProjectNotFound />;
  const project = layoutProject(data.project);

  if (data.project.pendingFirstRun) {
    return (
      <MonitoringLayout project={project} active="impact" title="Impact">
        <PendingFirstRun projectId={project.id} />
      </MonitoringLayout>
    );
  }

  return (
    <>
      <Head>
        <title>{project.brandName} · Impact</title>
        <meta name="robots" content="noindex" />
      </Head>
      <MonitoringLayout
        projects={switcherProjects}
        project={project}
        active="impact"
        title="Impact"
        subtitle="Mesurez l'effet de vos actions GEO sur votre visibilité, run après run."
        actions={<RunButton projectId={project.id} />}
      >
        <ImpactManager
          projectId={project.id}
          prompts={data.project.prompts}
          actions={data.actions}
        />
      </MonitoringLayout>
    </>
  );
}

export const getServerSideProps: GetServerSideProps<{
  data: ImpactPageData;
  switcherProjects: SwitcherEntry[];
}> = async (ctx) => {
  const session = await getSessionWorkspace(ctx);
  if (!session) return loginRedirect("/app");
  const projectId = ctx.params?.projectId as string;
  const data = await getImpactData(session.workspace.organizationId, projectId);
  const switcherProjects = await listSwitcherProjects(
    session.workspace.organizationId,
  );
  return { props: { data, switcherProjects } };
};
