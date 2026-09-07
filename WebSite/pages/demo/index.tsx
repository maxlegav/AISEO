/**
 * `/demo` — the public, unauthenticated project list.
 *
 * Renders the exact `/app` overview component so the prospect sees the real
 * product, not a mockup; only the data source and the CTAs differ (see
 * `lib/monitoring/public-demo` and `useAppBase`).
 */
import type { GetServerSideProps } from "next";
import AppOverview from "@/pages/app/index";
import { getPublicDemoProjects } from "@/lib/monitoring/public-demo";
import type { Project } from "@/lib/mock/monitoring";

export default AppOverview;

export const getServerSideProps: GetServerSideProps = async () => {
  const { projects } = await getPublicDemoProjects();
  return {
    props: {
      projects: projects as Project[],
      demo: true,
      clients: [],
      activeClientId: null,
      usage: null,
    },
  };
};
