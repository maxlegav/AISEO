import type { NextApiRequest, NextApiResponse } from "next";
import mongoose from "mongoose";
import User from "@/models/User";
import { handleApiError, ApiError, ErrorType } from "@/lib/error-handler";
import { UsernameSchema } from "@/lib/validation/business";

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
];

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    return res.status(405).json({
      success: false,
      error: "METHOD_NOT_ALLOWED",
      message: "Only GET method is allowed",
    });
  }

  try {
    const raw = req.query.username;
    if (!raw || typeof raw !== "string") {
      throw new ApiError(
        ErrorType.VALIDATION,
        "Username query parameter is required",
      );
    }

    const parsed = UsernameSchema.safeParse(raw);
    if (!parsed.success) {
      return res.status(200).json({
        success: true,
        data: {
          available: false,
          reason: parsed.error.issues[0]?.message || "Invalid username",
        },
      });
    }

    const username = parsed.data;

    if (RESERVED_USERNAMES.includes(username)) {
      return res.status(200).json({
        success: true,
        data: { available: false, reason: "This username is not available" },
      });
    }

    await connectDB();

    const existingUser = await User.findOne({ username });
    const available = !existingUser;

    return res.status(200).json({
      success: true,
      data: { available },
    });
  } catch (error) {
    return handleApiError(error, res);
  }
}
