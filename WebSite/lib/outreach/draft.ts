/**
 * Outreach draft generation. Turns a "source à conquérir" (a domain the engines
 * cite but that ignores the brand) into a short, honest editorial mention
 * request, grounded in the project's GEO data. Human-in-the-loop: this only
 * prepares a draft the user reviews, edits and sends themselves.
 *
 * With an LLM key the draft is actually written by the model; otherwise
 * `generateOutreachDraft` returns a deterministic template built from the same
 * data and marks it `mock: true`, so the UI can label it honestly.
 */
import type { LLMId } from "@/lib/monitoring/types";
import { generateText } from "@/lib/llm/generate";

const ENGINE_LABEL: Record<LLMId, string> = {
  chatgpt: "ChatGPT",
  claude: "Claude",
  perplexity: "Perplexity",
  gemini: "Gemini",
};

export interface OutreachContext {
  brandName: string;
  websiteUrl: string;
  category: string;
  domain: string;
  sampleUrl: string;
  engines: LLMId[];
  citations: number;
}

export interface OutreachDraft {
  subject: string;
  body: string;
  mock: boolean;
  provider?: LLMId;
}

/**
 * Priority heuristic (0-100): how many prompts the source is cited on, weighted
 * by how many engines rely on it. Higher = more leverage if the brand earns a
 * mention there.
 */
export function relevanceScore(citations: number, engines: LLMId[]): number {
  const enginesCoverage = new Set(engines).size; // 0-4
  const raw = citations * 12 + enginesCoverage * 12;
  return Math.max(1, Math.min(100, Math.round(raw)));
}

function enginesPhrase(engines: LLMId[]): string {
  const labels = engines.map((e) => ENGINE_LABEL[e]);
  if (labels.length === 0) return "les moteurs de réponse IA";
  if (labels.length === 1) return labels[0] as string;
  return `${labels.slice(0, -1).join(", ")} et ${labels[labels.length - 1]}`;
}

function origin(websiteUrl: string): string {
  try {
    return new URL(websiteUrl).origin;
  } catch {
    const trimmed = websiteUrl.replace(/\/+$/, "");
    return /^https?:\/\//.test(trimmed) ? trimmed : `https://${trimmed}`;
  }
}

const SYSTEM =
  "Tu es un consultant GEO francophone qui rédige une demande de mention " +
  "éditoriale honnête à un site tiers. Ton bref, professionnel, sans fausse " +
  "familiarité ni flatterie. Jamais de promesse trompeuse. N'utilise jamais de " +
  "tiret cadratin. Réponds STRICTEMENT au format :\nObjet: <objet>\n<corps de l'email>";

function buildUser(ctx: OutreachContext): string {
  return (
    `Rédige une demande de mention pour la marque « ${ctx.brandName} » ` +
    `(${ctx.category || "activité non précisée"}, site ${origin(ctx.websiteUrl)}) ` +
    `adressée à la rédaction du site ${ctx.domain}.\n` +
    `Contexte factuel : ${ctx.domain} est cité par ${enginesPhrase(ctx.engines)} ` +
    `sur des requêtes de cette catégorie, mais ne mentionne pas encore ${ctx.brandName}.\n` +
    `L'email doit : expliquer pourquoi ${ctx.brandName} mérite d'y figurer (valeur pour ` +
    `leurs lecteurs), rester court (moins de 140 mots), proposer des éléments concrets ` +
    `(lien, informations), et indiquer poliment l'origine du contact. Pas de pièce jointe.`
  );
}

/** Deterministic template used when no LLM key is configured. */
export function buildMockDraft(ctx: OutreachContext): { subject: string; body: string } {
  const subject = `Suggestion : ajouter ${ctx.brandName} à votre sélection ${ctx.category || ""}`.trim();
  const body = [
    `Bonjour,`,
    ``,
    `Je vous contacte au sujet de vos contenus autour de ${ctx.category || "votre thématique"}, ` +
      `que ${enginesPhrase(ctx.engines)} citent régulièrement comme référence.`,
    ``,
    `${ctx.brandName} (${origin(ctx.websiteUrl)}) est un acteur pertinent de ce domaine qui ` +
      `n'apparaît pas encore dans votre page. Il pourrait utilement compléter votre sélection ` +
      `pour vos lecteurs qui comparent les options.`,
    ``,
    `Je reste à disposition pour vous fournir des informations, des chiffres ou un lien à jour ` +
      `si cela vous est utile. Vous décidez librement de l'opportunité de l'ajouter.`,
    ``,
    `Bien à vous,`,
    `L'équipe ${ctx.brandName}`,
    ``,
    `(Ce message vous est adressé car ${ctx.domain} traite ce sujet ; répondez STOP si vous ne ` +
      `souhaitez pas être recontacté.)`,
  ].join("\n");
  return { subject, body };
}

/** Parse "Objet: ...\n<body>" from a model response, tolerant to variations. */
function parseSubjectBody(text: string): { subject: string; body: string } | null {
  const trimmed = text.trim();
  const m = trimmed.match(/^\s*(?:objet|subject)\s*:\s*(.+?)\r?\n([\s\S]+)$/i);
  if (m && m[1] && m[2]) return { subject: m[1].trim(), body: m[2].trim() };
  return null;
}

/**
 * Produce one outreach draft. Uses a real LLM when a key is set; otherwise the
 * deterministic template (flagged `mock: true`).
 */
export async function generateOutreachDraft(ctx: OutreachContext): Promise<OutreachDraft> {
  const mock = buildMockDraft(ctx);
  const result = await generateText(SYSTEM, buildUser(ctx));

  if (result.mock || !result.text) {
    return { subject: mock.subject, body: mock.body, mock: true };
  }
  const parsed = parseSubjectBody(result.text);
  if (!parsed) {
    // Model did not follow the format: keep its text as body, template subject.
    return { subject: mock.subject, body: result.text.trim(), mock: false, provider: result.provider };
  }
  return { subject: parsed.subject, body: parsed.body, mock: false, provider: result.provider };
}
