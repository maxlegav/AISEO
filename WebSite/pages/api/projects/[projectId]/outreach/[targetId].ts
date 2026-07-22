import type { NextApiRequest, NextApiResponse } from "next";
import mongoose from "mongoose";
import { z } from "zod";
import Project from "@/models/Project";
import OutreachTarget from "@/models/OutreachTarget";
import { handleApiError, ApiError, ErrorType } from "@/lib/error-handler";
import { requireWorkspace } from "@/lib/api-workspace";

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) return;
  await mongoose.connect(process.env.MONGODB_URI!);
};

const PatchSchema = z
  .object({
    editedSubject: z.string().max(300).optional(),
    editedBody: z.string().max(5000).optional(),
    contactEmail: z.string().email().max(320).nullable().optional(),
    status: z.enum(["draft", "approved", "rejected", "sent"]).optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: "Empty update" });

/**
 * PATCH  edits a draft (subject/body/contact) and/or moves its status.
 * DELETE removes the target.
 * No email is ever sent from here: "sent" only records that the user sent it
 * themselves (mailto / copy).
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { workspace } = await requireWorkspace(req, res);
    await connectDB();

    const projectId = req.query.projectId as string;
    const targetId = req.query.targetId as string;

    const project = await Project.findById(projectId);
    if (!project) throw new ApiError(ErrorType.NOT_FOUND, "Project not found");
    if (project.organizationId?.toString() !== workspace.organizationId) {
      throw new ApiError(ErrorType.NOT_FOUND, "Project not found");
    }

    if (!mongoose.Types.ObjectId.isValid(targetId)) {
      throw new ApiError(ErrorType.NOT_FOUND, "Target not found");
    }
    const target = await OutreachTarget.findById(targetId);
    if (!target || target.projectId.toString() !== project._id.toString()) {
      throw new ApiError(ErrorType.NOT_FOUND, "Target not found");
    }

    if (req.method === "DELETE") {
      await target.deleteOne();
      return res.status(200).json({ success: true, data: { deleted: true } });
    }

    if (req.method === "PATCH") {
      const parsed = PatchSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new ApiError(ErrorType.VALIDATION, "Invalid update");
      }
      const { editedSubject, editedBody, contactEmail, status } = parsed.data;
      if (editedSubject !== undefined) target.editedSubject = editedSubject;
      if (editedBody !== undefined) target.editedBody = editedBody;
      if (contactEmail !== undefined) {
        target.contactEmail = contactEmail;
        target.contactSource = contactEmail ? "manual" : null;
      }
      if (status !== undefined) {
        target.status = status;
        target.sentAt = status === "sent" ? new Date() : null;
      }
      await target.save();
      return res.status(200).json({ success: true, data: target.toObject() });
    }

    return res.status(405).json({ success: false, error: "METHOD_NOT_ALLOWED" });
  } catch (error) {
    return handleApiError(error, res);
  }
}
