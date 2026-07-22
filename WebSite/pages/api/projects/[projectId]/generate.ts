import type { NextApiRequest, NextApiResponse } from "next";
import mongoose from "mongoose";
import { z } from "zod";
import Project from "@/models/Project";
import MonitoredSource from "@/models/MonitoredSource";
import { handleApiError, ApiError, ErrorType } from "@/lib/error-handler";
import { requireWorkspace } from "@/lib/api-workspace";
import {
  generateDeliverable,
  externalSourceDomains,
  DELIVERABLE_KINDS,
  deliverableNeedsPrompt,
  type DeliverableContext,
} from "@/lib/generation/deliverables";
import { fetchSiteSignals } from "@/lib/monitoring/site-signals";
import { scanOnPage } from "@/lib/monitoring/onpage";

// The generation call hits an LLM API, so give it room.
export const config = { maxDuration: 60 };

const BodySchema = z.object({
  kind: z.enum(DELIVERABLE_KINDS as [string, ...string[]]),
  prompt: z.string().min(1).max(500).optional(),
});

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) return;
  await mongoose.connect(process.env.MONGODB_URI!);
};

/** Deliverable kinds that read the live site (for on-page context). */
const NEEDS_SITE = new Set(["org_jsonld"]);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "METHOD_NOT_ALLOWED" });
  }
  try {
    const { workspace } = await requireWorkspace(req, res);
    await connectDB();

    const parsed = BodySchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ApiError(ErrorType.VALIDATION, "Invalid deliverable request");
    }
    const kind = parsed.data.kind as (typeof DELIVERABLE_KINDS)[number];
    if (deliverableNeedsPrompt(kind) && !parsed.data.prompt) {
      throw new ApiError(ErrorType.VALIDATION, "This deliverable requires a target query");
    }

    const project = await Project.findById(req.query.projectId as string);
    if (!project) throw new ApiError(ErrorType.NOT_FOUND, "Project not found");
    if (project.organizationId?.toString() !== workspace.organizationId) {
      throw new ApiError(ErrorType.NOT_FOUND, "Project not found");
    }

    const sourceDocs = await MonitoredSource.find({ projectId: project._id })
      .sort({ citations: -1 })
      .select("domain")
      .lean();
    const sourceDomains = externalSourceDomains(
      project.websiteUrl,
      sourceDocs.map((s) => s.domain),
    );

    const ctx: DeliverableContext = {
      brandName: project.brandName,
      websiteUrl: project.websiteUrl,
      category: project.category ?? "",
      competitors: project.competitors,
      prompt: parsed.data.prompt,
      sourceDomains,
    };

    if (NEEDS_SITE.has(kind)) {
      const signals = await fetchSiteSignals(project.websiteUrl);
      const onPage = scanOnPage(signals.homeHtml, project.brandName);
      ctx.homeTitle = onPage.title;
      ctx.homeMeta = onPage.metaDescription;
      ctx.homeH1 = onPage.h1;
    }

    const deliverable = await generateDeliverable(kind, ctx);
    return res.status(200).json({ success: true, data: deliverable });
  } catch (error) {
    return handleApiError(error, res);
  }
}
