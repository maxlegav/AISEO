import type { NextApiRequest, NextApiResponse } from "next";
import mongoose from "mongoose";
import User from "@/models/User";
import { findUserByEmail, normalizeEmail } from "@/lib/auth-email";
import { sendWelcomeEmail } from "@/lib/email";

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
  // Only allow POST method
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  try {
    await connectDB();
    const { name, company, email, password, onboardingDomain, onboardingActivity, onboardingSeoExperience, onboardingReferral } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ error: "Tous les champs requis ne sont pas renseignés" });
    }

    if (password.length < 8) {
      return res
        .status(400)
        .json({ error: "Le mot de passe doit contenir au moins 8 caractères" });
    }

    // Emails are stored canonically (lower-cased) so sign-in and password reset
    // can find the account whatever casing the user types later.
    const normalizedEmail = normalizeEmail(email);

    // Check if user already exists (also catches legacy mixed-case accounts)
    const existingUser = await findUserByEmail(normalizedEmail);
    if (existingUser) {
      return res.status(409).json({ error: "Cet email est déjà utilisé" });
    }

    // Create new user
    const newUser = new User({
      name,
      company: company || "",
      email: normalizedEmail,
      password,
      subscriptionStatus: "inactive",
      subscriptionTier: "none",
      auditCredits: 0,
      language: "en",
      ...(onboardingDomain && { onboardingDomain }),
      ...(onboardingActivity && { onboardingActivity }),
      ...(onboardingSeoExperience && { onboardingSeoExperience }),
      ...(onboardingReferral && { onboardingReferral }),
    });

    await newUser.save();

    // Send welcome email (non-blocking)
    sendWelcomeEmail(newUser.email, newUser.name, newUser.language || "en")
      .then((result) => {
        if (!result.success) {
          console.error("[Signup] Failed to send welcome email:", result.error);
        }
      })
      .catch((error) => {
        console.error("[Signup] Welcome email error:", error);
      });

    // Return success response without sensitive data
    return res.status(201).json({
      success: true,
      message: "Account created successfully",
      data: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
      },
    });
  } catch (error) {
    console.error("Erreur lors de l'inscription:", error);
    return res
      .status(500)
      .json({ error: "Erreur lors de la création du compte" });
  }
}
