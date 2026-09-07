import { useRouter } from "next/router";

/**
 * Root path of the monitoring UI for the current route.
 *
 * The same page components serve two audiences: signed-in users under `/app`,
 * and anonymous visitors under `/demo` (the public, read-only demo dashboard
 * linked from the landing page). Everything inside those pages links relative
 * to this base so a visitor browsing the demo never gets bounced to the login
 * screen by an `/app/...` href.
 */
export type AppBase = "/app" | "/demo";

export function useAppBase(): AppBase {
  const { pathname } = useRouter();
  return pathname.startsWith("/demo") ? "/demo" : "/app";
}

/** True when the current route is the public, unauthenticated demo. */
export function useIsPublicDemo(): boolean {
  return useAppBase() === "/demo";
}
