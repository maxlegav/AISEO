import type { NextApiRequest, NextApiResponse } from "next";
import mongoose from "mongoose";
import Project from "@/models/Project";
import Client from "@/models/Client";
import { handleApiError, ApiError, ErrorType } from "@/lib/error-handler";
import { handleZodError } from "@/lib/validation/helpers";
import { UpdateProjectSchema } from "@/lib/validation/project";
import { requireWorkspace, requireManager } from "@/lib/api-workspace";

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) return;
  await mongoose.connect(process.env.MONGODB_URI!);
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { workspace } = await requireWorkspace(req, res);
    await connectDB();

    const projectId = req.query.projectId as string;
    const project = await Project.findById(projectId);
    if (!project) {
      throw new ApiError(ErrorType.NOT_FOUND, "Project not found");
    }
    // Tenant isolation: the project must belong to the acting organization.
    if (project.organizationId?.toString() !== workspace.organizationId) {
      throw new ApiError(ErrorType.NOT_FOUND, "Project not found");
    }

    if (req.method === "GET") {
      return res.status(200).json({ success: true, data: project });
    }

    if (req.method === "PATCH") {
      const parsed = UpdateProjectSchema.safeParse(req.body);
      if (!parsed.success) return handleZodError(parsed.error, res);

      // Allow reassigning the project to a client within the same org.
      if (typeof req.body.clientId !== "undefined") {
        if (req.body.clientId === null || req.body.clientId === "") {
          project.clientId = null;
        } else {
          const client = await Client.findOne({
            _id: req.body.clientId,
            organizationId: workspace.organizationId,
          });
          if (!client) {
            throw new ApiError(ErrorType.NOT_FOUND, "Client introuvable pour cette organisation.");
          }
          project.clientId = client._id;
        }
      }

      Object.assign(project, parsed.data);
      await project.save();
      return res.status(200).json({ success: true, data: project });
    }

    if (req.method === "DELETE") {
      requireManager(workspace);
      await project.deleteOne();
      return res.status(200).json({ success: true, data: { id: projectId } });
    }

    return res.status(405).json({ success: false, error: "METHOD_NOT_ALLOWED" });
  } catch (error) {
    return handleApiError(error, res);
  }
}
