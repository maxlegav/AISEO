import type { NextApiRequest, NextApiResponse } from "next";
import mongoose from "mongoose";
import { z } from "zod";
import Project from "@/models/Project";
import OutreachTarget from "@/models/OutreachTarget";
import OutreachSuppression from "@/models/OutreachSuppression";
import { handleApiError, ApiError, ErrorType } from "@/lib/error-handler";
import { requireWorkspace } from "@/lib/api-workspace";

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) return;
  await mongoose.connect(process.env.MONGODB_URI!);
};

const Schema = z.object({
  email: z.string().email().max(320),
  reason: z.string().max(300).optional(),
});

/**
 * POST adds an email to the organization's "ne plus contacter" list and marks
 * matching prepared targets as rejected. Supports opt-out / GDPR requests.
 */
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

    const parsed = Schema.safeParse(req.body);
    if (!parsed.success) {
      throw new ApiError(ErrorType.VALIDATION, "Invalid email");
    }
    const email = parsed.data.email.toLowerCase();

    await OutreachSuppression.updateOne(
      { organizationId: project.organizationId, email },
      {
        $setOnInsert: {
          organizationId: project.organizationId,
          email,
          reason: parsed.data.reason ?? "",
          createdAt: new Date(),
        },
      },
      { upsert: true },
    );

    // Reject any prepared targets in this org that use this email.
    await OutreachTarget.updateMany(
      { organizationId: project.organizationId, contactEmail: email },
      { $set: { status: "rejected" } },
    );

    return res.status(200).json({ success: true, data: { email } });
  } catch (error) {
    return handleApiError(error, res);
  }
}
