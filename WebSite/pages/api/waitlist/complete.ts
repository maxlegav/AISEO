import type { NextApiRequest, NextApiResponse } from "next";
import mongoose from "mongoose";
import Waitlist from "@/models/Waitlist";
import { sendEmail } from "@/lib/email";
import { render } from "@react-email/render";
import WaitlistWelcomeEmail from "@/emails/WaitlistWelcomeEmail";

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) return;
  await mongoose.connect(process.env.MONGODB_URI!);
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ success: false, error: "Method not allowed" });
  }

  try {
    const { email, howFound, hasGeoExperience, budgetRange, sendWelcomeEmail } =
      req.body;

    if (!email || !howFound || !hasGeoExperience || !budgetRange) {
      return res.status(400).json({
        success: false,
        error: "VALIDATION_ERROR",
        message: "All fields are required",
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

    const entry = await Waitlist.findOneAndUpdate(
      { email: email.toLowerCase() },
      {
        email: email.toLowerCase().trim(),
        howFound,
        hasGeoExperience,
        budgetRange,
        completed: true,
      },
      { upsert: true, new: true },
    );

    if (sendWelcomeEmail && !entry.emailSent) {
      const html = await render(WaitlistWelcomeEmail({ email }));
      sendEmail({
        to: email,
        subject: "You're on the ShowYourBrand waitlist!",
        html,
      })
        .then(async () => {
          await Waitlist.updateOne({ _id: entry._id }, { emailSent: true });
        })
        .catch((err) => console.error("[Waitlist] Email send error:", err));
    }

    return res.status(200).json({
      success: true,
      data: { message: "Successfully joined the waitlist" },
    });
  } catch (error: unknown) {
    console.error("[Waitlist] Complete error:", error);

    return res.status(500).json({
      success: false,
      error: "INTERNAL_ERROR",
      message: "Something went wrong. Please try again.",
    });
  }
}
