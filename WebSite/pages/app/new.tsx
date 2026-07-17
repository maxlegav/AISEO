import Head from "next/head";
import Link from "next/link";
import { useState } from "react";
import { Info, Plus, X } from "lucide-react";
import MonitoringLayout from "@/components/monitoring/MonitoringLayout";
import { LLMBadge } from "@/components/monitoring/widgets";
import { LLM_ORDER, LLMS } from "@/lib/mock/monitoring";
import { cn } from "@/lib/utils";

export default function NewProject() {
  const [competitors, setCompetitors] = useState<string[]>([""]);
  const [prompts, setPrompts] = useState<string[]>([
    "Quel est le meilleur outil pour [votre catégorie] ?",
    "Quelles sont les alternatives à [concurrent] ?",
  ]);
  const [engines, setEngines] = useState<Record<string, boolean>>({
    chatgpt: true,
    perplexity: true,
    claude: true,
    gemini: true,
  });

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

  return (
    <>
      <Head>
        <title>Nouveau projet · ShowYourBrand</title>
        <meta name="robots" content="noindex" />
      </Head>
      <MonitoringLayout
        active="dashboard"
        title="Nouveau projet"
        subtitle="Configurez une marque à monitorer — vous verrez un premier score en quelques minutes."
      >
        <div className="mb-5 flex items-start gap-2 rounded-2xl border border-violet-100 bg-violet-50/70 p-4 text-sm text-gray-600">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-violet-600" />
          Maquette : ce formulaire illustre l&apos;onboarding. La création réelle
          sera branchée sur le pipeline de monitoring.
        </div>

        <div className="max-w-2xl space-y-5">
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
                  placeholder="Linkflow"
                  className="w-full rounded-lg border border-gray-200 px-3.5 py-2 text-sm outline-none focus:border-transparent focus:ring-2 focus:ring-violet-500"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Site web
                </label>
                <input
                  placeholder="linkflow.io"
                  className="w-full rounded-lg border border-gray-200 px-3.5 py-2 text-sm outline-none focus:border-transparent focus:ring-2 focus:ring-violet-500"
                />
              </div>
            </div>
          </section>

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
                  placeholder="concurrent.com"
                  className="w-full rounded-lg border border-gray-200 px-3.5 py-2 text-sm outline-none focus:border-transparent focus:ring-2 focus:ring-violet-500"
                />
                <button
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
              onClick={() => setCompetitors([...competitors, ""])}
              className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-violet-600 hover:text-violet-700"
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
              Les questions que vos prospects posent aux IA dans votre catégorie.
            </p>
            {prompts.map((p, i) => (
              <div key={i} className="mb-2 flex items-center gap-2">
                <input
                  value={p}
                  onChange={(e) =>
                    updateList(prompts, setPrompts, i, e.target.value)
                  }
                  className="w-full rounded-lg border border-gray-200 px-3.5 py-2 text-sm outline-none focus:border-transparent focus:ring-2 focus:ring-violet-500"
                />
                <button
                  onClick={() => setPrompts(prompts.filter((_, j) => j !== i))}
                  className="rounded-lg p-2 text-gray-300 hover:text-red-500"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
            <button
              onClick={() => setPrompts([...prompts, ""])}
              className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-violet-600 hover:text-violet-700"
            >
              <Plus className="h-3.5 w-3.5" />
              Ajouter une requête
            </button>
          </section>

          <section className="rounded-2xl border border-white/60 bg-white/80 p-6 shadow-premium backdrop-blur-sm">
            <h2 className="mb-4 font-heading text-lg font-semibold text-gray-900">
              Moteurs IA
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {LLM_ORDER.map((llm) => (
                <button
                  key={llm}
                  onClick={() =>
                    setEngines({ ...engines, [llm]: !engines[llm] })
                  }
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-xl border-2 p-3 transition-all",
                    engines[llm]
                      ? "border-violet-400 bg-violet-50/60"
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

          <div className="flex items-center gap-3">
            <button
              disabled
              className="cursor-not-allowed rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white opacity-60"
            >
              Lancer le monitoring (bientôt)
            </button>
            <Link
              href="/app"
              className="text-sm font-medium text-gray-500 hover:text-gray-700"
            >
              Annuler
            </Link>
          </div>
        </div>
      </MonitoringLayout>
    </>
  );
}
