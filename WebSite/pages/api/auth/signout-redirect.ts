import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./[...nextauth]";

type ResponseData = {
  success: boolean;
  message?: string;
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Méthode non autorisée",
    });
  }

  try {
    // Get session
    const session = await getServerSession(req, res, authOptions);

    if (!session) {
      return res.status(200).json({
        success: true,
        message: "Aucune session à déconnecter",
      });
    }

    // Rediriger vers la page d'accueil avec signOut=1
    // Next Auth va intercepter ce paramètre pour déconnecter l'utilisateur
    return res.status(200).json({
      success: true,
      message: "Redirection pour déconnexion en cours",
    });
  } catch (error) {
    console.error("Error during signout:", error);
    return res.status(500).json({
      success: false,
      error: "Erreur lors de la déconnexion",
    });
  }
}
