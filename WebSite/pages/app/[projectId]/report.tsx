import Head from "next/head";
import Link from "next/link";
import type { GetServerSideProps } from "next";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { ArrowLeft, Download } from "lucide-react";
import {
  DeltaBadge,
  ScoreRing,
  scoreColor,
  scoreLabel,
} from "@/components/monitoring/widgets";
import { LLMS, LLM_ORDER, type Project } from "@/lib/mock/monitoring";
import { getSessionUserId, loginRedirect } from "@/lib/app-auth";
import { getProjectDashboard } from "@/lib/monitoring/dashboard";
import {
  getUserBranding,
  resolveReportBranding,
  type ReportBranding,
} from "@/lib/monitoring/branding";

interface ReportProps {
  project: Project;
  branding: ReportBranding;
  generatedAt: string;
  demo: boolean;
}

const PRIORITY_LABEL: Record<string, string> = {
  high: "Prioritaire",
  medium: "Recommandé",
  low: "Optionnel",
};

const PRIORITY_COLOR: Record<string, string> = {
  high: "#dc2626",
  medium: "#d97706",
  low: "#16a34a",
};

export default function ProjectReport({
  project,
  branding,
  generatedAt,
  demo,
}: ReportProps) {
  const ranked = [...project.llmScores].sort(
    (a, b) => b.presenceRate - a.presenceRate,
  );
  const topSources = project.sources.slice(0, 10);

  return (
    <>
      <Head>
        <title>
          Rapport GEO — {project.brandName} · {branding.name}
        </title>
        <meta name="robots" content="noindex" />
      </Head>

      {/* Screen-only toolbar (hidden when printing / saving to PDF) */}
      <div className="report-toolbar sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-3">
        <Link
          href={`/app/${project.id}`}
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour au projet
        </Link>
        <div className="flex items-center gap-3">
          <span className="hidden text-xs text-gray-400 sm:inline">
            Astuce : choisissez « Enregistrer au format PDF » dans la boîte
            d&apos;impression.
          </span>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: branding.primaryColor }}
          >
            <Download className="h-4 w-4" />
            Télécharger en PDF
          </button>
        </div>
      </div>

      <main className="report-page mx-auto max-w-4xl bg-white px-10 py-10 text-gray-900">
        {/* Branded header */}
        <header
          className="report-header flex items-center justify-between rounded-2xl px-7 py-6 text-white"
          style={{ backgroundColor: branding.primaryColor }}
        >
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={branding.logoUrl}
              alt={branding.name}
              className="h-9 w-9 rounded-lg bg-white/20 object-contain p-1"
            />
            <div>
              <p className="text-lg font-bold leading-tight">{branding.name}</p>
              <p className="text-xs opacity-80">{branding.domain}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-wider opacity-80">
              Rapport de visibilité GEO
            </p>
            <p className="text-sm font-medium">{generatedAt}</p>
          </div>
        </header>

        {/* Report title */}
        <section className="mt-8">
          <h1 className="font-heading text-3xl font-bold tracking-tight">
            {project.brandName}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {project.websiteUrl}
            {project.category ? ` · ${project.category}` : ""} ·{" "}
            {project.frequency} · {project.prompts} requêtes suivies sur{" "}
            {LLM_ORDER.length} moteurs IA
          </p>
          {demo && (
            <p className="mt-3 inline-block rounded-md bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
              Données de démonstration
            </p>
          )}
        </section>

        {/* Global score */}
        <section className="mt-6 flex items-center gap-6 rounded-2xl border border-gray-200 p-6">
          <ScoreRing value={project.globalScore} />
          <div>
            <p className="text-sm font-medium text-gray-500">
              Score global de visibilité
            </p>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-4xl font-bold">{project.globalScore}</span>
              <span className="text-lg text-gray-400">/100</span>
            </div>
            <div className="mt-2">
              <DeltaBadge value={project.globalDelta} suffix=" pts / 7j" />
            </div>
          </div>
        </section>

        {/* Evolution chart */}
        {project.weekly.length > 0 && (
          <section className="report-block mt-6 rounded-2xl border border-gray-200 p-6">
            <h2 className="mb-4 font-heading text-lg font-semibold">
              Évolution sur 12 semaines
            </h2>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={project.weekly}
                  margin={{ top: 8, right: 12, left: -16, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#eef0f5" />
                  <XAxis
                    dataKey="week"
                    tick={{ fontSize: 11, fill: "#9ca3af" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fontSize: 11, fill: "#9ca3af" }}
                    axisLine={false}
                    tickLine={false}
                    unit="%"
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid #eee",
                      fontSize: 12,
                    }}
                  />
                  <Legend
                    iconType="plainline"
                    wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                  />
                  {LLM_ORDER.map((llm) => (
                    <Line
                      key={llm}
                      type="monotone"
                      dataKey={llm}
                      name={LLMS[llm].name}
                      stroke={LLMS[llm].color}
                      strokeWidth={2}
                      dot={false}
                      isAnimationActive={false}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>
        )}

        {/* Per-LLM breakdown */}
        {ranked.length > 0 && (
          <section className="report-block mt-6">
            <h2 className="mb-3 font-heading text-lg font-semibold">
              Score par moteur IA
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {ranked.map((s) => (
                <div
                  key={s.llm}
                  className="rounded-2xl border border-gray-200 p-5"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-800">
                      {LLMS[s.llm].name}
                    </span>
                    <span
                      className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
                      style={{
                        color: scoreColor(s.presenceRate),
                        backgroundColor: `${scoreColor(s.presenceRate)}14`,
                      }}
                    >
                      {scoreLabel(s.presenceRate)}
                    </span>
                  </div>
                  <div className="mb-2 flex items-end gap-3">
                    <span className="text-2xl font-bold">
                      {s.presenceRate}%
                    </span>
                    <span className="mb-1 text-xs text-gray-400">
                      {s.avgPosition != null
                        ? `position moy. ${s.avgPosition.toFixed(1)}ᵉ`
                        : "jamais cité"}
                    </span>
                  </div>
                  <div className="mb-3 h-2 w-full overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${s.presenceRate}%`,
                        backgroundColor: scoreColor(s.presenceRate),
                      }}
                    />
                  </div>
                  <p className="text-xs leading-relaxed text-gray-600">
                    {s.explanation}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Competitors */}
        {project.competitorTable.length > 0 && (
          <section className="report-block mt-6">
            <h2 className="mb-3 font-heading text-lg font-semibold">
              Comparatif concurrents
            </h2>
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-xs text-gray-400">
                  <th className="py-2 font-medium">Marque</th>
                  {LLM_ORDER.map((llm) => (
                    <th key={llm} className="py-2 text-center font-medium">
                      {LLMS[llm].name}
                    </th>
                  ))}
                  <th className="py-2 text-center font-medium">Global</th>
                </tr>
              </thead>
              <tbody>
                {project.competitorTable.map((row) => (
                  <tr
                    key={row.name}
                    className="border-b border-gray-100"
                    style={
                      row.isYou
                        ? { backgroundColor: `${branding.primaryColor}0d` }
                        : undefined
                    }
                  >
                    <td className="py-2.5 font-medium">
                      {row.name}
                      {row.isYou && (
                        <span
                          className="ml-2 rounded px-1.5 py-0.5 text-[10px] font-semibold text-white"
                          style={{ backgroundColor: branding.primaryColor }}
                        >
                          Vous
                        </span>
                      )}
                    </td>
                    {LLM_ORDER.map((llm) => (
                      <td
                        key={llm}
                        className="py-2.5 text-center font-medium"
                        style={{ color: scoreColor(row.scores[llm]) }}
                      >
                        {row.scores[llm]}%
                      </td>
                    ))}
                    <td className="py-2.5 text-center font-bold">
                      {row.global}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {/* Sources */}
        {topSources.length > 0 && (
          <section className="report-block mt-6">
            <h2 className="mb-3 font-heading text-lg font-semibold">
              Sources les plus citées
            </h2>
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-xs text-gray-400">
                  <th className="py-2 font-medium">Source</th>
                  <th className="py-2 text-center font-medium">Moteurs</th>
                  <th className="py-2 text-center font-medium">Citations</th>
                  <th className="py-2 text-center font-medium">Vous cite</th>
                </tr>
              </thead>
              <tbody>
                {topSources.map((s) => (
                  <tr key={s.url} className="border-b border-gray-100">
                    <td className="py-2.5 font-medium text-gray-800">
                      {s.domain}
                    </td>
                    <td className="py-2.5 text-center text-gray-500">
                      {s.llms.map((l) => LLMS[l].name).join(", ")}
                    </td>
                    <td className="py-2.5 text-center font-medium">
                      {s.citations}
                    </td>
                    <td className="py-2.5 text-center">
                      {s.citesBrand ? "Oui" : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {/* Recommendations */}
        {project.recommendations.length > 0 && (
          <section className="report-block mt-6">
            <h2 className="mb-3 font-heading text-lg font-semibold">
              Recommandations prioritaires
            </h2>
            <div className="space-y-3">
              {project.recommendations.map((r, i) => (
                <div
                  key={`${r.llm}-${i}`}
                  className="rounded-2xl border border-gray-200 p-5"
                >
                  <div className="mb-1 flex items-center gap-2">
                    <span
                      className="rounded px-1.5 py-0.5 text-[10px] font-semibold text-white"
                      style={{ backgroundColor: PRIORITY_COLOR[r.priority] }}
                    >
                      {PRIORITY_LABEL[r.priority]}
                    </span>
                    <span className="text-xs text-gray-400">
                      {LLMS[r.llm].name}
                    </span>
                  </div>
                  <p className="font-semibold text-gray-900">{r.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-gray-600">
                    {r.detail}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Footer */}
        <footer className="mt-10 border-t border-gray-200 pt-4 text-center text-xs text-gray-400">
          {branding.whiteLabel ? (
            <>
              Rapport préparé par {branding.name} — {branding.domain}
            </>
          ) : (
            <>Généré par ShowYourBrand · showyourbrand.io</>
          )}
        </footer>
      </main>

      <style jsx global>{`
        @media print {
          .report-toolbar {
            display: none !important;
          }
          .report-page {
            max-width: none !important;
            padding: 0 !important;
          }
          .report-header,
          .report-block {
            break-inside: avoid;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
        @page {
          size: A4;
          margin: 14mm;
        }
      `}</style>
    </>
  );
}

export const getServerSideProps: GetServerSideProps<ReportProps> = async (
  ctx,
) => {
  const userId = await getSessionUserId(ctx);
  if (!userId) return loginRedirect("/app");

  const projectId = ctx.params?.projectId as string;
  const [{ project, demo }, { branding, whiteLabelActive }] = await Promise.all(
    [getProjectDashboard(userId, projectId), getUserBranding(userId)],
  );

  // No data to export yet → send the user back to the project (onboarding run).
  if (!project || project.pendingFirstRun) {
    return { redirect: { destination: `/app/${projectId}`, permanent: false } };
  }

  return {
    props: {
      project,
      branding: resolveReportBranding(branding, whiteLabelActive),
      generatedAt: new Date().toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
      demo,
    },
  };
};
