import { useState } from "react";
import { useRouter } from "next/router";
import { RefreshCw, Loader2 } from "lucide-react";

/**
 * Header action that triggers a fresh monitoring run for a project
 * (POST /api/projects/[id]/run) and refreshes the page data on success.
 */
export default function RunButton({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runNow() {
    if (running) return;
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
      await router.replace(router.asPath, undefined, { scroll: false });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inattendue.");
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="flex flex-col items-end">
      <button
        onClick={runNow}
        disabled={running}
        title="Interroger à nouveau les moteurs IA"
        className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/60 px-3.5 py-2 text-sm font-medium text-gray-600 transition-colors hover:text-gray-900 disabled:opacity-60"
      >
        {running ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Run en cours…
          </>
        ) : (
          <>
            <RefreshCw className="h-4 w-4" />
            Relancer un run
          </>
        )}
      </button>
      {error && (
        <span className="mt-1 max-w-[220px] text-right text-[11px] text-red-600">
          {error}
        </span>
      )}
    </div>
  );
}
