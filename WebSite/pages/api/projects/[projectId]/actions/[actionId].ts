import type { NextApiRequest, NextApiResponse } from "next";
import mongoose from "mongoose";
import Project from "@/models/Project";
import GeoAction from "@/models/GeoAction";
import { handleApiError, ApiError, ErrorType } from "@/lib/error-handler";
import { requireWorkspace } from "@/lib/api-workspace";
import { captureSnapshot } from "@/lib/monitoring/impact";

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) return;
  await mongoose.connect(process.env.MONGODB_URI!);
};

/**
 * POST   measures the action (snapshot current scores as `after`).
 * DELETE removes the action.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { workspace } = await requireWorkspace(req, res);
    await connectDB();

    const projectId = req.query.projectId as string;
    const actionId = req.query.actionId as string;

    const project = await Project.findById(projectId);
    if (!project) throw new ApiError(ErrorType.NOT_FOUND, "Project not found");
    if (project.organizationId?.toString() !== workspace.organizationId) {
      throw new ApiError(ErrorType.NOT_FOUND, "Project not found");
    }

    if (!mongoose.Types.ObjectId.isValid(actionId)) {
      throw new ApiError(ErrorType.NOT_FOUND, "Action not found");
    }
    const action = await GeoAction.findById(actionId);
    if (!action || action.projectId.toString() !== project._id.toString()) {
      throw new ApiError(ErrorType.NOT_FOUND, "Action not found");
    }

    if (req.method === "DELETE") {
      await action.deleteOne();
      return res.status(200).json({ success: true, data: { deleted: true } });
    }

    if (req.method === "POST") {
      const after = await captureSnapshot(project._id, action.prompt ?? null);
      action.after = after;
      action.status = "measured";
      action.measuredAt = new Date();
      await action.save();
      return res.status(200).json({ success: true, data: action.toObject() });
    }

    return res.status(405).json({ success: false, error: "METHOD_NOT_ALLOWED" });
  } catch (error) {
    return handleApiError(error, res);
  }
}
