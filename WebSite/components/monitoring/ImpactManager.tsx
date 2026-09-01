import { useState } from "react";
import { useRouter } from "next/router";
import {
  Plus,
  Loader2,
  Trash2,
  TrendingUp,
  TrendingDown,
  Minus,
  ExternalLink,
  Activity,
} from "lucide-react";
import { LLMBadge } from "@/components/monitoring/widgets";
import type { GeoActionKind } from "@/models/GeoAction";
import type { ActionView } from "@/lib/monitoring/impact-page";

const KIND_OPTIONS: { value: GeoActionKind; label: string }[] = [
  { value: "answer_page", label: "Page de réponse publiée" },
  { value: "forum_reply", label: "Réponse Reddit / Quora publiée" },
  { value: "llms_txt", label: "llms.txt publié" },
  { value: "faq_jsonld", label: "FAQ / JSON-LD ajouté" },
  { value: "org_jsonld", label: "Balisage Organization ajouté" },
  { value: "source_outreach", label: "Mention obtenue sur une source" },
  { value: "custom", label: "Autre action" },
];

function kindLabel(kind: GeoActionKind): string {
  return KIND_OPTIONS.find((k) => k.value === kind)?.label ?? "Action";
}

function DeltaPill({ delta }: { delta: number }) {
  if (delta === 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-500">
        <Minus className="h-3 w-3" /> 0 pt
      </span>
    );
  }
  const up = delta > 0;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
        up ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"
      }`}
    >
      {up ? (
        <TrendingUp className="h-3 w-3" />
      ) : (
        <TrendingDown className="h-3 w-3" />
      )}
      {up ? "+" : ""}
      {delta} pts
    </span>
  );
}

function ActionCard({
  action,
  projectId,
  onChanged,
}: {
  action: ActionView;
  projectId: string;
  onChanged: () => void;
}) {
  const [busy, setBusy] = useState<null | "measure" | "delete">(null);
  const [error, setError] = useState<string | null>(null);

  async function measure() {
    setBusy("measure");
    setError(null);
    try {
      const res = await fetch(
        `/api/projects/${projectId}/actions/${action.id}`,
        { method: "POST" },
      );
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "La mesure a échoué.");
      }
      onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inattendue.");
    } finally {
      setBusy(null);
    }
  }

  async function remove() {
    setBusy("delete");
    setError(null);
    try {
      const res = await fetch(
        `/api/projects/${projectId}/actions/${action.id}`,
        { method: "DELETE" },
      );
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "La suppression a échoué.");
      }
      onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inattendue.");
    } finally {
      setBusy(null);
    }
  }

  const impact = action.impact;

  return (
    <div className="rounded-2xl border border-white/60 bg-white/80 p-5 shadow-premium backdrop-blur-sm">
      <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-accent-muted px-2.5 py-0.5 text-[11px] font-semibold text-accent">
              {kindLabel(action.kind)}
            </span>
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                action.status === "measured"
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-amber-50 text-amber-700"
              }`}
            >
              {action.status === "measured" ? "Mesurée" : "Publiée"}
            </span>
          </div>
          <h3 className="text-[15px] font-semibold text-gray-900">
            {action.title}
          </h3>
          {action.prompt && (
            <p className="mt-0.5 text-xs text-gray-500">
              Requête ciblée : « {action.prompt} »
            </p>
          )}
          {action.publishedUrl && (
            <a
              href={action.publishedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-0.5 inline-flex items-center gap-1 text-xs text-accent hover:underline"
            >
              {action.publishedUrl} <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
        <button
          onClick={remove}
          disabled={busy !== null}
          title="Supprimer"
          className="rounded-lg border border-white/60 bg-white/60 p-1.5 text-gray-400 transition-colors hover:text-red-600 disabled:opacity-50"
        >
          {busy === "delete" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
        </button>
      </div>

      <p className="mb-3 text-xs text-gray-500">
        Score de référence (au moment du suivi) : {action.baseline.globalScore}
        /100, semaine {action.baseline.week || "n/a"}.
      </p>

      {impact ? (
        <div className="rounded-xl border border-gray-100 bg-white/70 p-4">
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <span className="text-sm font-semibold text-gray-900">
              Score global : {impact.global.before} → {impact.global.after}
            </span>
            <DeltaPill delta={impact.global.delta} />
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {impact.engines.map((e) => (
              <div
                key={e.llm}
                className="flex items-center justify-between gap-2 rounded-lg bg-gray-50 px-3 py-2"
              >
                <span className="flex items-center gap-1.5 text-sm text-gray-700">
                  <LLMBadge llm={e.llm} size={15} />
                  <span className="text-gray-500">
                    {e.before}% → {e.after}%
                  </span>
                </span>
                <DeltaPill delta={e.delta} />
              </div>
            ))}
          </div>
          {impact.prompt && impact.prompt.total != null && (
            <p className="mt-3 text-xs text-gray-600">
              Sur la requête ciblée : {impact.prompt.before ?? "?"} →{" "}
              {impact.prompt.after ?? "?"} moteur(s) sur {impact.prompt.total}{" "}
              vous citent maintenant.
            </p>
          )}
          {impact.noChange && (
            <p className="mt-3 text-xs text-amber-700">
              Aucun changement mesuré pour l&apos;instant. Laissez le temps aux
              moteurs de réindexer, puis relancez un run et mesurez à nouveau.
            </p>
          )}
          <p className="mt-3 text-[11px] leading-relaxed text-gray-400">
            Corrélation mesurée entre deux runs, pas une preuve de causalité :
            d&apos;autres facteurs ont pu évoluer entre-temps.
          </p>
        </div>
      ) : (
        <p className="text-xs text-gray-500">
          Pas encore mesurée. Relancez un run (bouton en haut) une fois votre
          action publiée et indexée, puis cliquez sur « Mesurer l&apos;impact ».
        </p>
      )}

      <div className="mt-3 flex items-center gap-2">
        <button
          onClick={measure}
          disabled={busy !== null}
          className="inline-flex items-center gap-2 rounded-full border border-ink-200 bg-accent-muted px-3.5 py-2 text-sm font-medium text-accent transition-colors hover:bg-accent-muted disabled:opacity-60"
        >
          {busy === "measure" ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Mesure…
            </>
          ) : (
            <>
              <Activity className="h-4 w-4" />
              {action.status === "measured"
                ? "Re-mesurer l'impact"
                : "Mesurer l'impact"}
            </>
          )}
        </button>
      </div>

      {error && <p className="mt-2 text-[12px] text-red-600">{error}</p>}
    </div>
  );
}

export default function ImpactManager({
  projectId,
  prompts,
  actions,
}: {
  projectId: string;
  prompts: string[];
  actions: ActionView[];
}) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [kind, setKind] = useState<GeoActionKind>("answer_page");
  const [title, setTitle] = useState("");
  const [prompt, setPrompt] = useState("");
  const [publishedUrl, setPublishedUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function refresh() {
    router.replace(router.asPath, undefined, { scroll: false });
  }

  async function create() {
    if (!title.trim()) {
      setError("Donnez un titre à l'action.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const body: Record<string, string> = { kind, title: title.trim() };
      if (prompt) body.prompt = prompt;
      if (publishedUrl.trim()) body.publishedUrl = publishedUrl.trim();
      const res = await fetch(`/api/projects/${projectId}/actions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "La création a échoué.");
      }
      setShowForm(false);
      setTitle("");
      setPrompt("");
      setPublishedUrl("");
      setKind("answer_page");
      refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inattendue.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-ink-200 bg-accent-muted p-5">
        <p className="text-sm font-semibold text-gray-900">
          Mesurez l&apos;effet réel de vos actions GEO.
        </p>
        <p className="mt-0.5 text-sm text-gray-600">
          Enregistrez une action publiée : on fige votre score actuel comme
          référence. Après un prochain run, mesurez le gain par moteur et sur la
          requête ciblée.
        </p>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="mt-3 inline-flex items-center gap-2 rounded-full bg-ink-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition-opacity hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> Suivre une nouvelle action
        </button>
      </div>

      {showForm && (
        <div className="rounded-2xl border border-white/60 bg-white/80 p-5 shadow-premium backdrop-blur-sm">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm">
              <span className="mb-1 block font-medium text-gray-700">
                Type d&apos;action
              </span>
              <select
                value={kind}
                onChange={(e) => setKind(e.target.value as GeoActionKind)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              >
                {KIND_OPTIONS.map((k) => (
                  <option key={k.value} value={k.value}>
                    {k.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-medium text-gray-700">
                Requête ciblée (optionnel)
              </span>
              <select
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              >
                <option value="">Aucune requête précise</option>
                {prompts.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="mt-3 block text-sm">
            <span className="mb-1 block font-medium text-gray-700">Titre</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex. Page publiée : meilleurs outils de prospection"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
          </label>
          <label className="mt-3 block text-sm">
            <span className="mb-1 block font-medium text-gray-700">
              URL publiée (optionnel)
            </span>
            <input
              value={publishedUrl}
              onChange={(e) => setPublishedUrl(e.target.value)}
              placeholder="https://votre-site.fr/nouvelle-page"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
          </label>
          {error && <p className="mt-2 text-[12px] text-red-600">{error}</p>}
          <div className="mt-4 flex items-center gap-2">
            <button
              onClick={create}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-full bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Enregistrement…
                </>
              ) : (
                "Figer la référence et suivre"
              )}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="rounded-full px-4 py-2 text-sm text-gray-500 hover:text-gray-700"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {actions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white/50 p-8 text-center">
          <p className="text-sm font-medium text-gray-700">
            Aucune action suivie pour l&apos;instant.
          </p>
          <p className="mt-1 text-sm text-gray-500">
            Publiez un livrable (page de réponse, FAQ, mention...) puis suivez-le
            ici pour mesurer son impact sur votre visibilité.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {actions.map((a) => (
            <ActionCard
              key={a.id}
              action={a}
              projectId={projectId}
              onChanged={refresh}
            />
          ))}
        </div>
      )}
    </div>
  );
}
