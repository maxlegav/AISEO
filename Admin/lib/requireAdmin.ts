import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth";

/**
 * Check that the request comes from an authenticated admin.
 * Returns the session if valid, sends 401 and returns null otherwise.
 */
export async function requireAdmin(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user?.email || session.user.email !== process.env.ADMIN_EMAIL) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }

  return session;
}
