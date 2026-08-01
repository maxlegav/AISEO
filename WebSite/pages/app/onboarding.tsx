import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import type { GetServerSideProps } from "next";
import { useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  Plus,
  Rocket,
  X,
} from "lucide-react";
import SybMark from "@/components/icons/SybMark";
import PromptSuggester from "@/components/monitoring/PromptSuggester";
import { LLM_ORDER, LLMS, type LLMId } from "@/lib/mock/monitoring";
import { getSessionWorkspace, loginRedirect } from "@/lib/app-auth";
import { getWorkspacePlan } from "@/lib/monitoring/workspace";
import { getMaxLLMs, isFrequencyAllowed } from "@/lib/monitoring/limits";
import Project from "@/models/Project";
import User from "@/models/User";
import { cn } from "@/lib/utils";

/**
 * First-run onboarding.
 *
 * A brand-new account lands on `/app` with nothing but the demo projects, which
 * is where people leave. This walks them from "I just signed up" to "my first
 * measurement exists" in six steps.
 *
 * The last step matters as much as the rest: a day-one score is a baseline, not
 * a verdict. Saying so plainly — and showing what will actually happen over the
 * following weeks — is what stops someone from cancelling after looking at a
 * single number they have no way to interpret.
 */

type Frequency = "weekly" | "daily";

interface Props {
  /** Prefilled from the signup questionnaire. */
  initialWebsite: string;
  maxLLMs: number;
  dailyAllowed: boolean;
  tier: string;
}

const STEPS = [
  "Votre marque",
  "Votre marché",
  "Vos concurrents",
  "Vos requêtes",
  "Les moteurs",
  "Première analyse",
];

/** Best-effort brand name from a domain: "www.bioburger.fr" → "Bioburger". */
function brandFromUrl(url: string): string {
  try {
    const host = new URL(url.startsWith("http") ? url : `https://${url}`).hostname;
    const core = host.replace(/^www\./, "").split(".")[0] ?? "";
    return core ? core.charAt(0).toUpperCase() + core.slice(1) : "";
  } catch {
    return "";
  }
}

export default function Onboarding({
  initialWebsite,
  maxLLMs,
  dailyAllowed,
  tier,
}: Props) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const [websiteUrl, setWebsiteUrl] = useState(initialWebsite);
  const [brandName, setBrandName] = useState(brandFromUrl(initialWebsite));
  const [category, setCategory] = useState("");
  const [city, setCity] = useState("");
  const [audience, setAudience] = useState("");
  const [competitors, setCompetitors] = useState<string[]>(["", ""]);
  const [prompts, setPrompts] = useState<string[]>([]);
  const [frequency, setFrequency] = useState<Frequency>(dailyAllowed ? "daily" : "weekly");
  const [engines, setEngines] = useState<Record<LLMId, boolean>>(() => {
    const state = {} as Record<LLMId, boolean>;
    LLM_ORDER.forEach((id, i) => (state[id] = i < maxLLMs));
    return state;
  });

  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<{
    projectId: string;
    globalScore: number;
    resultsStored: number;
  } | null>(null);

  const cleanCompetitors = useMemo(
    () => competitors.map((c) => c.trim()).filter(Boolean),
    [competitors],
  );
  const cleanPrompts = useMemo(
    () => prompts.map((p) => p.trim()).filter(Boolean),
    [prompts],
  );
  const selectedLLMs = useMemo(
    () => LLM_ORDER.filter((id) => engines[id]),
    [engines],
  );

  const canContinue = [
    brandName.trim().length > 0 && websiteUrl.trim().length > 0,
    category.trim().length > 0,
    true, // competitors are recommended, not required
    cleanPrompts.length >= 5,
    selectedLLMs.length > 0 && selectedLLMs.length <= maxLLMs,
    true,
  ][step];

  function toggleEngine(id: LLMId) {
    setEngines((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      const count = LLM_ORDER.filter((e) => next[e]).length;
      if (count > maxLLMs) return prev;
      return next;
    });
  }

  async function launch() {
    setRunning(true);
    setError(null);
    try {
      const created = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandName: brandName.trim(),
          websiteUrl: websiteUrl.trim(),
          category: [category.trim(), city.trim()].filter(Boolean).join(" "),
          competitors: cleanCompetitors,
          prompts: cleanPrompts,
          llms: selectedLLMs,
          frequency,
        }),
      });
      const createdJson = await created.json();
      if (!created.ok || !createdJson.success) {
        throw new Error(createdJson.message || "Création du projet impossible.");
      }

      const projectId = createdJson.data._id as string;
      const ran = await fetch(`/api/projects/${projectId}/run`, { method: "POST" });
      const ranJson = await ran.json();
      if (!ran.ok || !ranJson.success) {
        throw new Error(ranJson.message || "L'analyse n'a pas pu être lancée.");
      }

      setResult({
        projectId,
        globalScore: ranJson.data.globalScore,
        resultsStored: ranJson.data.resultsStored,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue.");
    } finally {
      setRunning(false);
    }
  }

  return (
    <>
      <Head>
        <title>Configurons votre suivi · ShowYourBrand</title>
        <meta name="robots" content="noindex" />
      </Head>

      <div className="min-h-screen bg-gradient-to-b from-violet-50/40 to-white">
        <header className="border-b border-gray-100 bg-white/70 backdrop-blur-sm">
          <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
            <div className="flex items-center gap-2">
              <SybMark className="h-5 w-5 text-violet-600" />
              <span className="font-heading text-sm font-semibold text-gray-900">
                ShowYourBrand
              </span>
            </div>
            <Link
              href="/app?demo=1"
              className="text-sm text-gray-400 transition-colors hover:text-gray-700"
            >
              Passer et voir un exemple
            </Link>
          </div>
        </header>

        <main className="mx-auto max-w-3xl px-6 py-10">
          {/* progress */}
          <ol className="mb-8 flex flex-wrap items-center gap-x-2 gap-y-2">
            {STEPS.map((label, i) => (
              <li key={label} className="flex items-center gap-2">
                <span
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold",
                    i < step
                      ? "bg-violet-600 text-white"
                      : i === step
                        ? "bg-violet-100 text-violet-700 ring-2 ring-violet-300"
                        : "bg-gray-100 text-gray-400",
                  )}
                >
                  {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
                </span>
                <span
                  className={cn(
                    "hidden text-xs sm:inline",
                    i === step ? "font-medium text-gray-900" : "text-gray-400",
                  )}
                >
                  {label}
                </span>
                {i < STEPS.length - 1 && (
                  <span className="mx-1 h-px w-4 bg-gray-200" aria-hidden />
                )}
              </li>
            ))}
          </ol>

          <div className="rounded-2xl border border-white/60 bg-white/80 p-7 shadow-premium backdrop-blur-sm">
            {/* ---------------------------------------------- 1. marque -- */}
            {step === 0 && (
              <>
                <h1 className="font-heading text-2xl font-semibold text-gray-900">
                  Quelle marque voulez-vous suivre ?
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  C&apos;est le nom que nous chercherons dans les réponses des IA.
                  Écrivez-le exactement comme vos clients le disent.
                </p>

                <div className="mt-6 space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Site web
                    </label>
                    <input
                      value={websiteUrl}
                      onChange={(e) => {
                        setWebsiteUrl(e.target.value);
                        if (!brandName) setBrandName(brandFromUrl(e.target.value));
                      }}
                      placeholder="bioburger.fr"
                      className="mt-1.5 w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Nom de la marque
                    </label>
                    <input
                      value={brandName}
                      onChange={(e) => setBrandName(e.target.value)}
                      placeholder="Bioburger"
                      className="mt-1.5 w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  </div>
                </div>
              </>
            )}

            {/* ---------------------------------------------- 2. marché -- */}
            {step === 1 && (
              <>
                <h1 className="font-heading text-2xl font-semibold text-gray-900">
                  Dans quel marché ?
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  Ça détermine les requêtes que nous allons vous proposer. Restez
                  simple : les mots que vos clients emploieraient.
                </p>

                <div className="mt-6 space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Votre activité
                    </label>
                    <input
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      placeholder="restauration rapide bio"
                      className="mt-1.5 w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Ville <span className="text-gray-400">(optionnel)</span>
                      </label>
                      <input
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="Paris"
                        className="mt-1.5 w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-violet-500"
                      />
                      <p className="mt-1 text-xs text-gray-400">
                        Si vos clients cherchent localement.
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Cible <span className="text-gray-400">(optionnel)</span>
                      </label>
                      <input
                        value={audience}
                        onChange={(e) => setAudience(e.target.value)}
                        placeholder="PME, familles, freelances…"
                        className="mt-1.5 w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-violet-500"
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* ----------------------------------------- 3. concurrents -- */}
            {step === 2 && (
              <>
                <h1 className="font-heading text-2xl font-semibold text-gray-900">
                  Qui sont vos concurrents ?
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  Nous mesurons leur visibilité sur les mêmes requêtes. C&apos;est
                  ce qui transforme un score en information : savoir qui est cité
                  à votre place.
                </p>

                <div className="mt-6 space-y-2">
                  {competitors.map((c, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        value={c}
                        onChange={(e) =>
                          setCompetitors((prev) =>
                            prev.map((v, j) => (j === i ? e.target.value : v)),
                          )
                        }
                        placeholder={i === 0 ? "Big Fernand" : "Concurrent"}
                        className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-violet-500"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setCompetitors((prev) => prev.filter((_, j) => j !== i))
                        }
                        className="rounded-lg p-2 text-gray-300 hover:text-red-500"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  {competitors.length < 10 && (
                    <button
                      type="button"
                      onClick={() => setCompetitors((prev) => [...prev, ""])}
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-violet-600 hover:text-violet-700"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Ajouter un concurrent
                    </button>
                  )}
                </div>
              </>
            )}

            {/* -------------------------------------------- 4. requêtes -- */}
            {step === 3 && (
              <>
                <h1 className="font-heading text-2xl font-semibold text-gray-900">
                  Que tapent vos clients ?
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  Ne cherchez pas à les inventer : faites-vous en proposer une
                  centaine, puis gardez celles qui vous ressemblent. Tout est
                  modifiable.
                </p>

                <div className="mt-6">
                  <PromptSuggester
                    brandName={brandName}
                    category={[category, city].filter(Boolean).join(" ")}
                    competitors={cleanCompetitors}
                    existing={cleanPrompts}
                    engines={selectedLLMs.length ? selectedLLMs : LLM_ORDER.slice(0, maxLLMs)}
                    frequency={frequency}
                    onAdd={(added) =>
                      setPrompts((prev) => {
                        const known = new Set(
                          prev.map((p) => p.trim().toLowerCase()).filter(Boolean),
                        );
                        return [
                          ...prev.filter((p) => p.trim()),
                          ...added.filter((a) => !known.has(a.toLowerCase())),
                        ];
                      })
                    }
                  />
                </div>

                {cleanPrompts.length > 0 && (
                  <div className="mt-6">
                    <p className="mb-2 text-xs font-medium text-gray-400">
                      {cleanPrompts.length} requête
                      {cleanPrompts.length > 1 ? "s" : ""} retenue
                      {cleanPrompts.length > 1 ? "s" : ""}
                    </p>
                    <div className="max-h-56 space-y-1.5 overflow-y-auto pr-1">
                      {prompts.map((p, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <input
                            value={p}
                            onChange={(e) =>
                              setPrompts((prev) =>
                                prev.map((v, j) => (j === i ? e.target.value : v)),
                              )
                            }
                            className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-violet-500"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setPrompts((prev) => prev.filter((_, j) => j !== i))
                            }
                            className="rounded-lg p-1.5 text-gray-300 hover:text-red-500"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setPrompts((prev) => [...prev, ""])}
                  className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-violet-600 hover:text-violet-700"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Ajouter une requête à la main
                </button>

                {cleanPrompts.length > 0 && cleanPrompts.length < 5 && (
                  <p className="mt-3 text-xs text-amber-600">
                    Gardez-en au moins 5 : en dessous, le score varie trop d&apos;une
                    semaine à l&apos;autre pour vouloir dire quoi que ce soit.
                  </p>
                )}
              </>
            )}

            {/* --------------------------------------------- 5. moteurs -- */}
            {step === 4 && (
              <>
                <h1 className="font-heading text-2xl font-semibold text-gray-900">
                  Où voulez-vous être vu ?
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  Chaque moteur puise dans des sources différentes — c&apos;est
                  pour ça qu&apos;on les mesure séparément.
                </p>

                <div className="mt-6 space-y-2">
                  {LLM_ORDER.map((id) => {
                    const on = engines[id];
                    const blocked = !on && selectedLLMs.length >= maxLLMs;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => toggleEngine(id)}
                        disabled={blocked}
                        className={cn(
                          "flex w-full items-start gap-3 rounded-xl border p-3.5 text-left transition-colors",
                          on
                            ? "border-violet-300 bg-violet-50/60"
                            : "border-gray-200 bg-white hover:border-gray-300",
                          blocked && "cursor-not-allowed opacity-40",
                        )}
                      >
                        <span
                          className={cn(
                            "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                            on ? "border-violet-600 bg-violet-600" : "border-gray-300",
                          )}
                        >
                          {on && <Check className="h-3 w-3 text-white" />}
                        </span>
                        <span className="min-w-0">
                          <span className="flex items-center gap-2">
                            <span
                              className="h-2 w-2 rounded-full"
                              style={{ backgroundColor: LLMS[id].color }}
                            />
                            <span className="text-sm font-medium text-gray-900">
                              {LLMS[id].name}
                            </span>
                          </span>
                          <span className="mt-0.5 block text-xs text-gray-500">
                            {LLMS[id].bias}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>

                {selectedLLMs.length >= maxLLMs && maxLLMs < LLM_ORDER.length && (
                  <p className="mt-3 flex items-start gap-1.5 text-xs text-gray-500">
                    <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    Votre plan ({tier}) autorise {maxLLMs} moteurs sur{" "}
                    {LLM_ORDER.length}.
                  </p>
                )}

                <div className="mt-6">
                  <p className="text-sm font-medium text-gray-700">Rythme</p>
                  <div className="mt-2 flex gap-2">
                    {(["weekly", "daily"] as Frequency[]).map((f) => {
                      const locked = f === "daily" && !dailyAllowed;
                      return (
                        <button
                          key={f}
                          type="button"
                          disabled={locked}
                          onClick={() => setFrequency(f)}
                          className={cn(
                            "rounded-lg border px-4 py-2 text-sm transition-colors",
                            frequency === f
                              ? "border-violet-300 bg-violet-50 font-medium text-violet-700"
                              : "border-gray-200 text-gray-600 hover:border-gray-300",
                            locked && "cursor-not-allowed opacity-40",
                          )}
                        >
                          {f === "weekly" ? "Hebdomadaire" : "Quotidien"}
                        </button>
                      );
                    })}
                  </div>
                  <p className="mt-2 text-xs text-gray-400">
                    {cleanPrompts.length} requêtes × {selectedLLMs.length} moteurs ={" "}
                    {cleanPrompts.length * selectedLLMs.length} interrogations par
                    analyse.
                  </p>
                </div>
              </>
            )}

            {/* -------------------------------------------- 6. analyse --- */}
            {step === 5 && !result && (
              <>
                <h1 className="font-heading text-2xl font-semibold text-gray-900">
                  Prêt à mesurer votre point de départ
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  Nous allons poser vos {cleanPrompts.length} requêtes à{" "}
                  {selectedLLMs.length} moteurs et compter combien de fois{" "}
                  {brandName} est cité.
                </p>

                <dl className="mt-6 divide-y divide-gray-100 rounded-xl border border-gray-100">
                  {[
                    ["Marque", brandName],
                    ["Site", websiteUrl],
                    ["Marché", [category, city].filter(Boolean).join(" · ")],
                    [
                      "Concurrents",
                      cleanCompetitors.length ? cleanCompetitors.join(", ") : "aucun",
                    ],
                    ["Requêtes", `${cleanPrompts.length}`],
                    [
                      "Moteurs",
                      selectedLLMs.map((id) => LLMS[id].name).join(", "),
                    ],
                    ["Rythme", frequency === "daily" ? "Quotidien" : "Hebdomadaire"],
                  ].map(([label, value]) => (
                    <div key={label} className="flex gap-4 px-4 py-2.5 text-sm">
                      <dt className="w-28 shrink-0 text-gray-400">{label}</dt>
                      <dd className="min-w-0 text-gray-800">{value}</dd>
                    </div>
                  ))}
                </dl>

                <button
                  type="button"
                  onClick={launch}
                  disabled={running}
                  className={cn(
                    "mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white hover:bg-gray-800",
                    running && "cursor-wait opacity-70",
                  )}
                >
                  {running ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Analyse en cours…
                    </>
                  ) : (
                    <>
                      <Rocket className="h-4 w-4" />
                      Lancer la première analyse
                    </>
                  )}
                </button>
              </>
            )}

            {/* --- the result, framed honestly ------------------------- */}
            {step === 5 && result && (
              <>
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-violet-600 text-2xl font-bold text-white">
                    {result.globalScore}
                  </div>
                  <div>
                    <h1 className="font-heading text-2xl font-semibold text-gray-900">
                      Votre point de départ
                    </h1>
                    <p className="text-sm text-gray-500">
                      {result.resultsStored} réponses analysées à l&apos;instant.
                    </p>
                  </div>
                </div>

                <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <p className="text-sm font-medium text-amber-900">
                    Ce chiffre ne dit encore rien de votre progression.
                  </p>
                  <p className="mt-1 text-sm text-amber-800">
                    C&apos;est une photo, pas une tendance. Sa valeur viendra de sa
                    comparaison avec les semaines suivantes : c&apos;est là que vous
                    verrez si ce que vous publiez change quelque chose.
                  </p>
                </div>

                <div className="mt-6">
                  <p className="text-sm font-semibold text-gray-900">
                    Ce qui se passe maintenant
                  </p>
                  <ol className="mt-3 space-y-3">
                    {[
                      [
                        frequency === "daily" ? "Demain" : "La semaine prochaine",
                        "Deuxième mesure automatique. Vous obtenez votre première variation.",
                      ],
                      [
                        "Cette semaine",
                        "Ouvrez l'onglet Actions : les recommandations sont déjà calculées à partir de cette première analyse, moteur par moteur.",
                      ],
                      [
                        "Dans ~4 semaines",
                        "La courbe devient lisible. C'est le moment où l'écran Impact peut montrer si vos actions ont produit un effet.",
                      ],
                      [
                        "En continu",
                        "Un email vous prévient dès qu'un moteur décroche de 10 points ou plus.",
                      ],
                    ].map(([when, what]) => (
                      <li key={when} className="flex gap-3">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-500" />
                        <span className="text-sm">
                          <span className="font-medium text-gray-900">{when}</span>
                          <span className="text-gray-500"> — {what}</span>
                        </span>
                      </li>
                    ))}
                  </ol>
                </div>

                <div className="mt-7 flex flex-col gap-2 sm:flex-row">
                  <Link
                    href={`/app/${result.projectId}/recommendations`}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white hover:bg-gray-800"
                  >
                    Voir mes premières actions
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href={`/app/${result.projectId}`}
                    className="inline-flex flex-1 items-center justify-center rounded-xl border border-gray-200 px-5 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Ouvrir le tableau de bord
                  </Link>
                </div>
              </>
            )}

            {error && (
              <p className="mt-4 flex items-start gap-1.5 text-sm text-red-600">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                {error}
              </p>
            )}

            {/* navigation */}
            {!(step === 5 && result) && (
              <div className="mt-8 flex items-center justify-between border-t border-gray-100 pt-5">
                <button
                  type="button"
                  onClick={() => (step === 0 ? router.push("/app?demo=1") : setStep(step - 1))}
                  className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800"
                >
                  <ArrowLeft className="h-4 w-4" />
                  {step === 0 ? "Plus tard" : "Retour"}
                </button>

                {step < 5 && (
                  <button
                    type="button"
                    onClick={() => setStep(step + 1)}
                    disabled={!canContinue}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-800",
                      !canContinue && "cursor-not-allowed opacity-40",
                    )}
                  >
                    Continuer
                    <ArrowRight className="h-4 w-4" />
                  </button>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const session = await getSessionWorkspace(ctx);
  if (!session) return loginRedirect("/app/onboarding");

  // Onboarding is the first-run path only: once a project exists, it is done.
  const existing = await Project.countDocuments({
    organizationId: session.workspace.organizationId,
  });
  if (existing > 0) {
    return { redirect: { destination: "/app", permanent: false } };
  }

  const [{ tier }, user] = await Promise.all([
    getWorkspacePlan(session.workspace.ownerId),
    User.findById(session.userId).select("onboardingDomain").lean<{
      onboardingDomain?: string;
    } | null>(),
  ]);

  return {
    props: {
      initialWebsite: user?.onboardingDomain ?? "",
      maxLLMs: getMaxLLMs(tier),
      dailyAllowed: isFrequencyAllowed(tier, "daily"),
      tier,
    },
  };
};
