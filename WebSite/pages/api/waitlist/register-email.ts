import type { NextApiRequest, NextApiResponse } from "next";
import mongoose from "mongoose";
import Waitlist from "@/models/Waitlist";

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) return;
  await mongoose.connect(process.env.MONGODB_URI!);
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: "VALIDATION_ERROR",
        message: "Email is required",
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: "VALIDATION_ERROR",
        message: "Invalid email address",
      });
    }

    await connectDB();

    const existing = await Waitlist.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(200).json({
        success: true,
        data: { message: "Email already registered", alreadyExists: true },
      });
    }

    await Waitlist.create({
      email: email.toLowerCase().trim(),
      completed: false,
      emailSent: false,
    });

    return res.status(201).json({
      success: true,
      data: { message: "Email registered" },
    });
  } catch (error: unknown) {
    console.error("[Waitlist] Register email error:", error);

    if (error instanceof Error && "code" in error && (error as { code: number }).code === 11000) {
      return res.status(200).json({
        success: true,
        data: { message: "Email already registered", alreadyExists: true },
      });
    }

    return res.status(500).json({
      success: false,
      error: "INTERNAL_ERROR",
      message: "Something went wrong. Please try again.",
    });
  }
}
