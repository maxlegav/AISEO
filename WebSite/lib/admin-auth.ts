import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession, type Session } from "next-auth";
import { authOptions } from "@/pages/api/auth/[...nextauth]";

/**
 * Guard for admin-only API routes.
 * Returns the session if the caller is the configured ADMIN_EMAIL,
 * otherwise sends 401 and returns null.
 */
export async function requireAdmin(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<Session | null> {
  const session = await getServerSession(req, res, authOptions);

  const adminEmail = process.env.ADMIN_EMAIL;
  if (!session?.user?.email || !adminEmail || session.user.email !== adminEmail) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }

  return session;
}
