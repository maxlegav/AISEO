import Head from "next/head";
import type { GetServerSideProps } from "next";
import {
  Target,
  Trophy,
  Link2,
  FileCode,
  Lightbulb,
  Check,
  X,
  TrendingUp,
  TrendingDown,
  Minus,
  Activity,
  ExternalLink,
  ScanSearch,
  AlertTriangle,
  Send,
} from "lucide-react";
import MonitoringLayout from "@/components/monitoring/MonitoringLayout";
import ProjectNotFound from "@/components/monitoring/ProjectNotFound";
import PendingFirstRun from "@/components/monitoring/PendingFirstRun";
import DemoBanner from "@/components/monitoring/DemoBanner";
import CopyBlock from "@/components/monitoring/CopyBlock";
import GenerateDeliverable from "@/components/monitoring/GenerateDeliverable";
import { LLMBadge } from "@/components/monitoring/widgets";
import {
  priorityLabel,
  type Priority,
  type LLMId,
  type PromptInsight,
  type ActionItem,
  type Project,
  type OnPageStatus,
  type OnPageItem,
} from "@/lib/mock/monitoring";
import { getSessionWorkspace, loginRedirect } from "@/lib/app-auth";
import { getProjectDashboard } from "@/lib/monitoring/dashboard";
import type {
  MeasuredImpact,
  ScopeMovement,
} from "@/lib/monitoring/measured-impact";

const priorityStyles: Record<Priority, { dot: string; badge: string }> = {
  high: { dot: "bg-red-500", badge: "bg-red-50 text-red-600" },
  medium: { dot: "bg-amber-500", badge: "bg-amber-50 text-amber-700" },
  low: { dot: "bg-emerald-500", badge: "bg-emerald-50 text-emerald-700" },
};

const statusStyles: Record<
  PromptInsight["status"],
  { label: string; className: string }
> = {
  won: { label: "Gagnée", className: "bg-emerald-50 text-emerald-700" },
  partial: { label: "Partielle", className: "bg-amber-50 text-amber-700" },
  lost: { label: "Perdue", className: "bg-red-50 text-red-600" },
};

function MovementRow({ m }: { m: ScopeMovement }) {
  const tone =
    m.trend === "up"
      ? "text-emerald-600"
      : m.trend === "down"
        ? "text-red-600"
        : "text-gray-400";
  const Icon =
    m.trend === "up" ? TrendingUp : m.trend === "down" ? TrendingDown : Minus;
  const sign = m.delta > 0 ? "+" : "";
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 bg-white px-3 py-2.5">
      <span className="flex items-center gap-2 text-sm font-medium text-gray-800">
        {m.scope === "global" ? (
          <span className="rounded-md bg-gray-900 px-2 py-0.5 text-xs font-semibold text-white">
            Global
          </span>
        ) : (
          <LLMBadge llm={m.scope} size={15} />
        )}
      </span>
      <span className="flex items-center gap-3 text-sm">
        <span className="text-gray-400">
          {m.baseline}
          <span className="mx-1">→</span>
          {m.latest}
        </span>
        <span className={`inline-flex items-center gap-1 font-semibold ${tone}`}>
          <Icon className="h-3.5 w-3.5" />
          {sign}
          {m.delta} pts
        </span>
      </span>
    </div>
  );
}

function MeasuredImpactPanel({ impact }: { impact: MeasuredImpact }) {
  return (
    <div className="rounded-2xl border border-white/60 bg-white/80 p-5 shadow-premium backdrop-blur-sm">
      <div className="space-y-2">
        {impact.global && <MovementRow m={impact.global} />}
        {impact.engines.map((m) => (
          <MovementRow key={m.scope} m={m} />
        ))}
      </div>
      <p className="mt-3 text-xs leading-relaxed text-gray-400">
        Écart réel entre la semaine {impact.baselineWeek} et {impact.latestWeek},
        calculé sur les scores enregistrés. C'est une corrélation dans le temps,
        pas une preuve que les actions en sont la cause.
      </p>
    </div>
  );
}

function SectionTitle({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: typeof Target;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="mb-3 flex items-start gap-3">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white">
        <Icon className="h-4 w-4" />
      </span>
      <div>
        <h2 className="font-heading text-lg font-semibold text-gray-900">
          {title}
        </h2>
        <p className="text-sm text-gray-500">{subtitle}</p>
      </div>
    </div>
  );
}

function EngineChips({ engines }: { engines: LLMId[] }) {
  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      {engines.map((e) => (
        <span
          key={e}
          className="inline-flex items-center rounded-full border border-gray-100 bg-white px-1.5 py-0.5"
        >
          <LLMBadge llm={e} size={13} showName={false} />
        </span>
      ))}
    </span>
  );
}

function ActionCard({ item }: { item: ActionItem }) {
  const st = priorityStyles[item.priority];
  return (
    <div className="rounded-2xl border border-white/60 bg-white/80 p-5 shadow-premium backdrop-blur-sm">
      <div className="mb-2.5 flex flex-wrap items-center gap-2.5">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${st.badge}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
          {priorityLabel(item.priority)}
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2.5 py-1 text-[11px] font-semibold text-violet-700">
          <TrendingUp className="h-3 w-3" />
          +{item.impact} pts estimés
        </span>
        <span className="inline-flex items-center rounded-full border border-gray-100 bg-white px-2.5 py-1 text-[11px] text-gray-500">
          Effort : {item.effort}
        </span>
        <EngineChips engines={item.engines} />
      </div>
      <h3 className="mb-1.5 text-base font-semibold text-gray-900">
        {item.title}
      </h3>
      <p className="text-sm leading-relaxed text-gray-600">{item.detail}</p>
    </div>
  );
}

function PromptCard({
  insight,
  projectId,
}: {
  insight: PromptInsight;
  projectId: string;
}) {
  const st = statusStyles[insight.status];
  return (
    <div className="rounded-2xl border border-white/60 bg-white/80 p-5 shadow-premium backdrop-blur-sm">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${st.className}`}
        >
          {st.label}
        </span>
        {insight.potential > 0 && (
          <span className="text-[11px] font-semibold text-violet-600">
            +{insight.potential} pts potentiels
          </span>
        )}
      </div>
      <h3 className="mb-2 text-[15px] font-semibold text-gray-900">
        « {insight.prompt} »
      </h3>

      <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs">
        <span className="inline-flex items-center gap-1.5 text-emerald-700">
          <Check className="h-3.5 w-3.5" />
          Cité par
          {insight.enginesCiting.length ? (
            <EngineChips engines={insight.enginesCiting} />
          ) : (
            <span className="text-gray-400">aucun moteur</span>
          )}
        </span>
        {insight.enginesMissing.length > 0 && (
          <span className="inline-flex items-center gap-1.5 text-red-600">
            <X className="h-3.5 w-3.5" />
            Absent sur
            <EngineChips engines={insight.enginesMissing} />
          </span>
        )}
      </div>

      {insight.competitorsAhead.length > 0 && (
        <p className="mb-1.5 text-xs text-gray-500">
          <span className="font-medium text-gray-700">
            Concurrents cités à votre place :
          </span>{" "}
          {insight.competitorsAhead.join(", ")}
        </p>
      )}
      {insight.winningSources.length > 0 && (
        <p className="mb-2.5 text-xs text-gray-500">
          <span className="font-medium text-gray-700">Sources utilisées :</span>{" "}
          {insight.winningSources.map((s, i) => (
            <span key={s.url}>
              {i > 0 && ", "}
              <a
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-violet-600 hover:underline"
              >
                {s.domain}
              </a>
            </span>
          ))}
        </p>
      )}

      <div className="rounded-xl bg-violet-50/70 p-3 text-sm leading-relaxed text-gray-700">
        <span className="font-semibold text-violet-700">Action : </span>
        {insight.action}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <GenerateDeliverable
          projectId={projectId}
          kind="answer_page"
          prompt={insight.prompt}
          label="Générer la page de réponse"
          compact
        />
        <GenerateDeliverable
          projectId={projectId}
          kind="forum_reply"
          prompt={insight.prompt}
          label="Générer un brouillon Reddit/Quora"
          compact
        />
      </div>
    </div>
  );
}

const onPageStatusStyles: Record<
  OnPageStatus,
  { className: string; icon: typeof Check }
> = {
  ok: { className: "bg-emerald-50 text-emerald-700", icon: Check },
  warn: { className: "bg-amber-50 text-amber-700", icon: AlertTriangle },
  missing: { className: "bg-red-50 text-red-600", icon: X },
};

function OnPageRow({ item }: { item: OnPageItem }) {
  const st = onPageStatusStyles[item.status];
  const Icon = st.icon;
  return (
    <div className="flex items-start gap-3 border-b border-gray-50 py-3 last:border-0">
      <span
        className={`mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${st.className}`}
      >
        <Icon className="h-3.5 w-3.5" />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-900">{item.label}</p>
        <p className="break-words text-xs leading-relaxed text-gray-600">
          {item.detail}
        </p>
      </div>
    </div>
  );
}

interface RecommendationsProps {
  project: Project | null;
  demo: boolean;
}

export default function RecommendationsView({
  project,
  demo,
}: RecommendationsProps) {
  if (!project) return <ProjectNotFound />;
  if (project.pendingFirstRun) {
    return (
      <MonitoringLayout
        project={project}
        active="recommendations"
        title="Recommandations"
      >
        <PendingFirstRun projectId={project.id} />
      </MonitoringLayout>
    );
  }

  const order = { high: 0, medium: 1, low: 2 } as const;
  const actionPlan = project.actionPlan ?? [];
  const promptsToWin = (project.promptInsights ?? []).filter(
    (p) => p.status !== "won",
  );
  const wonCount = (project.promptInsights ?? []).filter(
    (p) => p.status === "won",
  ).length;
  const sourceTargets = project.sourceTargets ?? [];
  const technical = project.technical;
  const engineRecs = [...project.recommendations].sort(
    (a, b) => order[a.priority] - order[b.priority],
  );

  // Legacy fallback (demo mock projects have no data-driven fields).
  const hasRichData = actionPlan.length > 0 || (project.promptInsights?.length ?? 0) > 0;

  return (
    <>
      <Head>
        <title>{project.brandName} · Recommandations</title>
        <meta name="robots" content="noindex" />
      </Head>
      <MonitoringLayout
        project={project}
        active="recommendations"
        title="Recommandations"
        subtitle="Un plan d'action concret pour gagner en visibilité sur chaque moteur."
        demo={demo}
      >
        <DemoBanner demo={demo} />

        {!hasRichData ? (
          <div className="space-y-4">
            {engineRecs.map((r, i) => {
              const st = priorityStyles[r.priority];
              return (
                <div
                  key={i}
                  className="rounded-2xl border border-white/60 bg-white/80 p-5 shadow-premium backdrop-blur-sm"
                >
                  <div className="mb-2.5 flex flex-wrap items-center gap-2.5">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${st.badge}`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
                      {priorityLabel(r.priority)}
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-100 bg-white px-2.5 py-1 text-xs">
                      <LLMBadge llm={r.llm} size={15} />
                    </span>
                  </div>
                  <h3 className="mb-1.5 text-base font-semibold text-gray-900">
                    {r.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-gray-600">
                    {r.detail}
                  </p>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-10">
            {/* 0. Measured impact (real week-over-week movement) */}
            {project.measuredImpact?.hasHistory && (
              <section>
                <SectionTitle
                  icon={Activity}
                  title="Impact mesuré"
                  subtitle={`Évolution réelle observée sur ${project.measuredImpact.weeksSpanned} semaine(s), à comparer aux gains estimés ci-dessous.`}
                />
                <MeasuredImpactPanel impact={project.measuredImpact} />
              </section>
            )}

            {/* 1. Prioritized action plan */}
            <section>
              <SectionTitle
                icon={Target}
                title="Plan d'action priorisé"
                subtitle="Les actions à plus fort impact d'abord, avec gain de score estimé et effort."
              />
              <div className="space-y-3">
                {actionPlan.map((item) => (
                  <ActionCard key={item.id} item={item} />
                ))}
              </div>
            </section>

            {/* 2. Prompts to win */}
            <section>
              <SectionTitle
                icon={Trophy}
                title="Requêtes à gagner"
                subtitle={`${promptsToWin.length} requête(s) où vous pouvez progresser · ${wonCount} déjà gagnée(s) sur tous les moteurs.`}
              />
              <div className="grid gap-3 lg:grid-cols-2">
                {promptsToWin.map((insight) => (
                  <PromptCard
                    key={insight.prompt}
                    insight={insight}
                    projectId={project.id}
                  />
                ))}
              </div>
            </section>

            {/* 3. Sources to conquer */}
            {sourceTargets.length > 0 && (
              <section>
                <SectionTitle
                  icon={Link2}
                  title="Sources à conquérir"
                  subtitle="Ces pages font autorité auprès des IA de votre catégorie mais ne vous mentionnent pas. Visez-y une citation."
                />
                <div className="overflow-hidden rounded-2xl border border-white/60 bg-white/80 shadow-premium backdrop-blur-sm">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 text-left text-xs text-gray-400">
                        <th className="px-4 py-3 font-medium">Source</th>
                        <th className="px-4 py-3 font-medium">Citée par</th>
                        <th className="px-4 py-3 text-right font-medium">
                          Requêtes
                        </th>
                        <th className="px-4 py-3" />
                      </tr>
                    </thead>
                    <tbody>
                      {sourceTargets.map((s) => (
                        <tr
                          key={s.domain}
                          className="border-b border-gray-50 last:border-0"
                        >
                          <td className="px-4 py-3 font-medium text-gray-900">
                            {s.domain}
                          </td>
                          <td className="px-4 py-3">
                            <EngineChips engines={s.engines} />
                          </td>
                          <td className="px-4 py-3 text-right text-gray-600">
                            {s.citations}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <a
                              href={s.sampleUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-violet-600 hover:underline"
                            >
                              Voir <ExternalLink className="h-3 w-3" />
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <a
                  href={`/app/${project.id}/outreach`}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50 px-4 py-2 text-sm font-medium text-violet-700 transition-colors hover:bg-violet-100"
                >
                  <Send className="h-4 w-4" /> Préparer des demandes de mention
                </a>
              </section>
            )}

            {/* 4. On-page scan of the live site */}
            {technical?.onPage?.scanned && (
              <section>
                <SectionTitle
                  icon={ScanSearch}
                  title="Analyse on-page de votre site"
                  subtitle={`Scan en direct de ${project.websiteUrl.replace(/\/+$/, "")} : ce que les IA voient réellement sur votre page d'accueil.`}
                />
                <div className="overflow-hidden rounded-2xl border border-white/60 bg-white/80 px-5 shadow-premium backdrop-blur-sm">
                  {technical.onPage.items.map((item) => (
                    <OnPageRow key={item.label} item={item} />
                  ))}
                </div>
              </section>
            )}

            {/* 5. Technical GEO deliverables */}
            {technical && (
              <section>
                <SectionTitle
                  icon={FileCode}
                  title="Optimisations techniques GEO"
                  subtitle="Fichiers et balises prêts à coller pour rendre votre site citable par les IA."
                />
                <div className="space-y-4">
                  {/* llms.txt */}
                  <div className="rounded-2xl border border-white/60 bg-white/80 p-5 shadow-premium backdrop-blur-sm">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold text-gray-900">
                        llms.txt
                      </h3>
                      {technical.llmsTxtStatus && (
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                            technical.llmsTxtStatus.found &&
                            technical.llmsTxtStatus.complete
                              ? "bg-emerald-50 text-emerald-700"
                              : technical.llmsTxtStatus.found
                                ? "bg-amber-50 text-amber-700"
                                : "bg-red-50 text-red-600"
                          }`}
                        >
                          {technical.llmsTxtStatus.found &&
                          technical.llmsTxtStatus.complete ? (
                            <Check className="h-3 w-3" />
                          ) : technical.llmsTxtStatus.found ? (
                            <AlertTriangle className="h-3 w-3" />
                          ) : (
                            <X className="h-3 w-3" />
                          )}
                          {technical.llmsTxtStatus.found &&
                          technical.llmsTxtStatus.complete
                            ? "En ligne et complet"
                            : technical.llmsTxtStatus.found
                              ? "À compléter"
                              : "Absent"}
                        </span>
                      )}
                    </div>
                    <p className="mb-3 text-sm text-gray-600">
                      {technical.llmsTxtStatus
                        ? technical.llmsTxtStatus.note
                        : `Publiez ce fichier à la racine (${project.websiteUrl.replace(/\/+$/, "")}/llms.txt) pour décrire votre marque et vos pages clés aux crawlers IA.`}
                    </p>
                    <CopyBlock code={technical.llmsTxt} label="llms.txt" />
                    <GenerateDeliverable
                      projectId={project.id}
                      kind="llms_txt"
                      label="Générer un llms.txt complet"
                    />
                  </div>

                  {/* robots.txt */}
                  <div className="rounded-2xl border border-white/60 bg-white/80 p-5 shadow-premium backdrop-blur-sm">
                    <h3 className="mb-1 text-base font-semibold text-gray-900">
                      robots.txt : accès des crawlers IA
                    </h3>
                    <p className="mb-3 text-sm text-gray-600">
                      {technical.robots.note}
                    </p>
                    <div className="mb-3 flex flex-wrap gap-2">
                      {technical.robots.bots.map((b) => (
                        <span
                          key={b.bot}
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${
                            b.allowed
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-red-50 text-red-600"
                          }`}
                        >
                          {b.allowed ? (
                            <Check className="h-3 w-3" />
                          ) : (
                            <X className="h-3 w-3" />
                          )}
                          {b.bot}
                        </span>
                      ))}
                    </div>
                    <CopyBlock
                      code={technical.robots.patch}
                      label="À ajouter dans robots.txt"
                    />
                  </div>

                  {/* sitemap */}
                  <div className="rounded-2xl border border-white/60 bg-white/80 p-5 shadow-premium backdrop-blur-sm">
                    <h3 className="mb-1 text-base font-semibold text-gray-900">
                      sitemap.xml
                    </h3>
                    <p className="text-sm text-gray-600">
                      {technical.sitemap.note}{" "}
                      <a
                        href={technical.sitemap.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-violet-600 hover:underline"
                      >
                        {technical.sitemap.url}
                      </a>
                    </p>
                  </div>

                  {/* FAQ + JSON-LD */}
                  <div className="rounded-2xl border border-white/60 bg-white/80 p-5 shadow-premium backdrop-blur-sm">
                    <h3 className="mb-1 text-base font-semibold text-gray-900">
                      FAQ + données structurées
                    </h3>
                    <p className="mb-3 text-sm text-gray-600">
                      Publiez ce bloc FAQ (dérivé de vos requêtes suivies) et son
                      balisage schema.org FAQPage : les IA reprennent volontiers ce
                      format question/réponse.
                    </p>
                    <div className="mb-3 space-y-2">
                      {technical.faq.map((f, i) => (
                        <details
                          key={i}
                          className="rounded-xl border border-gray-100 bg-white p-3"
                        >
                          <summary className="cursor-pointer text-sm font-medium text-gray-900">
                            {f.question}
                          </summary>
                          <p className="mt-2 text-sm text-gray-600">{f.answer}</p>
                        </details>
                      ))}
                    </div>
                    <CopyBlock
                      code={technical.faqJsonLd}
                      label="JSON-LD (schema.org FAQPage)"
                    />
                    <GenerateDeliverable
                      projectId={project.id}
                      kind="faq_jsonld"
                      label="Générer une FAQ rédigée"
                    />
                  </div>

                  {/* Descriptions */}
                  <div className="rounded-2xl border border-white/60 bg-white/80 p-5 shadow-premium backdrop-blur-sm">
                    <h3 className="mb-1 text-base font-semibold text-gray-900">
                      Descriptions optimisées pour les IA
                    </h3>
                    <p className="mb-3 text-sm text-gray-600">
                      Au lieu de mots-clés isolés, donnez aux modèles des
                      phrases-descripteurs factuelles qu&apos;ils peuvent reprendre
                      telles quelles.
                    </p>
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
                      Meta description
                    </p>
                    <p className="mb-3 rounded-xl bg-gray-50 p-3 text-sm text-gray-700">
                      {technical.descriptions.metaDescription}
                    </p>
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
                      Phrases-descripteurs
                    </p>
                    <ul className="space-y-1.5">
                      {technical.descriptions.sentenceDescriptors.map((s, i) => (
                        <li
                          key={i}
                          className="rounded-xl bg-gray-50 p-3 text-sm text-gray-700"
                        >
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Organization JSON-LD patch */}
                  <div className="rounded-2xl border border-white/60 bg-white/80 p-5 shadow-premium backdrop-blur-sm">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold text-gray-900">
                        Balisage Organization (schema.org)
                      </h3>
                      {technical.onPage &&
                        !technical.onPage.hasOrganizationSchema && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-600">
                            <X className="h-3 w-3" /> Absent de votre page
                          </span>
                        )}
                    </div>
                    <p className="mb-3 text-sm text-gray-600">
                      Ce bloc JSON-LD Organization aide les IA à identifier votre
                      marque. Générez-le à partir des infos réelles de votre site,
                      puis collez-le dans le &lt;head&gt;.
                    </p>
                    <GenerateDeliverable
                      projectId={project.id}
                      kind="org_jsonld"
                      label="Générer le balisage Organization"
                      compact
                    />
                  </div>
                </div>
              </section>
            )}

            {/* 6. Per-engine playbook */}
            <section>
              <SectionTitle
                icon={Lightbulb}
                title="Actions par moteur"
                subtitle="Rappel du biais de chaque moteur où vous êtes le plus faible."
              />
              <div className="space-y-3">
                {engineRecs.map((r, i) => {
                  const st = priorityStyles[r.priority];
                  return (
                    <div
                      key={i}
                      className="rounded-2xl border border-white/60 bg-white/80 p-5 shadow-premium backdrop-blur-sm"
                    >
                      <div className="mb-2.5 flex flex-wrap items-center gap-2.5">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${st.badge}`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
                          {priorityLabel(r.priority)}
                        </span>
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-100 bg-white px-2.5 py-1 text-xs">
                          <LLMBadge llm={r.llm} size={15} />
                        </span>
                      </div>
                      <h3 className="mb-1.5 text-base font-semibold text-gray-900">
                        {r.title}
                      </h3>
                      <p className="text-sm leading-relaxed text-gray-600">
                        {r.detail}
                      </p>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        )}

        <div className="mt-8 flex items-center justify-between rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50 to-fuchsia-50 p-5">
          <div>
            <p className="text-sm font-semibold text-gray-900">
              Ces recommandations sont recalculées à chaque run.
            </p>
            <p className="text-sm text-gray-500">
              Appliquez, laissez tourner, et mesurez l&apos;impact semaine après
              semaine.
            </p>
          </div>
        </div>
      </MonitoringLayout>
    </>
  );
}

export const getServerSideProps: GetServerSideProps<RecommendationsProps> = async (
  ctx,
) => {
  const session = await getSessionWorkspace(ctx);
  if (!session) return loginRedirect("/app");
  const projectId = ctx.params?.projectId as string;
  const { project, demo } = await getProjectDashboard(
    session.workspace.organizationId,
    projectId,
  );
  return { props: { project, demo } };
};
