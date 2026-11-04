import type { GetServerSideProps } from "next";
import CompetitorsView from "@/pages/app/[projectId]/competitors";
import { getPublicDemoProject } from "@/lib/monitoring/public-demo";

export default CompetitorsView;

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const projectId = ctx.params?.projectId as string;
  const { project, switcherProjects } = await getPublicDemoProject(projectId);
  return { props: { project, switcherProjects, demo: false } };
};
