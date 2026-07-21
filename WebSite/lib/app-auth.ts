import type { GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { resolveWorkspace, type Workspace } from "@/lib/monitoring/workspace";

/** Returns the signed-in user id for a getServerSideProps context, or null. */
export async function getSessionUserId(
  ctx: GetServerSidePropsContext,
): Promise<string | null> {
  const session = await getServerSession(ctx.req, ctx.res, authOptions);
  return session?.user?.id ?? null;
}

/**
 * Returns the signed-in user id and the organization workspace they are acting
 * in (SYB v2 multi-tenant), or null when unauthenticated. Use this in the
 * `/app` pages so every query is scoped to the resolved organization.
 */
export async function getSessionWorkspace(
  ctx: GetServerSidePropsContext,
): Promise<{ userId: string; workspace: Workspace } | null> {
  const session = await getServerSession(ctx.req, ctx.res, authOptions);
  const userId = session?.user?.id;
  if (!userId) return null;
  const workspace = await resolveWorkspace(userId);
  return { userId, workspace };
}

/** Standard redirect to login, preserving the intended destination. */
export function loginRedirect(destination: string) {
  return {
    redirect: {
      destination: `/login?callbackUrl=${encodeURIComponent(destination)}`,
      permanent: false,
    },
  };
}
