import Head from "next/head";
import type { GetServerSideProps } from "next";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Loader2, Check, AlertTriangle } from "lucide-react";
import { getSessionUserId, loginRedirect } from "@/lib/app-auth";

interface JoinPageProps {
  token: string;
}

export default function JoinPage({ token }: JoinPageProps) {
  const router = useRouter();
  const [state, setState] = useState<"loading" | "ok" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/team/accept", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const json = await res.json();
        if (cancelled) return;
        if (!res.ok || !json.success) throw new Error(json.message || "Invitation invalide.");
        setState("ok");
        setTimeout(() => router.replace("/app"), 1200);
      } catch (e) {
        if (cancelled) return;
        setState("error");
        setMessage(e instanceof Error ? e.message : "Erreur inattendue.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, router]);

  return (
    <>
      <Head>
        <title>Rejoindre l&apos;équipe · ShowYourBrand</title>
        <meta name="robots" content="noindex" />
      </Head>
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-violet-50 via-purple-50/60 to-fuchsia-50/40 p-6">
        <div className="w-full max-w-sm rounded-2xl border border-white/60 bg-white/80 p-8 text-center shadow-premium backdrop-blur-sm">
          {state === "loading" && (
            <>
              <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-violet-600" />
              <p className="text-sm text-gray-600">Validation de votre invitation…</p>
            </>
          )}
          {state === "ok" && (
            <>
              <Check className="mx-auto mb-3 h-8 w-8 text-emerald-600" />
              <p className="text-sm font-medium text-gray-800">
                Invitation acceptée ! Redirection…
              </p>
            </>
          )}
          {state === "error" && (
            <>
              <AlertTriangle className="mx-auto mb-3 h-8 w-8 text-amber-500" />
              <p className="text-sm text-gray-700">{message}</p>
            </>
          )}
        </div>
      </div>
    </>
  );
}

export const getServerSideProps: GetServerSideProps<JoinPageProps> = async (ctx) => {
  const token = (ctx.query.token as string) || "";
  const dest = `/app/join?token=${encodeURIComponent(token)}`;
  const userId = await getSessionUserId(ctx);
  if (!userId) return loginRedirect(dest);
  if (!token) return { redirect: { destination: "/app", permanent: false } };
  return { props: { token } };
};
