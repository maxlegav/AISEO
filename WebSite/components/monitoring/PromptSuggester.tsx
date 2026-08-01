import { useState } from "react";
import { Check, Loader2, Pencil, Sparkles } from "lucide-react";
import {
  STYLE_LABEL,
  STYLE_HELP,
  type PromptStyle,
  type PromptSuggestion,
} from "@/lib/monitoring/prompt-suggestions";
import { cn } from "@/lib/utils";

/**
 * Proposes ~100 queries to monitor and lets the user vet them.
 *
 * The point is review, not blind acceptance: suggestions arrive grouped by
 * phrasing (raw queries first — that is how people search), pre-selected on a
 * realistic starter set, and every line is editable in place. Nothing is added
 * to the project until the user confirms.
 */

const ORDER: PromptStyle[] = ["brute", "question", "comparaison", "longue"];

interface Props {
  brandName: string;
  category: string;
  competitors: string[];
  /** Already-kept prompts, so we never propose a duplicate. */
  existing: string[];
  onAdd: (prompts: string[]) => void;
  /** Engines enabled on the project — drives the cost estimate. */
  engineCount: number;
  frequency: "weekly" | "daily";
}

export default function PromptSuggester({
  brandName,
  category,
  competitors,
  existing,
  onAdd,
  engineCount,
  frequency,
}: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [city, setCity] = useState("");
  const [audience, setAudience] = useState("");
  const [suggestions, setSuggestions] = useState<PromptSuggestion[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState<string | null>(null);
  const [enriched, setEnriched] = useState(false);

  const canGenerate = brandName.trim().length > 0 && category.trim().length > 0;

  /** Current text of a suggestion (edited or original). */
  const textOf = (s: PromptSuggestion) => edits[s.text] ?? s.text;

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/projects/suggest-prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandName,
          category,
          competitors: competitors.filter(Boolean),
          city: city.trim() || undefined,
          audience: audience.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Impossible de générer les suggestions.");
      }

      const known = new Set(existing.map((p) => p.toLowerCase()));
      const fresh: PromptSuggestion[] = json.data.suggestions.filter(
        (s: PromptSuggestion) => !known.has(s.text.toLowerCase()),
      );

      setSuggestions(fresh);
      setSelected(
        new Set(
          (json.data.preselected as string[]).filter(
            (t) => !known.has(t.toLowerCase()),
          ),
        ),
      );
      setEnriched(Boolean(json.data.enrichedByLLM));
      setEdits({});
      setOpen(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue.");
    } finally {
      setLoading(false);
    }
  }

  function toggle(key: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function toggleGroup(style: PromptStyle, on: boolean) {
    const keys = suggestions.filter((s) => s.style === style).map((s) => s.text);
    setSelected((prev) => {
      const next = new Set(prev);
      for (const k of keys) {
        if (on) next.add(k);
        else next.delete(k);
      }
      return next;
    });
  }

  function confirm() {
    const picked = suggestions
      .filter((s) => selected.has(s.text))
      .map((s) => textOf(s).trim())
      .filter(Boolean);
    onAdd(picked);
    setOpen(false);
  }

  const groups = ORDER.map((style) => ({
    style,
    items: suggestions.filter((s) => s.style === style),
  })).filter((g) => g.items.length > 0);

  const total = existing.length + selected.size;
  const callsPerRun = total * engineCount;
  const runsPerMonth = frequency === "daily" ? 30 : 4;

  return (
    <div>
      <button
        type="button"
        onClick={generate}
        disabled={!canGenerate || loading}
        className={cn(
          "inline-flex items-center gap-2 rounded-lg border border-violet-200 bg-violet-50 px-4 py-2 text-sm font-medium text-violet-700 transition-colors hover:bg-violet-100",
          (!canGenerate || loading) && "cursor-not-allowed opacity-50",
        )}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Sparkles className="h-4 w-4" />
        )}
        Proposer une centaine de requêtes
      </button>

      {!canGenerate && (
        <p className="mt-2 text-xs text-gray-400">
          Renseignez le nom de la marque et la catégorie pour activer la
          proposition.
        </p>
      )}

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <input
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="Ville (optionnel) — ex. Paris"
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-500"
        />
        <input
          value={audience}
          onChange={(e) => setAudience(e.target.value)}
          placeholder="Cible (optionnel) — ex. PME, freelance"
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-500"
        />
      </div>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      {open && (
        <div className="mt-4 rounded-2xl border border-gray-200 bg-white">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-5 py-3">
            <div>
              <p className="text-sm font-semibold text-gray-900">
                {suggestions.length} requêtes proposées
              </p>
              <p className="text-xs text-gray-500">
                Vérifiez, modifiez, décochez ce qui ne colle pas.
                {enriched && " Enrichies par IA d'après votre activité."}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2 text-sm text-gray-500 hover:text-gray-800"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={confirm}
                disabled={selected.size === 0}
                className={cn(
                  "inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800",
                  selected.size === 0 && "cursor-not-allowed opacity-40",
                )}
              >
                <Check className="h-4 w-4" />
                Ajouter {selected.size} requête{selected.size > 1 ? "s" : ""}
              </button>
            </div>
          </div>

          {/* Volume matters: each prompt is queried on every engine, every run. */}
          <div className="border-b border-gray-100 bg-gray-50 px-5 py-2 text-xs text-gray-500">
            {total} requête{total > 1 ? "s" : ""} × {engineCount} moteur
            {engineCount > 1 ? "s" : ""} ={" "}
            <span className="font-medium text-gray-700">{callsPerRun} appels</span> par
            analyse, soit ~{callsPerRun * runsPerMonth} par mois en{" "}
            {frequency === "daily" ? "quotidien" : "hebdomadaire"}.
          </div>

          <div className="max-h-[26rem] overflow-y-auto px-5 py-4">
            {groups.map(({ style, items }) => {
              const allOn = items.every((i) => selected.has(i.text));
              return (
                <div key={style} className="mb-5 last:mb-0">
                  <div className="mb-2 flex items-center justify-between">
                    <div>
                      <span className="text-sm font-semibold text-gray-900">
                        {STYLE_LABEL[style]}
                      </span>
                      <span className="ml-2 text-xs text-gray-400">
                        {STYLE_HELP[style]}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleGroup(style, !allOn)}
                      className="text-xs font-medium text-violet-600 hover:text-violet-700"
                    >
                      {allOn ? "Tout décocher" : "Tout cocher"}
                    </button>
                  </div>

                  <div className="grid gap-1.5 sm:grid-cols-2">
                    {items.map((s) => {
                      const on = selected.has(s.text);
                      const isEditing = editing === s.text;
                      return (
                        <div
                          key={s.text}
                          className={cn(
                            "flex items-center gap-2 rounded-lg border px-3 py-2",
                            on
                              ? "border-violet-200 bg-violet-50/60"
                              : "border-gray-100 bg-white",
                          )}
                        >
                          <input
                            type="checkbox"
                            checked={on}
                            onChange={() => toggle(s.text)}
                            className="h-4 w-4 shrink-0 rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                          />
                          {isEditing ? (
                            <input
                              autoFocus
                              value={textOf(s)}
                              onChange={(e) =>
                                setEdits((p) => ({ ...p, [s.text]: e.target.value }))
                              }
                              onBlur={() => setEditing(null)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === "Escape") {
                                  setEditing(null);
                                }
                              }}
                              className="min-w-0 flex-1 rounded border border-violet-300 px-2 py-1 text-sm outline-none"
                            />
                          ) : (
                            <button
                              type="button"
                              onClick={() => setEditing(s.text)}
                              className="group flex min-w-0 flex-1 items-center gap-1.5 text-left"
                            >
                              <span className="truncate text-sm text-gray-700">
                                {textOf(s)}
                              </span>
                              <Pencil className="h-3 w-3 shrink-0 text-gray-300 group-hover:text-gray-500" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
