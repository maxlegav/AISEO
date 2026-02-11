import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./[...nextauth]";
import mongoose from "mongoose";
import User from "@/models/User";

// Connect to MongoDB
const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) return;

  try {
    await mongoose.connect(process.env.MONGODB_URI!);
  } catch (error) {
    console.error("Failed to connect to MongoDB", error);
  }
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // Get session
    const session = await getServerSession(req, res, authOptions);

    if (!session) {
      return res.redirect("/login?error=AccessDenied");
    }

    await connectDB();

    // Check if the user exists
    const user = await User.findById(session.user.id);

    if (!user) {
      return res.redirect("/login?error=UserNotFound");
    }

    // Check if this is a brand new OAuth user (account created within last 2 minutes)
    // This means they just signed up via Google from the signup page and need to complete payment
    const isJustCreated = user.createdAt &&
      (Date.now() - new Date(user.createdAt).getTime()) < 2 * 60 * 1000;

    const hasNeverPaid = !user.stripeCustomerId &&
      (user.auditCredits || 0) === 0 &&
      user.subscriptionTier === 'none';

    if (isJustCreated && hasNeverPaid) {
      // Brand new OAuth user from signup - send to step 6 (pricing)
      return res.redirect("/signup?oauth=1");
    }

    // Existing user logging in - always go to dashboard
    return res.redirect("/dashboard");
  } catch (error) {
    console.error("Error during session redirect:", error);
    return res.redirect("/login?error=ServerError");
  }
}
