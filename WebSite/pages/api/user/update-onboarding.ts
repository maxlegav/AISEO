import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import mongoose from "mongoose";
import User from "@/models/User";

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) return;
  await mongoose.connect(process.env.MONGODB_URI!);
};

const VALID_SEO_EXPERIENCES = ['beginner', 'intermediate', 'expert'];

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    await connectDB();

    const { onboardingDomain, onboardingActivity, onboardingSeoExperience, onboardingReferral } = req.body;

    const updateData: Record<string, string> = {};
    if (onboardingDomain && typeof onboardingDomain === 'string') {
      updateData.onboardingDomain = onboardingDomain.slice(0, 500);
    }
    if (onboardingActivity && typeof onboardingActivity === 'string') {
      updateData.onboardingActivity = onboardingActivity.slice(0, 200);
    }
    if (onboardingSeoExperience && VALID_SEO_EXPERIENCES.includes(onboardingSeoExperience)) {
      updateData.onboardingSeoExperience = onboardingSeoExperience;
    }
    if (onboardingReferral && typeof onboardingReferral === 'string') {
      updateData.onboardingReferral = onboardingReferral.slice(0, 200);
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: "No valid onboarding data provided" });
    }

    await User.findByIdAndUpdate(session.user.id, { $set: updateData });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error updating onboarding data:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
