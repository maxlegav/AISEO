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
import MonitoringLayout from "@/components/monitoring/MonitoringLayout";
import {
  listSwitcherProjects,
  type SwitcherEntry,
} from "@/lib/monitoring/dashboard";
import { LLMBadge } from "@/components/monitoring/widgets";
import PromptSuggester from "@/components/monitoring/PromptSuggester";
import { LLM_ORDER, LLMS, type LLMId } from "@/lib/mock/monitoring";
import { getSessionWorkspace, loginRedirect } from "@/lib/app-auth";
import mongoose from "mongoose";
import Client from "@/models/Client";
import { cn } from "@/lib/utils";

type Frequency = "weekly" | "daily";

interface ClientOption {
  id: string;
  name: string;
}

interface NewProjectProps {
  switcherProjects: SwitcherEntry[];
  clients: ClientOption[];
  initialClientId: string | null;
}

const STEPS = ["Marque", "Concurrents & requêtes", "Moteurs & lancement"];

export default function NewProject({
  switcherProjects, clients, initialClientId }: NewProjectProps) {
  const router = useRouter();
  const [clientId, setClientId] = useState<string>(initialClientId ?? "");
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [brandName, setBrandName] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [category, setCategory] = useState("");
  const [competitors, setCompetitors] = useState<string[]>([""]);
  const [prompts, setPrompts] = useState<string[]>([]);
  const [frequency, setFrequency] = useState<Frequency>("weekly");
  const [engines, setEngines] = useState<Record<LLMId, boolean>>({
    chatgpt: true,
    perplexity: true,
    claude: true,
    gemini: true,
  });

  const cleanCompetitors = useMemo(
    () => competitors.map((c) => c.trim()).filter(Boolean),
    [competitors]
  );
  const cleanPrompts = useMemo(
    () => prompts.map((p) => p.trim()).filter(Boolean),
    [prompts]
  );
  const selectedLLMs = useMemo(
    () => LLM_ORDER.filter((llm) => engines[llm]),
    [engines]
  );

  const step0Valid = brandName.trim().length > 0 && websiteUrl.trim().length > 0;
  const step1Valid = cleanPrompts.length > 0;
  const step2Valid = selectedLLMs.length > 0;

  const updateList = (
    list: string[],
    setList: (v: string[]) => void,
    i: number,
    v: string
  ) => {
    const next = [...list];
    next[i] = v;
    setList(next);
  };

  async function createAndRun() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandName: brandName.trim(),
          websiteUrl: websiteUrl.trim(),
          category: category.trim() || undefined,
          competitors: cleanCompetitors,
          prompts: cleanPrompts,
          llms: selectedLLMs,
          frequency,
          clientId: clientId || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(
          json.message || "La création du projet a échoué. Réessayez."
        );
      }
      const projectId: string = json.data._id ?? json.data.id;
      // Fire the first run, then land on the dashboard (which will refresh).
      await fetch(`/api/projects/${projectId}/run`, { method: "POST" });
      router.push(`/app/${projectId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inattendue.");
      setSubmitting(false);
    }
  }

  return (
    <>
      <Head>
        <title>Nouveau projet · ShowYourBrand</title>
        <meta name="robots" content="noindex" />
      </Head>
      <MonitoringLayout
        projects={switcherProjects}
        active="dashboard"
        title="Nouveau projet"
        subtitle="Configurez une marque à monitorer : vous verrez un premier score en quelques minutes."
      >
        {/* Stepper */}
        <div className="mb-6 flex items-center gap-3">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold",
                    i < step
                      ? "bg-ink-900 text-white"
                      : i === step
                        ? "bg-gray-900 text-white"
                        : "bg-gray-100 text-gray-400"
                  )}
                >
                  {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
                </span>
                <span
                  className={cn(
                    "text-sm font-medium",
                    i === step ? "text-gray-900" : "text-gray-400"
                  )}
                >
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <span className="h-px w-6 bg-gray-200" />
              )}
            </div>
          ))}
        </div>

        {error && (
          <div className="mb-5 flex max-w-2xl items-start gap-2 rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <div className="max-w-2xl space-y-5">
          {step === 0 && (
            <section className="rounded-2xl border border-white/60 bg-white/80 p-6 shadow-premium backdrop-blur-sm">
              <h2 className="mb-4 font-heading text-lg font-semibold text-gray-900">
                Marque
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Nom de la marque
                  </label>
                  <input
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    placeholder="Linkflow"
                    className="w-full rounded-lg border border-gray-200 px-3.5 py-2 text-sm outline-none focus:border-transparent focus:ring-2 focus:ring-ink-200"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Site web
                  </label>
                  <input
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    placeholder="linkflow.io"
                    className="w-full rounded-lg border border-gray-200 px-3.5 py-2 text-sm outline-none focus:border-transparent focus:ring-2 focus:ring-ink-200"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Catégorie <span className="text-gray-400">(optionnel)</span>
                  </label>
                  <input
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="SaaS B2B, automatisation commerciale"
                    className="w-full rounded-lg border border-gray-200 px-3.5 py-2 text-sm outline-none focus:border-transparent focus:ring-2 focus:ring-ink-200"
                  />
                </div>
                {clients.length > 0 && (
                  <div className="sm:col-span-2">
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">
                      Client <span className="text-gray-400">(optionnel)</span>
                    </label>
                    <select
                      value={clientId}
                      onChange={(e) => setClientId(e.target.value)}
                      className="w-full rounded-lg border border-gray-200 px-3.5 py-2 text-sm outline-none focus:border-transparent focus:ring-2 focus:ring-ink-200"
                    >
                      <option value="">Aucun client</option>
                      {clients.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </section>
          )}

          {step === 1 && (
            <>
              <section className="rounded-2xl border border-white/60 bg-white/80 p-6 shadow-premium backdrop-blur-sm">
                <h2 className="mb-1 font-heading text-lg font-semibold text-gray-900">
                  Concurrents
                </h2>
                <p className="mb-4 text-sm text-gray-500">
                  Suivis sur les mêmes requêtes, pour comparer votre visibilité.
                </p>
                {competitors.map((c, i) => (
                  <div key={i} className="mb-2 flex items-center gap-2">
                    <input
                      value={c}
                      onChange={(e) =>
                        updateList(competitors, setCompetitors, i, e.target.value)
                      }
                      placeholder="Concurrent"
                      className="w-full rounded-lg border border-gray-200 px-3.5 py-2 text-sm outline-none focus:border-transparent focus:ring-2 focus:ring-ink-200"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setCompetitors(competitors.filter((_, j) => j !== i))
                      }
                      className="rounded-lg p-2 text-gray-300 hover:text-red-500"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setCompetitors([...competitors, ""])}
                  className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:text-accent"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Ajouter un concurrent
                </button>
              </section>

              <section className="rounded-2xl border border-white/60 bg-white/80 p-6 shadow-premium backdrop-blur-sm">
                <h2 className="mb-1 font-heading text-lg font-semibold text-gray-900">
                  Requêtes à surveiller
                </h2>
                <p className="mb-4 text-sm text-gray-500">
                  Ce que vos prospects tapent réellement. Faites-vous en proposer
                  une centaine, puis gardez celles qui vous ressemblent.
                </p>

                <div className="mb-5">
                  <PromptSuggester
                    brandName={brandName}
                    category={category}
                    competitors={cleanCompetitors}
                    existing={cleanPrompts}
                    engines={selectedLLMs.length ? selectedLLMs : LLM_ORDER}
                    frequency={frequency}
                    onAdd={(added) =>
                      setPrompts((prev) => {
                        const known = new Set(
                          prev.map((p) => p.trim().toLowerCase()).filter(Boolean),
                        );
                        const fresh = added.filter(
                          (a) => !known.has(a.toLowerCase()),
                        );
                        return [...prev.filter((p) => p.trim()), ...fresh];
                      })
                    }
                  />
                </div>

                {prompts.length > 0 && (
                  <p className="mb-2 text-xs font-medium text-gray-400">
                    {cleanPrompts.length} requête
                    {cleanPrompts.length > 1 ? "s" : ""} retenue
                    {cleanPrompts.length > 1 ? "s" : ""}
                  </p>
                )}
                {prompts.map((p, i) => (
                  <div key={i} className="mb-2 flex items-center gap-2">
                    <input
                      value={p}
                      onChange={(e) =>
                        updateList(prompts, setPrompts, i, e.target.value)
                      }
                      className="w-full rounded-lg border border-gray-200 px-3.5 py-2 text-sm outline-none focus:border-transparent focus:ring-2 focus:ring-ink-200"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setPrompts(prompts.filter((_, j) => j !== i))
                      }
                      className="rounded-lg p-2 text-gray-300 hover:text-red-500"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setPrompts([...prompts, ""])}
                  className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:text-accent"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Ajouter une requête
                </button>
              </section>
            </>
          )}

          {step === 2 && (
            <>
              <section className="rounded-2xl border border-white/60 bg-white/80 p-6 shadow-premium backdrop-blur-sm">
                <h2 className="mb-4 font-heading text-lg font-semibold text-gray-900">
                  Moteurs IA
                </h2>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {LLM_ORDER.map((llm) => (
                    <button
                      key={llm}
                      type="button"
                      onClick={() =>
                        setEngines({ ...engines, [llm]: !engines[llm] })
                      }
                      className={cn(
                        "flex flex-col items-center gap-2 rounded-xl border-2 p-3 transition-all",
                        engines[llm]
                          ? "border-ink-200 bg-accent-muted/60"
                          : "border-gray-100 bg-white opacity-60"
                      )}
                    >
                      <LLMBadge llm={llm} size={24} showName={false} />
                      <span className="text-xs font-medium text-gray-700">
                        {LLMS[llm].name}
                      </span>
                    </button>
                  ))}
                </div>
              </section>

              <section className="rounded-2xl border border-white/60 bg-white/80 p-6 shadow-premium backdrop-blur-sm">
                <h2 className="mb-4 font-heading text-lg font-semibold text-gray-900">
                  Fréquence
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  {(
                    [
                      { id: "weekly", label: "Hebdomadaire", hint: "1 run / semaine" },
                      { id: "daily", label: "Quotidien", hint: "1 run / jour" },
                    ] as { id: Frequency; label: string; hint: string }[]
                  ).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setFrequency(opt.id)}
                      className={cn(
                        "rounded-xl border-2 p-4 text-left transition-all",
                        frequency === opt.id
                          ? "border-ink-200 bg-accent-muted/60"
                          : "border-gray-100 bg-white"
                      )}
                    >
                      <p className="text-sm font-semibold text-gray-800">
                        {opt.label}
                      </p>
                      <p className="text-xs text-gray-400">{opt.hint}</p>
                    </button>
                  ))}
                </div>
              </section>

              <section className="rounded-2xl border border-ink-200 bg-accent-muted p-5 text-sm text-gray-700">
                <p className="font-semibold text-gray-900">Récapitulatif</p>
                <p className="mt-1">
                  <strong>{brandName || "Votre marque"}</strong> · {cleanPrompts.length}{" "}
                  requête(s) · {cleanCompetitors.length} concurrent(s) ·{" "}
                  {selectedLLMs.length} moteur(s) ·{" "}
                  {frequency === "daily" ? "quotidien" : "hebdomadaire"}
                </p>
              </section>
            </>
          )}

          {/* Nav */}
          <div className="flex items-center justify-between">
            {step > 0 ? (
              <button
                type="button"
                onClick={() => setStep((s) => s - 1)}
                disabled={submitting}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-700 disabled:opacity-50"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Retour
              </button>
            ) : (
              <Link
                href="/app"
                className="text-sm font-medium text-gray-500 hover:text-gray-700"
              >
                Annuler
              </Link>
            )}

            {step < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={() => setStep((s) => s + 1)}
                disabled={step === 0 ? !step0Valid : !step1Valid}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Continuer
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={createAndRun}
                disabled={!step2Valid || submitting}
                className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Création & premier run…
                  </>
                ) : (
                  <>
                    <Rocket className="h-4 w-4" />
                    Créer et lancer le monitoring
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </MonitoringLayout>
    </>
  );
}

export const getServerSideProps: GetServerSideProps<NewProjectProps> = async (
  ctx,
) => {
  const session = await getSessionWorkspace(ctx);
  if (!session) return loginRedirect("/app/new");
  const clients = (await Client.find({
    organizationId: session.workspace.organizationId,
    archived: false,
  })
    .sort({ createdAt: -1 })
    .lean()) as unknown as { _id: mongoose.Types.ObjectId; name: string }[];
  const switcherProjects = await listSwitcherProjects(
    session.workspace.organizationId,
  );
  return {
    props: {
      switcherProjects,
      clients: clients.map((c) => ({ id: c._id.toString(), name: c.name })),
      initialClientId: (ctx.query.client as string) || null,
    },
  };
};
