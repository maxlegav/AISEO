import type { GetServerSideProps } from "next";
import RecommendationsView from "@/pages/app/[projectId]/recommendations";
import { getPublicDemoProject } from "@/lib/monitoring/public-demo";

export default RecommendationsView;

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const projectId = ctx.params?.projectId as string;
  const { project, switcherProjects } = await getPublicDemoProject(projectId);
  return { props: { project, switcherProjects, demo: false } };
};
