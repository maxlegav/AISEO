import type { GetServerSideProps } from "next";
import SourcesView from "@/pages/app/[projectId]/sources";
import { getPublicDemoProject } from "@/lib/monitoring/public-demo";

export default SourcesView;

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const projectId = ctx.params?.projectId as string;
  const { project, switcherProjects } = await getPublicDemoProject(projectId);
  return { props: { project, switcherProjects, demo: false } };
};
