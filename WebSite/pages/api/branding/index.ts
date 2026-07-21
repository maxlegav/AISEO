import type { NextApiRequest, NextApiResponse } from "next";
import mongoose from "mongoose";
import User from "@/models/User";
import { handleApiError, ApiError, ErrorType } from "@/lib/error-handler";
import { handleZodError } from "@/lib/validation/helpers";
import { UpdateBrandingSchema } from "@/lib/validation/branding";
import { planForTier } from "@/lib/monitoring/plans";
import type { SubscriptionTier } from "@/lib/subscription-limits";
import { requireWorkspace, requireManager } from "@/lib/api-workspace";

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) return;
  await mongoose.connect(process.env.MONGODB_URI!);
};

const EMPTY_BRANDING = {
  agencyName: "",
  logoUrl: "",
  primaryColor: "#7c3aed",
  customDomain: "",
  brandedPdfEnabled: false,
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { workspace } = await requireWorkspace(req, res);
    await connectDB();

    // Branding is organization-level: read/write the org owner's User.branding.
    const user = await User.findById(workspace.ownerId);
    if (!user) throw new ApiError(ErrorType.NOT_FOUND, "User not found");

    const tier = (user.subscriptionTier as SubscriptionTier) || "none";
    // White-label is only *active* on plans whose branded PDF is enabled (Agence).
    const whiteLabelActive = planForTier(tier).brandedPdf;

    if (req.method === "GET") {
      return res.status(200).json({
        success: true,
        data: {
          branding: { ...EMPTY_BRANDING, ...(user.branding ?? {}) },
          whiteLabelActive,
        },
      });
    }

    if (req.method === "PUT") {
      requireManager(workspace);
      const parsed = UpdateBrandingSchema.safeParse(req.body);
      if (!parsed.success) return handleZodError(parsed.error, res);

      user.branding = {
        ...EMPTY_BRANDING,
        ...(user.branding ?? {}),
        ...parsed.data,
      };
      await user.save();

      return res.status(200).json({
        success: true,
        data: { branding: user.branding, whiteLabelActive },
      });
    }

    return res.status(405).json({ success: false, error: "METHOD_NOT_ALLOWED" });
  } catch (error) {
    return handleApiError(error, res);
  }
}
