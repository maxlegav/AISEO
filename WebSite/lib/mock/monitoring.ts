/**
 * Mock data for the GEO monitoring product prototype (SYB v2).
 *
 * This is a front-end-only maquette: no backend, no real LLM calls, no DB.
 * The shape mirrors the SYB v2 data model (Project / LLMResult / WeeklyScore /
 * Source) so it can be wired to Supabase later without reworking the UI.
 */

import type { MeasuredImpact } from "@/lib/monitoring/measured-impact";

// Single source of truth for the engine list lives in lib/monitoring/types.ts;
// re-exported here so UI code keeps importing it from one place.
export type { LLMId } from "@/lib/monitoring/types";
import type { LLMId } from "@/lib/monitoring/types";

export interface LLMMeta {
  id: LLMId;
  name: string;
  logo: string;
  color: string;
  /** How this engine sources its answers, drives per-LLM explanations. */
  bias: string;
}

export const LLMS: Record<LLMId, LLMMeta> = {
  chatgpt: {
    id: "chatgpt",
    name: "ChatGPT",
    logo: "/logos/openai-logo.svg",
    color: "#10a37f",
    bias: "S'appuie sur Bing. Hors du top Bing sur une requête = non cité.",
  },
  claude: {
    id: "claude",
    name: "Claude",
    logo: "/logos/claude-logo.svg",
    color: "#d97757",
    bias: "Cite Reddit, Quora et les forums 2 à 4× plus que les autres.",
  },
  perplexity: {
    id: "perplexity",
    name: "Perplexity",
    logo: "/logos/perplexity-logo.svg",
    color: "#20808d",
    bias: "Favorise les sources récentes à fort trafic. Contenu daté = invisible.",
  },
  gemini: {
    id: "gemini",
    name: "Gemini",
    logo: "/logos/gemini-logo.svg",
    color: "#4285f4",
    bias: "Favorise les propriétés Google (YouTube, SGE). Une vidéo YouTube aide.",
  },
};

export const LLM_ORDER: LLMId[] = ["chatgpt", "perplexity", "claude", "gemini"];

export interface LLMScore {
  llm: LLMId;
  /** % of prompts where the brand is cited, 0-100. */
  presenceRate: number;
  /** Average position when cited (1 = first mentioned). null if never cited. */
  avgPosition: number | null;
  /** Change in presence rate vs. previous week (percentage points). */
  deltaVsLastWeek: number;
  /** Short, model-specific explanation of the score. */
  explanation: string;
}

export interface WeeklyPoint {
  week: string; // e.g. "S-11" … "S0"
  chatgpt: number;
  claude: number;
  perplexity: number;
  gemini: number;
  global: number;
}

export interface CompetitorRow {
  name: string;
  isYou?: boolean;
  global: number;
  scores: Record<LLMId, number>;
  trend: number; // delta vs last week on global
}

export interface SourceRow {
  domain: string;
  url: string;
  llms: LLMId[];
  citesBrand: boolean;
  citations: number; // how many prompts it appeared on
}

export interface Recommendation {
  llm: LLMId;
  priority: "high" | "medium" | "low";
  title: string;
  detail: string;
}

export type Priority = "high" | "medium" | "low";

/** Per-prompt visibility breakdown: the core of the recommendations page. */
export interface PromptInsight {
  prompt: string;
  status: "won" | "partial" | "lost";
  /** Engines that cite the brand on this prompt. */
  enginesCiting: LLMId[];
  /** Configured engines that answered but did NOT cite the brand. */
  enginesMissing: LLMId[];
  /** Competitors cited on this prompt while the brand is absent. */
  competitorsAhead: string[];
  /** Sources the engines cited on this prompt where the brand is absent. */
  winningSources: { domain: string; url: string }[];
  /** Concrete, prompt-specific action. */
  action: string;
  /** Estimated global score points if the brand wins every missing engine here. */
  potential: number;
}

/** A high-authority source that the engines cite but that never mentions the brand. */
export interface SourceTarget {
  domain: string;
  sampleUrl: string;
  citations: number;
  engines: LLMId[];
}

/** A single prioritized action in the action plan. */
export interface ActionItem {
  id: string;
  title: string;
  detail: string;
  priority: Priority;
  /** Estimated global score points. */
  impact: number;
  effort: "Faible" | "Moyen" | "Élevé";
  engines: LLMId[];
  category: "content" | "sources" | "technical" | "engine";
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface RobotsBotStatus {
  bot: string;
  allowed: boolean;
}

export type OnPageStatus = "ok" | "warn" | "missing";

/** One checked on-page GEO signal (title, meta, H1, JSON-LD, OpenGraph...). */
export interface OnPageItem {
  label: string;
  status: OnPageStatus;
  detail: string;
}

/** Result of scanning the live home page HTML. */
export interface OnPageScan {
  scanned: boolean;
  title: string | null;
  metaDescription: string | null;
  h1: string | null;
  jsonLdTypes: string[];
  hasFaqSchema: boolean;
  hasOrganizationSchema: boolean;
  openGraph: boolean;
  items: OnPageItem[];
}

/** State of the site's own /llms.txt vs. the recommended one. */
export interface LlmsTxtStatus {
  found: boolean;
  complete: boolean;
  missing: string[];
  note: string;
}

/** Technical GEO deliverables (llms.txt, robots.txt, sitemap, FAQ, descriptions). */
export interface TechnicalGeo {
  llmsTxt: string;
  robots: {
    checked: boolean;
    reachable: boolean;
    bots: RobotsBotStatus[];
    patch: string;
    note: string;
  };
  sitemap: {
    checked: boolean;
    found: boolean;
    url: string;
    note: string;
  };
  faq: FaqItem[];
  faqJsonLd: string;
  descriptions: {
    metaDescription: string;
    sentenceDescriptors: string[];
  };
  /** State of the site's own /llms.txt (live fetch), if checked. */
  llmsTxtStatus?: LlmsTxtStatus;
  /** On-page scan of the live home page (title/meta/H1/JSON-LD/OpenGraph). */
  onPage?: OnPageScan;
}

export interface Project {
  id: string;
  brandName: string;
  websiteUrl: string;
  category: string;
  competitors: string[];
  prompts: number;
  frequency: "Hebdomadaire" | "Quotidien";
  globalScore: number;
  globalDelta: number;
  llmScores: LLMScore[];
  weekly: WeeklyPoint[];
  competitorTable: CompetitorRow[];
  sources: SourceRow[];
  recommendations: Recommendation[];
  /** Per-prompt visibility breakdown (data-driven recommendations). */
  promptInsights?: PromptInsight[];
  /** High-authority sources to earn a mention on. */
  sourceTargets?: SourceTarget[];
  /** Prioritized action plan with estimated impact/effort. */
  actionPlan?: ActionItem[];
  /** Technical GEO deliverables (llms.txt, robots.txt, sitemap, FAQ, descriptions). */
  technical?: TechnicalGeo;
  /** Observed week-over-week movement of the scores (real data, not heuristic). */
  measuredImpact?: MeasuredImpact;
  /** True when this project is backed by real monitoring data (not the demo). */
  isReal?: boolean;
  /** True for a real project that has no run yet (show onboarding state). */
  pendingFirstRun?: boolean;
  /** Client this project is grouped under (SYB v2 multi-tenant), if any. */
  clientId?: string | null;
  clientName?: string | null;
}

/** Deterministic 12-week series builder around a target end value per LLM. */
function buildWeekly(
  ends: Record<LLMId, number>,
  starts: Record<LLMId, number>
): WeeklyPoint[] {
  const points: WeeklyPoint[] = [];
  const wiggle = [0, 3, -2, 4, -3, 2, 5, -1, 3, -2, 1, 0];
  for (let i = 0; i < 12; i++) {
    const t = i / 11;
    const val = (llm: LLMId) => {
      const base = starts[llm] + (ends[llm] - starts[llm]) * t;
      const w = i === 11 ? 0 : wiggle[i] ?? 0;
      return Math.max(0, Math.min(100, Math.round(base + w)));
    };
    const c = val("chatgpt");
    const cl = val("claude");
    const p = val("perplexity");
    const g = val("gemini");
    points.push({
      week: i === 11 ? "S0" : `S-${11 - i}`,
      chatgpt: c,
      claude: cl,
      perplexity: p,
      gemini: g,
      global: Math.round((c + cl + p + g) / 4),
    });
  }
  return points;
}

export const PROJECTS: Project[] = [
  {
    id: "linkflow",
    brandName: "Linkflow",
    websiteUrl: "linkflow.io",
    category: "SaaS B2B, automatisation commerciale",
    competitors: ["Salesloft", "Lemlist", "Waalaxy"],
    prompts: 24,
    frequency: "Quotidien",
    globalScore: 46,
    globalDelta: 6,
    llmScores: [
      {
        llm: "perplexity",
        presenceRate: 79,
        avgPosition: 1.8,
        deltaVsLastWeek: 8,
        explanation:
          "Fort : vos pages produit récentes et bien référencées sont reprises telles quelles. Perplexity vous cite en 1re ou 2e position sur la majorité des requêtes.",
      },
      {
        llm: "chatgpt",
        presenceRate: 54,
        avgPosition: 2.6,
        deltaVsLastWeek: 5,
        explanation:
          "Moyen : vous ressortez sur les requêtes de marque mais pas sur les requêtes génériques. Améliorez votre présence Bing sur ces mots-clés pour progresser.",
      },
      {
        llm: "gemini",
        presenceRate: 33,
        avgPosition: 3.1,
        deltaVsLastWeek: 4,
        explanation:
          "Faible : Gemini privilégie YouTube et les propriétés Google. Vous n'avez aucune vidéo indexée sur ces requêtes, c'est le principal frein.",
      },
      {
        llm: "claude",
        presenceRate: 17,
        avgPosition: 3.4,
        deltaVsLastWeek: -2,
        explanation:
          "Critique : Claude s'appuie beaucoup sur Reddit et les forums, où votre marque est absente. Aucune discussion ne vous mentionne sur votre catégorie.",
      },
    ],
    weekly: buildWeekly(
      { chatgpt: 54, claude: 17, perplexity: 79, gemini: 33 },
      { chatgpt: 41, claude: 22, perplexity: 55, gemini: 20 }
    ),
    competitorTable: [
      {
        name: "Linkflow",
        isYou: true,
        global: 46,
        trend: 6,
        scores: { chatgpt: 54, claude: 17, perplexity: 79, gemini: 33 },
      },
      {
        name: "Lemlist",
        global: 61,
        trend: 2,
        scores: { chatgpt: 68, claude: 44, perplexity: 74, gemini: 58 },
      },
      {
        name: "Salesloft",
        global: 52,
        trend: -3,
        scores: { chatgpt: 63, claude: 38, perplexity: 61, gemini: 46 },
      },
      {
        name: "Waalaxy",
        global: 39,
        trend: 1,
        scores: { chatgpt: 47, claude: 29, perplexity: 52, gemini: 28 },
      },
    ],
    sources: [
      {
        domain: "reddit.com",
        url: "reddit.com/r/sales",
        llms: ["claude", "perplexity"],
        citesBrand: false,
        citations: 14,
      },
      {
        domain: "g2.com",
        url: "g2.com/categories/sales-engagement",
        llms: ["chatgpt", "perplexity", "gemini"],
        citesBrand: true,
        citations: 11,
      },
      {
        domain: "linkflow.io",
        url: "linkflow.io/blog",
        llms: ["perplexity", "chatgpt"],
        citesBrand: true,
        citations: 9,
      },
      {
        domain: "youtube.com",
        url: "youtube.com/results?sales+automation",
        llms: ["gemini"],
        citesBrand: false,
        citations: 8,
      },
      {
        domain: "capterra.fr",
        url: "capterra.fr/directory/sales",
        llms: ["chatgpt", "gemini"],
        citesBrand: true,
        citations: 6,
      },
      {
        domain: "quora.com",
        url: "quora.com/best-sales-tools",
        llms: ["claude"],
        citesBrand: false,
        citations: 5,
      },
    ],
    recommendations: [
      {
        llm: "claude",
        priority: "high",
        title: "Gagnez en présence sur Reddit et Quora",
        detail:
          "Claude cite r/sales et Quora sur 19 de vos requêtes, sans jamais vous mentionner. Répondez de façon utile (non promotionnelle) à 3 threads clés cette semaine pour amorcer des citations Claude.",
      },
      {
        llm: "gemini",
        priority: "high",
        title: "Publiez une vidéo YouTube sur votre catégorie",
        detail:
          "Gemini remonte YouTube sur 8 requêtes. Une démo produit de 3 min optimisée sur « automatisation commerciale » vous rendrait éligible aux citations Gemini.",
      },
      {
        llm: "chatgpt",
        priority: "medium",
        title: "Renforcez votre présence Bing sur 6 requêtes génériques",
        detail:
          "ChatGPT suit Bing. Vous êtes absent du top Bing sur les requêtes non-marque. Créez/optimisez des pages ciblées pour ces 6 requêtes où un concurrent vous devance.",
      },
    ],
  },
  {
    id: "atelier-moreau",
    brandName: "Atelier Moreau",
    websiteUrl: "atelier-moreau.fr",
    category: "E-commerce, mobilier artisanal",
    competitors: ["Made.com", "Tikamoon", "Maisons du Monde"],
    prompts: 18,
    frequency: "Hebdomadaire",
    globalScore: 31,
    globalDelta: -4,
    llmScores: [
      {
        llm: "chatgpt",
        presenceRate: 44,
        avgPosition: 2.9,
        deltaVsLastWeek: -1,
        explanation:
          "Moyen : cité sur les requêtes de marque uniquement. Absent des requêtes « meuble artisanal français » où la demande est forte.",
      },
      {
        llm: "perplexity",
        presenceRate: 38,
        avgPosition: 2.4,
        deltaVsLastWeek: -3,
        explanation:
          "En baisse : vos fiches produit datent. Perplexity privilégie le contenu récent, rafraîchissez vos pages phares pour regagner en visibilité.",
      },
      {
        llm: "gemini",
        presenceRate: 22,
        avgPosition: 3.2,
        deltaVsLastWeek: -2,
        explanation:
          "Faible : aucune présence YouTube / Google Shopping structurée sur vos gammes principales.",
      },
      {
        llm: "claude",
        presenceRate: 11,
        avgPosition: 3.6,
        deltaVsLastWeek: -1,
        explanation:
          "Critique : quasi aucune mention sur les forums déco / Reddit FR que Claude privilégie.",
      },
    ],
    weekly: buildWeekly(
      { chatgpt: 44, claude: 11, perplexity: 38, gemini: 22 },
      { chatgpt: 49, claude: 15, perplexity: 47, gemini: 27 }
    ),
    competitorTable: [
      {
        name: "Atelier Moreau",
        isYou: true,
        global: 31,
        trend: -4,
        scores: { chatgpt: 44, claude: 11, perplexity: 38, gemini: 22 },
      },
      {
        name: "Tikamoon",
        global: 57,
        trend: 3,
        scores: { chatgpt: 64, claude: 41, perplexity: 66, gemini: 55 },
      },
      {
        name: "Maisons du Monde",
        global: 72,
        trend: 1,
        scores: { chatgpt: 78, claude: 59, perplexity: 74, gemini: 76 },
      },
      {
        name: "Made.com",
        global: 41,
        trend: -2,
        scores: { chatgpt: 52, claude: 28, perplexity: 44, gemini: 39 },
      },
    ],
    sources: [
      {
        domain: "maisonsdumonde.com",
        url: "maisonsdumonde.com/FR",
        llms: ["chatgpt", "gemini", "perplexity"],
        citesBrand: false,
        citations: 12,
      },
      {
        domain: "reddit.com",
        url: "reddit.com/r/BuyItForLife",
        llms: ["claude"],
        citesBrand: false,
        citations: 7,
      },
      {
        domain: "atelier-moreau.fr",
        url: "atelier-moreau.fr/collections",
        llms: ["perplexity"],
        citesBrand: true,
        citations: 5,
      },
      {
        domain: "journaldesfemmes.fr",
        url: "journaldesfemmes.fr/deco",
        llms: ["chatgpt", "perplexity"],
        citesBrand: true,
        citations: 4,
      },
    ],
    recommendations: [
      {
        llm: "perplexity",
        priority: "high",
        title: "Rafraîchissez vos 8 fiches produit phares",
        detail:
          "Perplexity a fait chuter votre présence de 9 pts en 3 semaines car votre contenu est daté. Mettez à jour titres, descriptions et dates de vos best-sellers.",
      },
      {
        llm: "chatgpt",
        priority: "high",
        title: "Créez une page « mobilier artisanal français »",
        detail:
          "Vous êtes invisible sur cette requête à forte intention. Une page catégorie optimisée vous rendrait éligible aux citations ChatGPT via Bing.",
      },
      {
        llm: "gemini",
        priority: "medium",
        title: "Structurez vos gammes en Google Shopping",
        detail:
          "Aucune de vos gammes n'apparaît dans les résultats produits Google que Gemini réutilise. Ajoutez le balisage produit/prix sur vos collections.",
      },
    ],
  },
];

export function getProject(id: string): Project | undefined {
  return PROJECTS.find((p) => p.id === id);
}

export function priorityLabel(p: Recommendation["priority"]): string {
  return p === "high" ? "Urgent" : p === "medium" ? "Important" : "À optimiser";
}
