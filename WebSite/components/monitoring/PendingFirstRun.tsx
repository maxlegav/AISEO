import { useState } from "react";
import { useRouter } from "next/router";
import { Play, Loader2, AlertCircle } from "lucide-react";

/**
 * Empty state for a real project that has never run. Lets the user trigger the
 * first monitoring run manually (POST /api/projects/[id]/run) then refreshes.
 */
export default function PendingFirstRun({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runNow() {
    setRunning(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/run`, {
        method: "POST",
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Le run a échoué. Réessayez.");
      }
      router.replace(router.asPath);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inattendue.");
      setRunning(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl rounded-2xl border border-white/60 bg-white/80 p-10 text-center shadow-premium backdrop-blur-sm">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white">
        <Play className="h-6 w-6" />
      </div>
      <h2 className="font-heading text-xl font-semibold text-gray-900">
        Prêt pour votre premier run
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
        Lancez une première interrogation des moteurs IA sur vos requêtes. Vous
        verrez votre score de visibilité et le détail par moteur en quelques
        instants.
      </p>

      {error && (
        <div className="mx-auto mt-5 flex max-w-md items-start gap-2 rounded-xl border border-red-100 bg-red-50 p-3 text-left text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <button
        onClick={runNow}
        disabled={running}
        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-gray-800 disabled:opacity-60"
      >
        {running ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Run en cours…
          </>
        ) : (
          <>
            <Play className="h-4 w-4" />
            Lancer le premier run
          </>
        )}
      </button>
    </div>
  );
}
