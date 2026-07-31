import type { NextApiRequest, NextApiResponse } from "next";
import { handleApiError, ApiError, ErrorType } from "@/lib/error-handler";
import { requireWorkspace } from "@/lib/api-workspace";
import { getProjectDashboard } from "@/lib/monitoring/dashboard";
import { getUserBranding, resolveReportBranding } from "@/lib/monitoring/branding";
import { renderReportPdf, reportFileName } from "@/lib/report/pdf";

/**
 * `GET /api/projects/:id/report.pdf` — the client-facing report as a real file.
 *
 * The web report already prints; this exists so an agency can attach something
 * to an email without asking the browser to do it. Same data and same branding
 * as `/app/:id/report`, rendered as a vector PDF.
 */

// Rendering a few pages is quick, but stay well clear of the default limit.
export const config = { maxDuration: 60 };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ success: false, error: "METHOD_NOT_ALLOWED" });
  }

  try {
    const { workspace } = await requireWorkspace(req, res);
    const projectId = req.query.projectId as string;

    const [{ project }, { branding, whiteLabelActive }] = await Promise.all([
      getProjectDashboard(workspace.organizationId, projectId),
      getUserBranding(workspace.ownerId),
    ]);

    if (!project) {
      throw new ApiError(ErrorType.NOT_FOUND, "Projet introuvable.");
    }
    if (project.pendingFirstRun) {
      throw new ApiError(
        ErrorType.VALIDATION,
        "Ce projet n'a pas encore de résultats : lancez une première analyse avant d'exporter.",
      );
    }

    const pdf = await renderReportPdf({
      project,
      branding: resolveReportBranding(branding, whiteLabelActive),
      generatedAt: new Date().toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${reportFileName(project.brandName)}"`,
    );
    res.setHeader("Content-Length", pdf.length);
    // A report is a point-in-time snapshot; never let a proxy serve a stale one.
    res.setHeader("Cache-Control", "private, no-store");
    return res.status(200).send(pdf);
  } catch (error) {
    return handleApiError(error, res);
  }
}
