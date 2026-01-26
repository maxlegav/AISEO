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
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  try {
    // Obtenir la session
    const session = await getServerSession(req, res, authOptions);

    if (!session) {
      return res.status(401).json({ error: "Non autorisé" });
    }

    await connectDB();

    // Vérifier que l'utilisateur existe dans la base de données
    const user = await User.findById(session.user.id);

    if (!user) {
      return res.status(404).json({ error: "Utilisateur non trouvé" });
    }

    // Session refresh successful
    return res.status(200).json({
      success: true,
      message: "Session rafraîchie avec succès",
    });
  } catch (error) {
    console.error("Error during session refresh:", error);
    return res
      .status(500)
      .json({ error: "Erreur lors du rafraîchissement de la session" });
  }
}
