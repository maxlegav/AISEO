import type { NextApiRequest, NextApiResponse } from "next";
import mongoose from "mongoose";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import Membership from "@/models/Membership";
import User from "@/models/User";
import { handleApiError, ApiError, ErrorType } from "@/lib/error-handler";

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) return;
  await mongoose.connect(process.env.MONGODB_URI!);
};

/**
 * Accept an organization invite. The signed-in user's email must match the
 * invited email; on success the membership is attached to their user id and
 * activated, granting shared access to the organization's workspace.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "METHOD_NOT_ALLOWED" });
  }
  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.id) {
      throw new ApiError(ErrorType.AUTHENTICATION, "Connectez-vous pour accepter l'invitation.");
    }
    await connectDB();

    const token = typeof req.body.token === "string" ? req.body.token : "";
    if (!token) throw new ApiError(ErrorType.VALIDATION, "Jeton d'invitation manquant.");

    const membership = await Membership.findOne({ inviteToken: token, status: "invited" });
    if (!membership) throw new ApiError(ErrorType.NOT_FOUND, "Invitation invalide ou déjà utilisée.");

    const user = await User.findById(session.user.id).select("email").lean<{ email?: string } | null>();
    if ((user?.email ?? "").toLowerCase() !== membership.email.toLowerCase()) {
      throw new ApiError(
        ErrorType.AUTHORIZATION,
        "Cette invitation a été envoyée à une autre adresse e-mail.",
      );
    }

    membership.userId = new mongoose.Types.ObjectId(session.user.id);
    membership.status = "active";
    membership.inviteToken = null;
    membership.acceptedAt = new Date();
    await membership.save();

    return res.status(200).json({
      success: true,
      data: { organizationId: membership.organizationId.toString() },
    });
  } catch (error) {
    return handleApiError(error, res);
  }
}
