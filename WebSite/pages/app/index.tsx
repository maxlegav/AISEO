import Head from "next/head";
import Link from "next/link";
import { Plus, ArrowRight } from "lucide-react";
import MonitoringLayout from "@/components/monitoring/MonitoringLayout";
import {
  DeltaBadge,
  LLMBadge,
  MiniBar,
  ScoreRing,
} from "@/components/monitoring/widgets";
import { LLM_ORDER, PROJECTS } from "@/lib/mock/monitoring";

export default function AppOverview() {
  return (
    <>
      <Head>
        <title>Mes projets · ShowYourBrand</title>
        <meta name="robots" content="noindex" />
      </Head>
      <MonitoringLayout
        active="dashboard"
        title="Mes projets"
        subtitle="Suivez la visibilité de chaque marque dans les réponses des IA."
        actions={
          <Link
            href="/app/new"
            className="inline-flex h-9 items-center gap-1.5 rounded-full bg-gray-900 px-4 text-sm font-medium text-white transition-colors hover:bg-gray-800"
          >
            <Plus className="h-3.5 w-3.5" />
            Nouveau projet
          </Link>
        }
      >
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {PROJECTS.map((p) => (
            <Link
              key={p.id}
              href={`/app/${p.id}`}
              className="group flex flex-col rounded-2xl border border-white/60 bg-white/80 p-5 shadow-premium backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:shadow-premium-lg"
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate text-lg font-semibold text-gray-900">
                    {p.brandName}
                  </h3>
                  <p className="truncate text-sm text-gray-400">
                    {p.websiteUrl}
                  </p>
                </div>
                <ScoreRing value={p.globalScore} size={72} stroke={7} />
              </div>

              <div className="mb-4 flex items-center gap-2 text-xs text-gray-500">
                <DeltaBadge value={p.globalDelta} suffix=" pts / 7j" />
                <span className="text-gray-300">·</span>
                <span>
                  {p.prompts} requêtes · {p.frequency.toLowerCase()}
                </span>
              </div>

              <div className="space-y-2">
                {LLM_ORDER.map((llm) => {
                  const s = p.llmScores.find((x) => x.llm === llm)!;
                  return (
                    <div key={llm} className="flex items-center gap-3">
                      <div className="w-24 shrink-0">
                        <LLMBadge llm={llm} size={16} />
                      </div>
                      <MiniBar value={s.presenceRate} />
                      <span className="w-9 shrink-0 text-right text-xs font-semibold text-gray-600">
                        {s.presenceRate}%
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 flex items-center gap-1 text-sm font-medium text-violet-600 opacity-0 transition-opacity group-hover:opacity-100">
                Ouvrir le dashboard
                <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </Link>
          ))}

          <Link
            href="/app/new"
            className="flex min-h-[240px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-violet-200 bg-white/40 p-5 text-center transition-colors hover:border-violet-300 hover:bg-white/60"
          >
            <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white">
              <Plus className="h-5 w-5" />
            </span>
            <span className="text-sm font-semibold text-gray-800">
              Ajouter une marque à monitorer
            </span>
            <span className="mt-1 text-xs text-gray-400">
              Marque, concurrents, requêtes — résultats en quelques minutes.
            </span>
          </Link>
        </div>
      </MonitoringLayout>
    </>
  );
}
