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

    // User is authenticated, redirect to dashboard
    return res.redirect("/dashboard");
  } catch (error) {
    console.error("Error during session redirect:", error);
    return res.redirect("/login?error=ServerError");
  }
}
