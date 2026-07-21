import type { NextApiRequest, NextApiResponse } from "next";
import mongoose from "mongoose";
import Membership from "@/models/Membership";
import { handleApiError, ApiError, ErrorType } from "@/lib/error-handler";
import { requireWorkspace, requireManager } from "@/lib/api-workspace";

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) return;
  await mongoose.connect(process.env.MONGODB_URI!);
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { workspace } = await requireWorkspace(req, res);
    await connectDB();
    requireManager(workspace);

    const membership = await Membership.findOne({
      _id: req.query.membershipId as string,
      organizationId: workspace.organizationId,
    });
    if (!membership) throw new ApiError(ErrorType.NOT_FOUND, "Membre introuvable.");

    if (req.method === "DELETE") {
      if (membership.role === "owner") {
        throw new ApiError(
          ErrorType.AUTHORIZATION,
          "Le propriétaire de l'organisation ne peut pas être retiré.",
        );
      }
      await membership.deleteOne();
      return res.status(200).json({ success: true, data: { id: membership._id.toString() } });
    }

    return res.status(405).json({ success: false, error: "METHOD_NOT_ALLOWED" });
  } catch (error) {
    return handleApiError(error, res);
  }
}
