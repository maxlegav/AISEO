import type { NextApiRequest, NextApiResponse } from "next";
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
  // Only allow POST method
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  try {
    await connectDB();
    const { name, company, email, password } = req.body;

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

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ error: "Cet email est déjà utilisé" });
    }

    // Create new user
    const newUser = new User({
      name,
      company: company || "",
      email,
      password,
      subStatus: "inactive",
      subPlan: null,
    });

    await newUser.save();

    // Return success response without sensitive data
    return res.status(201).json({
      message: "Utilisateur créé avec succès",
      user: {
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
