import type { NextApiRequest, NextApiResponse } from "next";
import crypto from "crypto";
import mongoose from "mongoose";
import Membership, { type MembershipRole } from "@/models/Membership";
import { handleApiError, ApiError, ErrorType } from "@/lib/error-handler";
import { requireWorkspace, requireManager } from "@/lib/api-workspace";

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) return;
  await mongoose.connect(process.env.MONGODB_URI!);
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ROLES: MembershipRole[] = ["admin", "member"];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { workspace } = await requireWorkspace(req, res);
    await connectDB();
    const organizationId = workspace.organizationId;

    if (req.method === "GET") {
      const members = await Membership.find({ organizationId })
        .sort({ createdAt: 1 })
        .select("email role status invitedAt acceptedAt inviteToken")
        .lean();
      return res.status(200).json({ success: true, data: members });
    }

    if (req.method === "POST") {
      requireManager(workspace);
      const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
      const role: MembershipRole = ROLES.includes(req.body.role) ? req.body.role : "member";
      if (!EMAIL_RE.test(email)) {
        return res.status(400).json({
          success: false,
          error: "VALIDATION_ERROR",
          message: "Adresse e-mail invalide.",
        });
      }

      const existing = await Membership.findOne({ organizationId, email });
      if (existing) {
        throw new ApiError(ErrorType.CONFLICT, "Ce membre fait déjà partie de l'organisation.");
      }

      const inviteToken = crypto.randomBytes(24).toString("hex");
      const membership = await Membership.create({
        organizationId,
        email,
        role,
        status: "invited",
        inviteToken,
        invitedByUserId: workspace.ownerId,
        invitedAt: new Date(),
      });

      const base = process.env.NEXTAUTH_URL || "";
      return res.status(201).json({
        success: true,
        data: {
          membership,
          inviteUrl: `${base}/app/join?token=${inviteToken}`,
        },
      });
    }

    return res.status(405).json({ success: false, error: "METHOD_NOT_ALLOWED" });
  } catch (error) {
    return handleApiError(error, res);
  }
}
