import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import mongoose from "mongoose";
import User from "@/models/User";
import { handleApiError, ApiError, ErrorType } from "@/lib/error-handler";
import { handleZodError } from "@/lib/validation/helpers";
import { UpdateBrandingSchema } from "@/lib/validation/branding";
import { planForTier } from "@/lib/monitoring/plans";
import type { SubscriptionTier } from "@/lib/subscription-limits";

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
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.id) {
      throw new ApiError(ErrorType.AUTHENTICATION, "You must be logged in");
    }
    await connectDB();

    const user = await User.findById(session.user.id);
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
