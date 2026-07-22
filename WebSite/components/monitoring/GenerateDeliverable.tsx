import { useState } from "react";
import { Loader2, AlertTriangle, Info } from "lucide-react";
import SybMark from "@/components/icons/SybMark";
import CopyBlock from "@/components/monitoring/CopyBlock";
import type { DeliverableKind } from "@/lib/generation/deliverables";

interface DeliverableData {
  kind: DeliverableKind;
  title: string;
  content: string;
  format: "markdown" | "json" | "text";
  mock: boolean;
  provider?: string;
  note: string;
}

/**
 * "Generate" button for a GEO deliverable. Calls
 * POST /api/projects/[id]/generate and renders the result inline (copyable),
 * with an explicit badge when the content is a local template (no LLM key).
 */
export default function GenerateDeliverable({
  projectId,
  kind,
  label,
  prompt,
  compact = false,
}: {
  projectId: string;
  kind: DeliverableKind;
  label: string;
  prompt?: string;
  compact?: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DeliverableData | null>(null);

  async function run() {
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, prompt }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "La génération a échoué. Réessayez.");
      }
      setResult(json.data as DeliverableData);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inattendue.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={compact ? "" : "mt-3"}>
      <button
        onClick={run}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-600 px-3.5 py-2 text-sm font-medium text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Génération…
          </>
        ) : (
          <>
            <SybMark className="h-4 w-4" />
            {result ? "Régénérer" : label}
          </>
        )}
      </button>

      {error && (
        <p className="mt-2 flex items-center gap-1.5 text-[12px] text-red-600">
          <AlertTriangle className="h-3.5 w-3.5" /> {error}
        </p>
      )}

      {result && (
        <div className="mt-3">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-gray-900">
              {result.title}
            </span>
            {result.mock ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                <Info className="h-3 w-3" /> Modèle local (sans clé LLM)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                <SybMark className="h-3 w-3" /> Rédigé par IA
                {result.provider ? ` (${result.provider})` : ""}
              </span>
            )}
          </div>
          <p className="mb-2 text-[12px] leading-relaxed text-gray-500">
            {result.note}
          </p>
          <CopyBlock code={result.content} label={result.title} />
        </div>
      )}
    </div>
  );
}
