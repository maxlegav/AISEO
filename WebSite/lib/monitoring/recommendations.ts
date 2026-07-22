/**
 * Data-driven GEO recommendations for SYB v2.
 *
 * Everything here is pure and derived from stored monitoring data
 * (LLMResult rows, MonitoredSource rows, competitors). No hardcoded advice:
 * each recommendation references the actual prompt, competitor or source that
 * produced it, so the page reads like a real consultant's action plan rather
 * than generic tips.
 */
import {
  LLMS,
  LLM_ORDER,
  type LLMId,
  type PromptInsight,
  type SourceTarget,
  type ActionItem,
  type SourceRow,
  type FaqItem,
  type TechnicalGeo,
  type RobotsBotStatus,
} from "@/lib/mock/monitoring";
import { detectBrand } from "@/lib/monitoring/brand-detection";
import { domainOf } from "@/lib/monitoring/source-extraction";

/** One stored engine answer to one prompt (subset of LLMResult we need). */
export interface ResultRow {
  prompt: string;
  llm: LLMId;
  brandMentioned: boolean;
  responseText: string;
  sourcesCited: string[];
}

function labelEngines(engines: LLMId[]): string {
  const names = engines.map((e) => LLMS[e].name);
  if (names.length <= 1) return names.join("");
  return `${names.slice(0, -1).join(", ")} et ${names[names.length - 1]}`;
}

/**
 * Break every tracked prompt down into who cites the brand, who doesn't, which
 * competitor wins instead and which source the engine leaned on.
 */
export function analyzePrompts(
  results: ResultRow[],
  competitors: string[],
): PromptInsight[] {
  const prompts = Array.from(new Set(results.map((r) => r.prompt)));
  const promptCount = prompts.length || 1;
  const enginesPerPrompt = new Set(results.map((r) => r.llm)).size || LLM_ORDER.length;

  const insights: PromptInsight[] = prompts.map((prompt) => {
    // A prompt can have several results per engine (multiple runs in the same
    // week). Keep the latest row per engine so each engine is counted once.
    const latestByEngine = new Map<LLMId, ResultRow>();
    for (const r of results) {
      if (r.prompt === prompt) latestByEngine.set(r.llm, r);
    }
    const rows = LLM_ORDER.filter((llm) => latestByEngine.has(llm)).map(
      (llm) => latestByEngine.get(llm)!,
    );
    const enginesCiting = rows.filter((r) => r.brandMentioned).map((r) => r.llm);
    const enginesMissing = rows.filter((r) => !r.brandMentioned).map((r) => r.llm);
    const absentRows = rows.filter((r) => !r.brandMentioned);

    // Competitors that appear where the brand is absent.
    const competitorsAhead = competitors.filter((c) =>
      absentRows.some((r) => detectBrand(r.responseText, c).found),
    );

    // Sources the engines cited on the prompts we don't win.
    const sourceMap = new Map<string, string>();
    for (const r of absentRows) {
      for (const url of r.sourcesCited) {
        const d = domainOf(url);
        if (d && !sourceMap.has(d)) sourceMap.set(d, url);
      }
    }
    const winningSources = Array.from(sourceMap.entries())
      .slice(0, 3)
      .map(([domain, url]) => ({ domain, url }));

    const status: PromptInsight["status"] =
      enginesMissing.length === 0
        ? "won"
        : enginesCiting.length === 0
          ? "lost"
          : "partial";

    // Winning one engine on one prompt lifts that engine by 100/promptCount
    // points; global is the mean across engines.
    const potential = Math.round(
      (enginesMissing.length * (100 / promptCount)) / enginesPerPrompt,
    );

    const topSourceDomain = winningSources[0]?.domain;
    const topCompetitor = competitorsAhead[0];

    let action: string;
    if (status === "won") {
      action = `Vous êtes cité par tous les moteurs sur cette requête. Maintenez la page qui vous fait gagner et surveillez les concurrents.`;
    } else if (topCompetitor && topSourceDomain) {
      action = `${labelEngines(enginesMissing)} cite ${topCompetitor} via ${topSourceDomain}. Obtenez une mention sur ${topSourceDomain} (et publiez une page dédiée à cette requête) pour passer devant.`;
    } else if (winningSources.length > 0) {
      action = `${labelEngines(enginesMissing)} s'appuie sur ${winningSources.map((s) => s.domain).join(", ")}, qui ne vous mentionne pas. Visez une citation sur ces pages et créez un contenu ciblé sur cette requête.`;
    } else if (competitorsAhead.length > 0) {
      action = `${labelEngines(enginesMissing)} cite ${competitorsAhead.join(", ")} mais pas vous. Créez une page qui répond précisément à cette requête pour devenir citable.`;
    } else {
      action = `Aucune marque du secteur n'est clairement citée par ${labelEngines(enginesMissing)}. C'est une requête à prendre : publiez le contenu de référence sur ce sujet.`;
    }

    return {
      prompt,
      status,
      enginesCiting,
      enginesMissing,
      competitorsAhead,
      winningSources,
      action,
      potential,
    };
  });

  // Closest-to-win first: partial before lost, then by potential.
  const rank = { partial: 0, lost: 1, won: 2 };
  return insights.sort((a, b) => {
    if (rank[a.status] !== rank[b.status]) return rank[a.status] - rank[b.status];
    return b.potential - a.potential;
  });
}

/** High-authority sources the engines cite that never mention the brand. */
export function buildSourceTargets(sources: SourceRow[]): SourceTarget[] {
  return sources
    .filter((s) => !s.citesBrand)
    .sort((a, b) => b.citations - a.citations)
    .slice(0, 8)
    .map((s) => ({
      domain: s.domain,
      sampleUrl: s.url,
      citations: s.citations,
      engines: s.llms,
    }));
}

/**
 * Prioritized action plan: merges the biggest prompt gaps, source-acquisition
 * targets and the weakest engine into a single ranked to-do list.
 */
export function buildActionPlan(
  insights: PromptInsight[],
  sourceTargets: SourceTarget[],
  llmScores: { llm: LLMId; presenceRate: number }[],
): ActionItem[] {
  const items: ActionItem[] = [];

  // 1) Closest prompt to win (partial, highest potential).
  const closest = insights.find((i) => i.status === "partial");
  if (closest) {
    items.push({
      id: "prompt-closest",
      title: `Gagnez la requête « ${closest.prompt} »`,
      detail: closest.action,
      priority: "high",
      impact: Math.max(1, closest.potential),
      effort: "Moyen",
      engines: closest.enginesMissing,
      category: "content",
    });
  }

  // 2) Most-cited source that ignores the brand.
  const topSource = sourceTargets[0];
  if (topSource) {
    items.push({
      id: "source-top",
      title: `Obtenez une mention sur ${topSource.domain}`,
      detail: `${topSource.domain} est cité par ${labelEngines(topSource.engines)} sur ${topSource.citations} requête(s) de votre catégorie, sans jamais vous mentionner. Une présence sur cette page vous rendrait citable sur ces requêtes.`,
      priority: "high",
      impact: Math.min(15, topSource.citations * 3),
      effort: "Moyen",
      engines: topSource.engines,
      category: "sources",
    });
  }

  // 3) Weakest engine: a structural push.
  const weakest = [...llmScores].sort((a, b) => a.presenceRate - b.presenceRate)[0];
  if (weakest) {
    items.push({
      id: `engine-${weakest.llm}`,
      title: `Rattrapez votre retard sur ${LLMS[weakest.llm].name} (${weakest.presenceRate}%)`,
      detail: `${LLMS[weakest.llm].name} : ${LLMS[weakest.llm].bias} Adaptez votre stratégie de contenu à ce biais pour remonter.`,
      priority: weakest.presenceRate < 25 ? "high" : "medium",
      impact: Math.round((100 - weakest.presenceRate) / 8),
      effort: "Élevé",
      engines: [weakest.llm],
      category: "engine",
    });
  }

  // 4) A lost prompt (nobody cites you): greenfield content.
  const lost = insights.find((i) => i.status === "lost");
  if (lost) {
    items.push({
      id: "prompt-lost",
      title: `Créez le contenu de référence pour « ${lost.prompt} »`,
      detail: lost.action,
      priority: "medium",
      impact: Math.max(1, lost.potential),
      effort: "Élevé",
      engines: lost.enginesMissing,
      category: "content",
    });
  }

  // 5) Technical baseline: always worth doing, low effort.
  items.push({
    id: "technical-baseline",
    title: "Publiez llms.txt et ouvrez robots.txt aux crawlers IA",
    detail:
      "Exposez un llms.txt décrivant votre marque et vos pages clés, autorisez GPTBot / ClaudeBot / PerplexityBot / Google-Extended dans robots.txt, et ajoutez un bloc FAQ balisé. Fondations rapides pour devenir citable.",
    priority: "medium",
    impact: 4,
    effort: "Faible",
    engines: LLM_ORDER,
    category: "technical",
  });

  const order = { high: 0, medium: 1, low: 2 };
  return items.sort((a, b) => {
    if (order[a.priority] !== order[b.priority]) {
      return order[a.priority] - order[b.priority];
    }
    return b.impact - a.impact;
  });
}

// ---------------------------------------------------------------------------
// Technical GEO deliverables
// ---------------------------------------------------------------------------

const AI_BOTS = [
  "GPTBot",
  "OAI-SearchBot",
  "ClaudeBot",
  "PerplexityBot",
  "Google-Extended",
];

function siteOrigin(websiteUrl: string): string {
  try {
    return new URL(websiteUrl).origin;
  } catch {
    return websiteUrl.replace(/\/+$/, "");
  }
}

export function buildLlmsTxt(
  brandName: string,
  websiteUrl: string,
  category: string,
  topSourceUrls: string[],
): string {
  const origin = siteOrigin(websiteUrl);
  const lines = [
    `# ${brandName}`,
    "",
    `> ${brandName}${category ? ` · ${category}` : ""}.`,
    "",
    "## À propos",
    `- ${brandName} : ${category || "présentez ici votre activité en une phrase claire et factuelle."}`,
    `- Site officiel : ${origin}`,
    "",
    "## Pages clés",
  ];
  const pages = topSourceUrls
    .filter((u) => domainOf(u) === domainOf(websiteUrl))
    .slice(0, 6);
  if (pages.length) {
    for (const p of pages) lines.push(`- ${p}`);
  } else {
    lines.push(`- ${origin}/ (accueil)`);
    lines.push(`- ${origin}/faq`);
  }
  return lines.join("\n");
}

interface RobotGroup {
  agents: string[];
  rules: { type: "allow" | "disallow"; path: string }[];
}

/**
 * Parse robots.txt into groups. Consecutive `User-agent:` lines share the
 * following rule block (per the robots.txt spec); a new group starts when a
 * `User-agent:` line appears after a rule line.
 */
function parseRobotGroups(robotsText: string): RobotGroup[] {
  const groups: RobotGroup[] = [];
  let current: RobotGroup | null = null;
  for (const raw of robotsText.split(/\r?\n/)) {
    const line = raw.replace(/#.*$/, "").trim();
    if (!line) continue;
    const ci = line.indexOf(":");
    if (ci === -1) continue;
    const field = line.slice(0, ci).trim().toLowerCase();
    const value = line.slice(ci + 1).trim();
    if (field === "user-agent") {
      if (!current || current.rules.length > 0) {
        current = { agents: [], rules: [] };
        groups.push(current);
      }
      current.agents.push(value.toLowerCase());
    } else if (field === "allow" || field === "disallow") {
      if (!current) {
        current = { agents: ["*"], rules: [] };
        groups.push(current);
      }
      current.rules.push({ type: field, path: value });
    }
  }
  return groups;
}

/** Most specific applicable group for a bot: exact match, else the `*` group. */
function groupForBot(groups: RobotGroup[], bot: string): RobotGroup | null {
  const b = bot.toLowerCase();
  let wildcard: RobotGroup | null = null;
  for (const g of groups) {
    if (g.agents.includes(b)) return g;
    if (g.agents.includes("*")) wildcard = g;
  }
  return wildcard;
}

/** Whether the group lets a crawler reach the site root ("/"). */
function allowsRoot(group: RobotGroup | null): boolean {
  if (!group) return true;
  let disallowRoot = false;
  let allowRoot = false;
  for (const r of group.rules) {
    if (r.type === "disallow" && r.path === "/") disallowRoot = true;
    if (r.type === "allow" && (r.path === "/" || r.path === "")) allowRoot = true;
  }
  return !disallowRoot || allowRoot;
}

export function analyzeRobots(
  robotsText: string | null,
  reachable: boolean,
): TechnicalGeo["robots"] {
  if (!reachable || robotsText === null) {
    return {
      checked: reachable,
      reachable,
      bots: AI_BOTS.map((bot) => ({ bot, allowed: false })),
      patch: robotsPatch(),
      note: "robots.txt non récupéré : ajoutez le bloc ci-dessous pour autoriser explicitement les crawlers IA.",
    };
  }

  const groups = parseRobotGroups(robotsText);
  const bots: RobotsBotStatus[] = AI_BOTS.map((bot) => ({
    bot,
    allowed: allowsRoot(groupForBot(groups, bot)),
  }));

  const blocked = bots.filter((b) => !b.allowed);
  return {
    checked: true,
    reachable: true,
    bots,
    patch: robotsPatch(),
    note: blocked.length
      ? `${blocked.map((b) => b.bot).join(", ")} bloqué(s) ou non autorisé(s). Ajoutez le bloc ci-dessous.`
      : "Tous les crawlers IA suivis sont autorisés. ✔",
  };
}

function robotsPatch(): string {
  return AI_BOTS.map((bot) => `User-agent: ${bot}\nAllow: /`).join("\n\n");
}

export function buildFaq(
  brandName: string,
  category: string,
  prompts: string[],
): FaqItem[] {
  return prompts.slice(0, 6).map((prompt) => {
    const question = /\?$/.test(prompt.trim()) ? prompt.trim() : `${prompt.trim()} ?`;
    return {
      question,
      answer: `${brandName}${category ? `, ${category.toLowerCase()},` : ""} répond à ce besoin. Décrivez ici, en 2-3 phrases factuelles, en quoi ${brandName} est la réponse pertinente à « ${prompt.trim()} » : les moteurs IA reprennent volontiers ce format question/réponse.`,
    };
  });
}

export function buildFaqJsonLd(faq: FaqItem[]): string {
  const doc = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };
  return JSON.stringify(doc, null, 2);
}

export function buildDescriptions(
  brandName: string,
  category: string,
  competitors: string[],
): TechnicalGeo["descriptions"] {
  const cat = category || "votre activité";
  const metaDescription = `${brandName} : ${cat}. Découvrez ${brandName}, ses services et ce qui le distingue.`.slice(
    0,
    160,
  );
  const sentenceDescriptors = [
    `${brandName}, c'est : ${cat}.`,
    `${brandName} se distingue par la qualité de son offre et son positionnement premium.`,
    competitors.length
      ? `Souvent comparé à ${competitors.slice(0, 2).join(" et ")}, ${brandName} met en avant son expérience et sa réputation.`
      : `${brandName} est une référence reconnue dans sa catégorie.`,
    `Pour en savoir plus sur ${brandName}, consultez son site officiel et ses avis clients.`,
  ];
  return { metaDescription, sentenceDescriptors };
}

export function buildTechnicalGeo(params: {
  brandName: string;
  websiteUrl: string;
  category: string;
  competitors: string[];
  prompts: string[];
  topSourceUrls: string[];
  robotsText: string | null;
  robotsReachable: boolean;
  sitemapFound: boolean | null;
}): TechnicalGeo {
  const origin = siteOrigin(params.websiteUrl);
  const faq = buildFaq(params.brandName, params.category, params.prompts);
  const sitemapChecked = params.sitemapFound !== null;
  return {
    llmsTxt: buildLlmsTxt(
      params.brandName,
      params.websiteUrl,
      params.category,
      params.topSourceUrls,
    ),
    robots: analyzeRobots(params.robotsText, params.robotsReachable),
    sitemap: {
      checked: sitemapChecked,
      found: params.sitemapFound === true,
      url: `${origin}/sitemap.xml`,
      note:
        params.sitemapFound === true
          ? "Sitemap détecté. Vérifiez qu'il liste bien vos pages FAQ et de référence."
          : sitemapChecked
            ? "Aucun sitemap.xml détecté. Publiez-en un et déclarez-le dans robots.txt."
            : "Sitemap non vérifié. Assurez-vous d'exposer un sitemap.xml à jour.",
    },
    faq,
    faqJsonLd: buildFaqJsonLd(faq),
    descriptions: buildDescriptions(
      params.brandName,
      params.category,
      params.competitors,
    ),
  };
}
