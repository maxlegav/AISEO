import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import mongoose from "mongoose";
import Feedback from "@/models/Feedback";
import { handleApiError, ApiError, ErrorType } from "@/lib/error-handler";
import { z } from "zod";

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) return;
  await mongoose.connect(process.env.MONGODB_URI!);
};

// Strict Zod validation with trimming and length limits
const CreateFeedbackSchema = z.object({
  type: z.enum(["bug", "feature", "improvement", "other"]),
  title: z
    .string()
    .trim()
    .min(3, "Title must be at least 3 characters")
    .max(200, "Title must be at most 200 characters"),
  description: z
    .string()
    .trim()
    .min(10, "Description must be at least 10 characters")
    .max(2000, "Description must be at most 2000 characters"),
});

// Simple in-memory rate limiter: max 5 feedbacks per user per 10 minutes
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return false;
  }

  entry.count++;
  return true;
}

// Strip HTML tags and MongoDB operators from strings
function sanitize(input: string): string {
  return input
    .replace(/<[^>]*>/g, "") // strip HTML tags
    .replace(/\$/g, "");     // strip $ to prevent MongoDB operator injection
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "METHOD_NOT_ALLOWED",
      message: "Only POST method is allowed",
    });
  }

  try {
    // 1. Authentication
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.id) {
      throw new ApiError(ErrorType.AUTHENTICATION, "You must be logged in");
    }

    // 2. Rate limiting
    if (!checkRateLimit(session.user.id)) {
      throw new ApiError(
        ErrorType.RATE_LIMIT,
        "Too many feedback submissions. Please try again later."
      );
    }

    // 3. Validate & parse input
    const result = CreateFeedbackSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: "VALIDATION_ERROR",
        message: result.error.errors.map((e) => e.message).join(", "),
      });
    }

    // 4. Sanitize text fields
    const sanitizedData = {
      type: result.data.type,
      title: sanitize(result.data.title),
      description: sanitize(result.data.description),
    };

    // 5. Persist
    await connectDB();

    const feedback = await Feedback.create({
      userId: session.user.id,
      ...sanitizedData,
    });

    return res.status(201).json({
      success: true,
      data: { _id: feedback._id },
    });
  } catch (error) {
    return handleApiError(error, res);
  }
}
