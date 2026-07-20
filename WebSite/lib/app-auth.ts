import type { GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/auth/[...nextauth]";

/** Returns the signed-in user id for a getServerSideProps context, or null. */
export async function getSessionUserId(
  ctx: GetServerSidePropsContext,
): Promise<string | null> {
  const session = await getServerSession(ctx.req, ctx.res, authOptions);
  return session?.user?.id ?? null;
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
