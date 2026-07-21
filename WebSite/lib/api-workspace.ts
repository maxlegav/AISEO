import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { ApiError, ErrorType } from "@/lib/error-handler";
import { resolveWorkspace, type Workspace } from "@/lib/monitoring/workspace";

export { requireManager, isManager } from "@/lib/workspace-roles";

export interface ApiWorkspace {
  userId: string;
  workspace: Workspace;
}

/**
 * Resolve the authenticated user + their acting organization for an API route.
 * Throws AUTHENTICATION when not signed in.
 */
export async function requireWorkspace(
  req: NextApiRequest,
  res: NextApiResponse,
): Promise<ApiWorkspace> {
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) {
    throw new ApiError(ErrorType.AUTHENTICATION, "You must be logged in");
  }
  const workspace = await resolveWorkspace(session.user.id);
  return { userId: session.user.id, workspace };
}
