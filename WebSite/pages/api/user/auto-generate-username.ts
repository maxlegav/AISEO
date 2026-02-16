import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import mongoose from "mongoose";
import User from "@/models/User";
import { handleApiError, ApiError, ErrorType } from "@/lib/error-handler";

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) return;
  await mongoose.connect(process.env.MONGODB_URI!);
};

const RESERVED_USERNAMES = [
  "admin",
  "api",
  "auth",
  "dashboard",
  "settings",
  "login",
  "signup",
  "logout",
  "projects",
  "checkout",
  "webhook",
  "cron",
  "static",
  "public",
  "assets",
  "images",
  "css",
  "js",
  "fonts",
  "username-setup",
  "forgot-password",
  "reset-password",
  "subscription-plans",
  "ShowYourBrand",
  "support",
  "help",
  "waitlist",
];

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "METHOD_NOT_ALLOWED",
      message: "Only POST method is allowed",
    });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.id) {
      throw new ApiError(ErrorType.AUTHENTICATION, "You must be logged in");
    }

    await connectDB();

    const user = await User.findById(session.user.id);
    if (!user) {
      throw new ApiError(ErrorType.NOT_FOUND, "User not found");
    }

    // If user already has a username, return it
    if (user.username) {
      return res.status(200).json({
        success: true,
        data: { username: user.username },
      });
    }

    // Generate username from name or email
    const source = user.name || user.email?.split("@")[0] || "user";
    const baseName = source
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 25);

    let username = baseName.length >= 3 ? baseName : baseName + "-user";

    // Avoid reserved usernames
    if (RESERVED_USERNAMES.includes(username)) {
      username = `${username}-1`;
    }

    let suffix = 0;
    let candidate = username;
    while (await User.findOne({ username: candidate })) {
      suffix++;
      candidate = `${baseName}-${suffix}`;
    }
    username = candidate;

    user.username = username;
    await user.save();

    return res.status(200).json({
      success: true,
      data: { username },
    });
  } catch (error) {
    return handleApiError(error, res);
  }
}
