import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/router";

export default function DashboardPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [generatingUsername, setGeneratingUsername] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login?callbackUrl=/dashboard");
      return;
    }

    if (status === "authenticated") {
      // Subscription gate: users without an active plan or remaining credits
      // are not allowed into the dashboard. Send them to plan selection.
      const hasActiveSubscription =
        session?.user?.subscriptionStatus === "active" ||
        (session?.user?.auditCredits ?? 0) > 0;

      if (!hasActiveSubscription) {
        router.replace("/signup?step=4");
        return;
      }

      if (session?.user?.username) {
        router.replace(`/${session.user.username}`);
      } else if (!generatingUsername) {
        // Auto-generate username for users who don't have one
        setGeneratingUsername(true);
        fetch("/api/user/auto-generate-username", { method: "POST" })
          .then(async (res) => {
            if (res.status === 401) {
              // Session expired or invalid — force sign out and redirect to login
              await signOut({ redirect: false });
              router.replace("/login?callbackUrl=/dashboard");
              return;
            }
            const data = await res.json();
            if (data.success) {
              await update();
              router.replace(`/${data.data.username}`);
            }
          })
          .catch(() => {
            // Fallback: refresh session and retry
            update();
          });
      }
    }
  }, [status, session, router, generatingUsername, update]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-200 via-pink-100 via-40% to-orange-100">
      <div className="text-center">
        <div className="w-12 h-12 mx-auto mb-4 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-600">Loading your dashboard...</p>
      </div>
    </div>
  );
}
