import type { NextApiRequest, NextApiResponse } from "next";
import mongoose from "mongoose";
import Waitlist from "@/models/Waitlist";

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) return;
  await mongoose.connect(process.env.MONGODB_URI!);
};

const BASE_COUNT = 51;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  try {
    await connectDB();

    const completedCount = await Waitlist.countDocuments({ completed: true });

    return res.status(200).json({
      success: true,
      data: { count: BASE_COUNT + completedCount },
    });
  } catch (error: unknown) {
    console.error("[Waitlist] Count error:", error);

    return res.status(200).json({
      success: true,
      data: { count: BASE_COUNT },
    });
  }
}
