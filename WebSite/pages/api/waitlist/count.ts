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
  if (req.method !== "GET") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  try {
    await connectDB();

    const count = await Waitlist.countDocuments({ completed: true });

    return res.status(200).json({
      success: true,
      data: { count },
    });
  } catch (error: unknown) {
    console.error("[Waitlist] Count error:", error);

    return res.status(200).json({
      success: true,
      data: { count: 0 },
    });
  }
}
