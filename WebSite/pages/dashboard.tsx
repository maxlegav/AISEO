import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
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
      if (session?.user?.username) {
        router.replace(`/${session.user.username}`);
      } else if (!generatingUsername) {
        // Auto-generate username for users who don't have one
        setGeneratingUsername(true);
        fetch("/api/user/auto-generate-username", { method: "POST" })
          .then((res) => res.json())
          .then(async (data) => {
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
      <div className="text-center">
        <div className="w-12 h-12 mx-auto mb-4 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-600">Loading your dashboard...</p>
      </div>
    </div>
  );
}
