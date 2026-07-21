import type { NextApiRequest, NextApiResponse } from "next";
import mongoose from "mongoose";
import Project from "@/models/Project";
import { handleApiError, ApiError, ErrorType } from "@/lib/error-handler";
import { runProjectMonitoring } from "@/lib/monitoring/pipeline";
import { requireWorkspace } from "@/lib/api-workspace";

// A manual run queries every prompt × engine — give it room.
export const config = { maxDuration: 300 };

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) return;
  await mongoose.connect(process.env.MONGODB_URI!);
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "METHOD_NOT_ALLOWED" });
  }
  try {
    const { workspace } = await requireWorkspace(req, res);
    await connectDB();

    const project = await Project.findById(req.query.projectId as string);
    if (!project) throw new ApiError(ErrorType.NOT_FOUND, "Project not found");
    if (project.organizationId?.toString() !== workspace.organizationId) {
      throw new ApiError(ErrorType.NOT_FOUND, "Project not found");
    }
    if (project.prompts.length === 0) {
      throw new ApiError(ErrorType.VALIDATION, "Add at least one prompt before running monitoring");
    }

    const summary = await runProjectMonitoring(project);
    return res.status(200).json({ success: true, data: summary });
  } catch (error) {
    return handleApiError(error, res);
  }
}
