import type { GetServerSideProps } from "next";
import ProjectDashboard, { nextRunHint } from "@/pages/app/[projectId]/index";
import { getPublicDemoProject } from "@/lib/monitoring/public-demo";

export default ProjectDashboard;

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const projectId = ctx.params?.projectId as string;
  const { project, switcherProjects } = await getPublicDemoProject(projectId);
  return {
    props: {
      project,
      switcherProjects,
      demo: false,
      nextRunLabel: nextRunHint(project?.nextRunAt),
    },
  };
};
