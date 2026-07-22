/**
 * Server-side data layer that turns the Mongo monitoring documents
 * (Project / LLMResult / WeeklyScore / MonitoredSource) into the exact shape
 * the `/app` dashboard components expect (see `@/lib/mock/monitoring`).
 *
 * Rules:
 *  - Only call these from `getServerSideProps` (they touch Mongo + models).
 *  - When the signed-in user has NO project yet, we return the demo (mock)
 *    projects and flag `demo: true` so the UI can label them clearly.
 *  - A real project that has never run yet is returned with `pendingFirstRun`
 *    so the UI shows an onboarding "run now" state instead of fake numbers.
 */

import mongoose from "mongoose";
import Project from "@/models/Project";
import Client from "@/models/Client";
import LLMResult from "@/models/LLMResult";
import WeeklyScore from "@/models/WeeklyScore";
import MonitoredSource from "@/models/MonitoredSource";
import { detectBrand } from "@/lib/monitoring/brand-detection";
import { domainOf } from "@/lib/monitoring/source-extraction";
import type { LLMId } from "@/lib/monitoring/types";
import { LLM_ORDER } from "@/lib/monitoring/types";
import {
  PROJECTS as MOCK_PROJECTS,
  type Project as UIProject,
  type LLMScore,
  type WeeklyPoint,
  type CompetitorRow,
  type SourceRow,
  type Recommendation,
} from "@/lib/mock/monitoring";
import {
  analyzePrompts,
  buildSourceTargets,
  buildActionPlan,
  buildTechnicalGeo,
  type ResultRow,
} from "@/lib/monitoring/recommendations";
import { fetchSiteSignals } from "@/lib/monitoring/site-signals";

async function connectDB(): Promise<void> {
  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(process.env.MONGODB_URI!);
  }
}

function zeroScores(): Record<LLMId, number> {
  return { chatgpt: 0, claude: 0, perplexity: 0, gemini: 0 };
}

type Tier = "fort" | "moyen" | "faible" | "critique";

function tierOf(rate: number): Tier {
  if (rate >= 65) return "fort";
  if (rate >= 40) return "moyen";
  if (rate >= 20) return "faible";
  return "critique";
}

/** Per-engine, per-tier French explanation of a presence score. */
function explain(llm: LLMId, rate: number): string {
  const tier = tierOf(rate);
  const byLLM: Record<LLMId, Record<Tier, string>> = {
    perplexity: {
      fort: "Fort : vos pages récentes et bien référencées sont reprises telles quelles. Perplexity vous cite sur la majorité des requêtes.",
      moyen:
        "Moyen : Perplexity vous reprend par intermittence. Rafraîchissez vos pages phares — il privilégie le contenu récent à fort trafic.",
      faible:
        "Faible : votre contenu est perçu comme daté. Mettez à jour vos pages clés pour regagner en visibilité Perplexity.",
      critique:
        "Critique : Perplexity ne vous reprend quasiment jamais. Publiez du contenu récent et faisant autorité sur vos requêtes cibles.",
    },
    chatgpt: {
      fort: "Fort : vous ressortez sur la plupart des requêtes. Votre présence Bing sur ces mots-clés porte ses fruits.",
      moyen:
        "Moyen : cité sur les requêtes de marque mais pas sur les génériques. Renforcez votre présence Bing sur ces mots-clés.",
      faible:
        "Faible : vous êtes hors du top Bing sur la plupart des requêtes. Optimisez des pages ciblées pour y remonter.",
      critique:
        "Critique : ChatGPT suit Bing et vous n'y êtes pas visible sur vos requêtes. C'est le principal chantier.",
    },
    gemini: {
      fort: "Fort : vos contenus (dont YouTube / propriétés Google) sont bien repris par Gemini.",
      moyen:
        "Moyen : présence partielle. Une vidéo YouTube et du balisage produit vous feraient progresser sur Gemini.",
      faible:
        "Faible : Gemini privilégie YouTube et les propriétés Google, où vous êtes peu présent.",
      critique:
        "Critique : aucune présence YouTube / Google structurée sur vos requêtes. C'est ce qui vous rend invisible sur Gemini.",
    },
    claude: {
      fort: "Fort : vous êtes bien présent sur Reddit, Quora et les forums que Claude privilégie.",
      moyen:
        "Moyen : présence forum partielle. Contribuez utilement à quelques threads clés pour progresser sur Claude.",
      faible:
        "Faible : peu de mentions sur les forums / Reddit que Claude reprend 2 à 4× plus que les autres moteurs.",
      critique:
        "Critique : Claude s'appuie beaucoup sur Reddit et les forums, où votre marque est absente. Aucune discussion ne vous mentionne.",
    },
  };
  return byLLM[llm][tier];
}

/** Rule-based, per-engine recommendation for a weak score. */
function recommendationFor(llm: LLMId, rate: number): Recommendation {
  const priority: Recommendation["priority"] =
    rate < 25 ? "high" : rate < 50 ? "medium" : "low";
  const templates: Record<LLMId, { title: string; detail: string }> = {
    claude: {
      title: "Gagnez en présence sur Reddit et Quora",
      detail:
        "Claude cite les forums 2 à 4× plus que les autres moteurs. Répondez de façon utile (non promotionnelle) à quelques threads clés de votre catégorie pour amorcer des citations Claude.",
    },
    gemini: {
      title: "Publiez une vidéo YouTube sur votre catégorie",
      detail:
        "Gemini favorise YouTube et les propriétés Google. Une démo produit courte, optimisée sur votre requête principale, vous rendrait éligible aux citations Gemini.",
    },
    chatgpt: {
      title: "Renforcez votre présence Bing sur vos requêtes génériques",
      detail:
        "ChatGPT suit Bing. Créez ou optimisez des pages ciblées sur les requêtes non-marque où un concurrent vous devance pour remonter dans les réponses ChatGPT.",
    },
    perplexity: {
      title: "Rafraîchissez vos pages phares",
      detail:
        "Perplexity privilégie le contenu récent à fort trafic. Mettez à jour titres, descriptions et dates de vos pages clés pour regagner en visibilité.",
    },
  };
  return { llm, priority, ...templates[llm] };
}

function frequencyLabel(freq: string): UIProject["frequency"] {
  return freq === "daily" ? "Quotidien" : "Hebdomadaire";
}

interface LeanProject {
  _id: mongoose.Types.ObjectId;
  brandName: string;
  websiteUrl: string;
  category?: string;
  competitors: string[];
  prompts: string[];
  llms: LLMId[];
  frequency: string;
  clientId?: mongoose.Types.ObjectId | null;
}

/**
 * Build the full UI project for a project that has at least one run.
 * `latestWeek` is the most recent week present in WeeklyScore.
 */
async function buildRanProject(p: LeanProject, latestWeek: string): Promise<UIProject> {
  const projectId = p._id;

  const [scores, prevScores, results, sourceDocs] = await Promise.all([
    WeeklyScore.find({ projectId, week: latestWeek }).lean(),
    // All weekly scores, to build the 12-week series.
    WeeklyScore.find({ projectId }).sort({ week: 1 }).lean(),
    LLMResult.find({ projectId, week: latestWeek }).lean(),
    MonitoredSource.find({ projectId }).sort({ citations: -1 }).lean(),
  ]);

  // --- per-LLM scores (latest week) ---
  const llmScores: LLMScore[] = LLM_ORDER.flatMap((llm) => {
    const s = scores.find((x) => x.scope === llm);
    if (!s) return [];
    return [
      {
        llm,
        presenceRate: s.presenceRate,
        avgPosition: s.avgPosition ?? null,
        deltaVsLastWeek: s.deltaVsLastWeek,
        explanation: explain(llm, s.presenceRate),
      },
    ];
  });

  const globalDoc = scores.find((x) => x.scope === "global");
  const globalScore = globalDoc ? globalDoc.presenceRate : 0;
  const globalDelta = globalDoc ? globalDoc.deltaVsLastWeek : 0;

  // --- 12-week evolution series ---
  const weeks = Array.from(new Set(prevScores.map((s) => s.week))).sort().slice(-12);
  const weekly: WeeklyPoint[] = weeks.map((week, i) => {
    const at = (scope: LLMId | "global") =>
      prevScores.find((s) => s.week === week && s.scope === scope)?.presenceRate ?? 0;
    return {
      week: i === weeks.length - 1 ? "S0" : `S-${weeks.length - 1 - i}`,
      chatgpt: at("chatgpt"),
      claude: at("claude"),
      perplexity: at("perplexity"),
      gemini: at("gemini"),
      global: at("global"),
    };
  });

  // --- competitor table (computed on the fly from stored responses) ---
  const youScores = zeroScores();
  for (const s of llmScores) youScores[s.llm] = s.presenceRate;
  const competitorTable: CompetitorRow[] = [
    {
      name: p.brandName,
      isYou: true,
      global: globalScore,
      trend: globalDelta,
      scores: youScores,
    },
    ...p.competitors.map((name) => {
      const scoresByLLM = zeroScores();
      for (const llm of LLM_ORDER) {
        const forLLM = results.filter((r) => r.llm === llm);
        if (forLLM.length === 0) continue;
        const hits = forLLM.filter((r) => detectBrand(r.responseText, name).found).length;
        scoresByLLM[llm] = Math.round((hits / forLLM.length) * 100);
      }
      const evaluated = LLM_ORDER.filter((llm) => results.some((r) => r.llm === llm));
      const global =
        evaluated.length === 0
          ? 0
          : Math.round(
              evaluated.reduce((acc, llm) => acc + scoresByLLM[llm], 0) / evaluated.length,
            );
      return { name, global, trend: 0, scores: scoresByLLM };
    }),
  ];

  // --- sources (aggregate MonitoredSource per url) ---
  const byUrl = new Map<string, SourceRow>();
  for (const doc of sourceDocs) {
    const existing = byUrl.get(doc.url);
    if (existing) {
      if (!existing.llms.includes(doc.llm)) existing.llms.push(doc.llm);
      existing.citations += doc.citations;
      existing.citesBrand = existing.citesBrand || doc.citesBrand;
    } else {
      byUrl.set(doc.url, {
        domain: doc.domain,
        url: doc.url,
        llms: [doc.llm],
        citesBrand: doc.citesBrand,
        citations: doc.citations,
      });
    }
  }
  const sources = Array.from(byUrl.values()).sort((a, b) => b.citations - a.citations);

  // --- recommendations (3 weakest engines) ---
  const recommendations: Recommendation[] = [...llmScores]
    .sort((a, b) => a.presenceRate - b.presenceRate)
    .slice(0, 3)
    .map((s) => recommendationFor(s.llm, s.presenceRate));

  // --- data-driven recommendations (per-prompt, sources, action plan) ---
  const resultRows: ResultRow[] = results.map((r) => ({
    prompt: r.prompt,
    llm: r.llm as LLMId,
    brandMentioned: r.brandMentioned,
    responseText: r.responseText,
    sourcesCited: r.sourcesCited ?? [],
  }));
  const promptInsights = analyzePrompts(resultRows, p.competitors);
  const sourceTargets = buildSourceTargets(sources);
  const actionPlan = buildActionPlan(
    promptInsights,
    sourceTargets,
    llmScores.map((s) => ({ llm: s.llm, presenceRate: s.presenceRate })),
  );

  // --- technical GEO deliverables (best-effort live site check) ---
  const signals = await fetchSiteSignals(p.websiteUrl);
  const ownDomainSources = sources
    .filter((s) => s.domain === domainOf(p.websiteUrl))
    .map((s) => s.url);
  const technical = buildTechnicalGeo({
    brandName: p.brandName,
    websiteUrl: p.websiteUrl,
    category: p.category ?? "",
    competitors: p.competitors,
    prompts: p.prompts,
    topSourceUrls: ownDomainSources,
    robotsText: signals.robotsText,
    robotsReachable: signals.robotsReachable,
    sitemapFound: signals.sitemapFound,
  });

  return {
    id: projectId.toString(),
    brandName: p.brandName,
    websiteUrl: p.websiteUrl,
    category: p.category ?? "",
    competitors: p.competitors,
    prompts: p.prompts.length,
    frequency: frequencyLabel(p.frequency),
    globalScore,
    globalDelta,
    llmScores,
    weekly,
    competitorTable,
    sources,
    recommendations,
    promptInsights,
    sourceTargets,
    actionPlan,
    technical,
    isReal: true,
    pendingFirstRun: false,
  };
}

/** A real project that has never run: real metadata, empty results. */
function buildPendingProject(p: LeanProject): UIProject {
  return {
    id: p._id.toString(),
    brandName: p.brandName,
    websiteUrl: p.websiteUrl,
    category: p.category ?? "",
    competitors: p.competitors,
    prompts: p.prompts.length,
    frequency: frequencyLabel(p.frequency),
    globalScore: 0,
    globalDelta: 0,
    llmScores: [],
    weekly: [],
    competitorTable: [],
    sources: [],
    recommendations: [],
    isReal: true,
    pendingFirstRun: true,
  };
}

export interface ClientOption {
  id: string;
  name: string;
}

export interface DashboardListResult {
  projects: UIProject[];
  demo: boolean;
  clients: ClientOption[];
}

async function clientNameMap(organizationId: string): Promise<Map<string, string>> {
  const clients = (await Client.find({ organizationId, archived: false })
    .select("name")
    .lean()) as unknown as { _id: mongoose.Types.ObjectId; name: string }[];
  return new Map(clients.map((c) => [c._id.toString(), c.name]));
}

/**
 * Projects list for `/app`, scoped to the acting organization. Falls back to
 * demo data when the organization has no project. Optionally filters by client.
 */
export async function getProjectSummaries(
  organizationId: string,
  clientId?: string | null,
): Promise<DashboardListResult> {
  await connectDB();
  const names = await clientNameMap(organizationId);
  const clientOptions: ClientOption[] = Array.from(names.entries()).map(
    ([id, name]) => ({ id, name }),
  );

  const query: Record<string, unknown> = { organizationId };
  if (clientId) query.clientId = clientId;
  const docs = (await Project.find(query)
    .sort({ createdAt: -1 })
    .lean()) as unknown as LeanProject[];

  if (docs.length === 0 && !clientId) {
    return { projects: MOCK_PROJECTS, demo: true, clients: clientOptions };
  }

  const projects = await Promise.all(
    docs.map(async (p) => {
      const latest = await WeeklyScore.findOne({ projectId: p._id }).sort({ week: -1 }).lean();
      const ui = latest ? await buildRanProject(p, latest.week) : buildPendingProject(p);
      const cid = p.clientId ? p.clientId.toString() : null;
      ui.clientId = cid;
      ui.clientName = cid ? names.get(cid) ?? null : null;
      return ui;
    }),
  );
  return { projects, demo: false, clients: clientOptions };
}

export interface DashboardProjectResult {
  project: UIProject | null;
  demo: boolean;
}

/**
 * Full dashboard for a single project, scoped to the acting organization.
 * Falls back to the matching demo project when the org has no real project.
 */
export async function getProjectDashboard(
  organizationId: string,
  projectId: string,
): Promise<DashboardProjectResult> {
  await connectDB();
  const anyReal = await Project.countDocuments({ organizationId });
  if (anyReal === 0) {
    const mock = MOCK_PROJECTS.find((p) => p.id === projectId) ?? null;
    return { project: mock, demo: true };
  }

  if (!mongoose.Types.ObjectId.isValid(projectId)) return { project: null, demo: false };
  const p = (await Project.findOne({
    _id: projectId,
    organizationId,
  }).lean()) as unknown as LeanProject | null;
  if (!p) return { project: null, demo: false };

  const latest = await WeeklyScore.findOne({ projectId: p._id }).sort({ week: -1 }).lean();
  const project = latest ? await buildRanProject(p, latest.week) : buildPendingProject(p);
  if (project) {
    const cid = p.clientId ? p.clientId.toString() : null;
    project.clientId = cid;
    if (cid) {
      const c = (await Client.findById(cid).select("name").lean()) as unknown as
        | { name: string }
        | null;
      project.clientName = c?.name ?? null;
    }
  }
  return { project, demo: false };
}
