import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]";
import mongoose from "mongoose";
import Project from "@/models/Project";
import { handleApiError, ApiError, ErrorType } from "@/lib/error-handler";
import { handleZodError } from "@/lib/validation/helpers";
import { UpdateProjectSchema } from "@/lib/validation/project";

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) return;
  await mongoose.connect(process.env.MONGODB_URI!);
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.id) {
      throw new ApiError(ErrorType.AUTHENTICATION, "You must be logged in");
    }
    await connectDB();

    const projectId = req.query.projectId as string;
    const project = await Project.findById(projectId);
    if (!project) {
      throw new ApiError(ErrorType.NOT_FOUND, "Project not found");
    }
    if (project.userId.toString() !== session.user.id) {
      throw new ApiError(ErrorType.AUTHORIZATION, "Access denied");
    }

    if (req.method === "GET") {
      return res.status(200).json({ success: true, data: project });
    }

    if (req.method === "PATCH") {
      const parsed = UpdateProjectSchema.safeParse(req.body);
      if (!parsed.success) return handleZodError(parsed.error, res);
      Object.assign(project, parsed.data);
      await project.save();
      return res.status(200).json({ success: true, data: project });
    }

    if (req.method === "DELETE") {
      await project.deleteOne();
      return res.status(200).json({ success: true, data: { id: projectId } });
    }

    return res.status(405).json({ success: false, error: "METHOD_NOT_ALLOWED" });
  } catch (error) {
    return handleApiError(error, res);
  }
}
