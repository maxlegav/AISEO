import Head from "next/head";
import type { GetServerSideProps } from "next";
import MonitoringLayout from "@/components/monitoring/MonitoringLayout";
import ProjectNotFound from "@/components/monitoring/ProjectNotFound";
import PendingFirstRun from "@/components/monitoring/PendingFirstRun";
import RunButton from "@/components/monitoring/RunButton";
import OutreachManager from "@/components/monitoring/OutreachManager";
import type { Project } from "@/lib/mock/monitoring";
import { getSessionWorkspace, loginRedirect } from "@/lib/app-auth";
import { getOutreachData, type OutreachPageData } from "@/lib/outreach/outreach-page";

/** Build the minimal UI project the layout needs (switcher + header). */
function layoutProject(meta: NonNullable<OutreachPageData["project"]>): Project {
  return {
    id: meta.id,
    brandName: meta.brandName,
    websiteUrl: meta.websiteUrl,
    category: meta.category,
    competitors: [],
    prompts: 0,
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

export default function OutreachView({ data }: { data: OutreachPageData }) {
  if (!data.project) return <ProjectNotFound />;
  const project = layoutProject(data.project);

  if (data.project.pendingFirstRun) {
    return (
      <MonitoringLayout project={project} active="outreach" title="Outreach">
        <PendingFirstRun projectId={project.id} />
      </MonitoringLayout>
    );
  }

  return (
    <>
      <Head>
        <title>{project.brandName} · Outreach</title>
        <meta name="robots" content="noindex" />
      </Head>
      <MonitoringLayout
        project={project}
        active="outreach"
        title="Outreach"
        subtitle="Préparez des demandes de mention vers les sources qui vous ignorent. Vous validez et envoyez."
        actions={<RunButton projectId={project.id} />}
      >
        <OutreachManager
          projectId={project.id}
          targets={data.targets}
          suppressions={data.suppressions}
          dailyRemaining={data.dailyRemaining}
        />
      </MonitoringLayout>
    </>
  );
}

export const getServerSideProps: GetServerSideProps<{
  data: OutreachPageData;
}> = async (ctx) => {
  const session = await getSessionWorkspace(ctx);
  if (!session) return loginRedirect("/app");
  const projectId = ctx.params?.projectId as string;
  const data = await getOutreachData(session.workspace.organizationId, projectId);
  return { props: { data } };
};
