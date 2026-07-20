import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import mongoose from "mongoose";
import Project from "@/models/Project";
import User from "@/models/User";
import { handleApiError, ApiError, ErrorType } from "@/lib/error-handler";
import { handleZodError } from "@/lib/validation/helpers";
import { CreateProjectSchema } from "@/lib/validation/project";
import { getProjectLimit } from "@/lib/monitoring/limits";
import type { SubscriptionTier } from "@/lib/subscription-limits";

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

    if (req.method === "GET") {
      const projects = await Project.find({ userId: session.user.id }).sort({ createdAt: -1 });
      return res.status(200).json({ success: true, data: projects });
    }

    if (req.method === "POST") {
      const parsed = CreateProjectSchema.safeParse(req.body);
      if (!parsed.success) return handleZodError(parsed.error, res);

      const user = await User.findById(session.user.id);
      const limit = getProjectLimit((user!.subscriptionTier as SubscriptionTier) || "none");
      const count = await Project.countDocuments({ userId: session.user.id });
      if (count >= limit) {
        return res.status(403).json({
          success: false,
          error: "UPGRADE_REQUIRED",
          message: `Votre plan autorise ${limit} projet(s). Passez à un plan supérieur pour en suivre davantage.`,
        });
      }

      const project = await Project.create({ ...parsed.data, userId: session.user.id });
      return res.status(201).json({ success: true, data: project });
    }

    return res.status(405).json({ success: false, error: "METHOD_NOT_ALLOWED" });
  } catch (error) {
    return handleApiError(error, res);
  }
}
