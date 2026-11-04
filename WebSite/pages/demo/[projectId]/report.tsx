import type { GetServerSideProps } from "next";
import ProjectReport from "@/pages/app/[projectId]/report";
import { getPublicDemoProject } from "@/lib/monitoring/public-demo";
import {
  SYB_REPORT_BRANDING,
  type ReportBranding,
} from "@/lib/monitoring/branding";

export default ProjectReport;

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const projectId = ctx.params?.projectId as string;
  const { project } = await getPublicDemoProject(projectId);
  if (!project || project.pendingFirstRun) {
    return { redirect: { destination: `/demo/${projectId}`, permanent: false } };
  }

  // The demo is not anyone's workspace, so it shows the SYB branding rather
  // than a white label.
  const branding: ReportBranding = { ...SYB_REPORT_BRANDING, whiteLabel: false };

  return {
    props: {
      project,
      branding,
      generatedAt: new Date().toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
      demo: false,
    },
  };
};
