import type { NextApiRequest, NextApiResponse } from "next";
import mongoose from "mongoose";
import { z } from "zod";
import Project from "@/models/Project";
import GeoAction from "@/models/GeoAction";
import { handleApiError, ApiError, ErrorType } from "@/lib/error-handler";
import { requireWorkspace } from "@/lib/api-workspace";
import { captureSnapshot, hasScores } from "@/lib/monitoring/impact";

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) return;
  await mongoose.connect(process.env.MONGODB_URI!);
};

const CreateSchema = z.object({
  kind: z.enum([
    "answer_page",
    "forum_reply",
    "llms_txt",
    "faq_jsonld",
    "org_jsonld",
    "source_outreach",
    "custom",
  ]),
  title: z.string().min(1).max(200),
  prompt: z.string().min(1).max(500).optional(),
  publishedUrl: z.string().url().max(500).optional(),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { userId, workspace } = await requireWorkspace(req, res);
    await connectDB();

    const project = await Project.findById(req.query.projectId as string);
    if (!project) throw new ApiError(ErrorType.NOT_FOUND, "Project not found");
    if (project.organizationId?.toString() !== workspace.organizationId) {
      throw new ApiError(ErrorType.NOT_FOUND, "Project not found");
    }

    if (req.method === "GET") {
      const actions = await GeoAction.find({ projectId: project._id })
        .sort({ createdAt: -1 })
        .lean();
      return res.status(200).json({ success: true, data: actions });
    }

    if (req.method === "POST") {
      const parsed = CreateSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new ApiError(ErrorType.VALIDATION, "Invalid action");
      }
      if (!(await hasScores(project._id))) {
        throw new ApiError(
          ErrorType.VALIDATION,
          "Run monitoring at least once before tracking an action's impact",
        );
      }

      const baseline = await captureSnapshot(project._id, parsed.data.prompt ?? null);
      const action = await GeoAction.create({
        projectId: project._id,
        organizationId: project.organizationId,
        userId,
        kind: parsed.data.kind,
        title: parsed.data.title,
        prompt: parsed.data.prompt ?? null,
        publishedUrl: parsed.data.publishedUrl ?? null,
        status: "published",
        baseline,
      });
      return res.status(201).json({ success: true, data: action.toObject() });
    }

    return res.status(405).json({ success: false, error: "METHOD_NOT_ALLOWED" });
  } catch (error) {
    return handleApiError(error, res);
  }
}
