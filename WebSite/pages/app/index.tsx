import Head from "next/head";
import Link from "next/link";
import type { GetServerSideProps } from "next";
import { Plus, ArrowRight } from "lucide-react";
import SybMark from "@/components/icons/SybMark";
import Favicon from "@/components/monitoring/Favicon";
import MonitoringLayout from "@/components/monitoring/MonitoringLayout";
import {
  DeltaBadge,
  LLMBadge,
  MiniBar,
  ScoreRing,
} from "@/components/monitoring/widgets";
import { LLM_ORDER, type Project } from "@/lib/mock/monitoring";
import { getSessionWorkspace, loginRedirect } from "@/lib/app-auth";
import { getProjectSummaries, type ClientOption } from "@/lib/monitoring/dashboard";

interface AppOverviewProps {
  projects: Project[];
  demo: boolean;
  clients: ClientOption[];
  activeClientId: string | null;
}

export default function AppOverview({
  projects,
  demo,
  clients,
  activeClientId,
}: AppOverviewProps) {
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
        projects={projects}
        demo={demo}
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
        {clients.length > 0 && (
          <div className="mb-5 flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              Clients
            </span>
            <Link
              href="/app"
              className={
                "rounded-full border px-3 py-1 text-xs font-medium transition-colors " +
                (!activeClientId
                  ? "border-violet-300 bg-violet-50 text-violet-700"
                  : "border-white/60 bg-white/60 text-gray-500 hover:text-gray-800")
              }
            >
              Tous
            </Link>
            {clients.map((c) => (
              <Link
                key={c.id}
                href={`/app?client=${c.id}`}
                className={
                  "rounded-full border px-3 py-1 text-xs font-medium transition-colors " +
                  (activeClientId === c.id
                    ? "border-violet-300 bg-violet-50 text-violet-700"
                    : "border-white/60 bg-white/60 text-gray-500 hover:text-gray-800")
                }
              >
                {c.name}
              </Link>
            ))}
            <Link
              href="/app/clients"
              className="ml-auto text-xs font-medium text-violet-600 hover:text-violet-700"
            >
              Gérer les clients
            </Link>
          </div>
        )}
        {demo && (
          <div className="mb-5 flex items-start gap-2 rounded-2xl border border-violet-100 bg-violet-50/70 p-4 text-sm text-gray-600">
            <SybMark className="mt-0.5 h-4 w-4 shrink-0 text-violet-600" />
            <span>
              Voici des <strong>données de démonstration</strong>. Créez votre
              premier projet pour lancer un vrai monitoring et voir vos propres
              scores ici.
            </span>
          </div>
        )}
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((p) => (
            <Link
              key={p.id}
              href={`/app/${p.id}`}
              className="group flex flex-col rounded-2xl border border-white/60 bg-white/80 p-5 shadow-premium backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:shadow-premium-lg"
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-2.5">
                  <Favicon
                    source={p.websiteUrl}
                    label={p.brandName}
                    size={36}
                    rounded="rounded-xl"
                  />
                  <div className="min-w-0">
                    {p.clientName && (
                      <span className="mb-1 inline-block rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                        {p.clientName}
                      </span>
                    )}
                    <h3 className="truncate text-lg font-semibold text-gray-900">
                      {p.brandName}
                    </h3>
                    <p className="truncate text-sm text-gray-400">
                      {p.websiteUrl}
                    </p>
                  </div>
                </div>
                <ScoreRing value={p.globalScore} size={72} stroke={7} />
              </div>

              <div className="mb-4 flex items-center gap-2 text-xs text-gray-500">
                {p.pendingFirstRun ? (
                  <span className="rounded-full bg-amber-50 px-2 py-0.5 font-semibold text-amber-700">
                    En attente du premier run
                  </span>
                ) : (
                  <DeltaBadge value={p.globalDelta} suffix=" pts / 7j" />
                )}
                <span className="text-gray-300">·</span>
                <span>
                  {p.prompts} requêtes · {p.frequency.toLowerCase()}
                </span>
              </div>

              <div className="space-y-2">
                {LLM_ORDER.map((llm) => {
                  const s = p.llmScores.find((x) => x.llm === llm);
                  const rate = s?.presenceRate ?? 0;
                  return (
                    <div key={llm} className="flex items-center gap-3">
                      <div className="w-24 shrink-0">
                        <LLMBadge llm={llm} size={16} />
                      </div>
                      <MiniBar value={rate} />
                      <span className="w-9 shrink-0 text-right text-xs font-semibold text-gray-600">
                        {rate}%
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
              Marque, concurrents, requêtes : résultats en quelques minutes.
            </span>
          </Link>
        </div>
      </MonitoringLayout>
    </>
  );
}

export const getServerSideProps: GetServerSideProps<AppOverviewProps> = async (
  ctx,
) => {
  const session = await getSessionWorkspace(ctx);
  if (!session) return loginRedirect("/app");
  const activeClientId = (ctx.query.client as string) || null;
  const { projects, demo, clients } = await getProjectSummaries(
    session.workspace.organizationId,
    activeClientId,
  );
  return { props: { projects, demo, clients, activeClientId } };
};
