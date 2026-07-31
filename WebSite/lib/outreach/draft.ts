/**
 * Outreach draft generation. Turns a "source à conquérir" (a domain the engines
 * cite but that ignores the brand) into a short, honest, channel-appropriate
 * action, grounded in the project's GEO data. Human-in-the-loop: this only
 * prepares a draft the user reviews, edits and sends/publishes themselves.
 *
 * The draft is tailored to the destination (see `lib/outreach/channel.ts`): an
 * editorial email for a personal site, a helpful comment for a Reddit thread or
 * Quora question, a listing-claim checklist for a G2/TripAdvisor page, etc.
 *
 * With an LLM key the draft is actually written by the model; otherwise
 * `generateOutreachDraft` returns a deterministic template built from the same
 * data and marks it `mock: true`, so the UI can label it honestly.
 */
import type { LLMId } from "@/lib/monitoring/types";
import { generateText } from "@/lib/llm/generate";
import { CHANNEL_META, type OutreachChannelKind } from "@/lib/outreach/channel";

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
  /** How to reach this source. Defaults to email. */
  channel?: OutreachChannelKind;
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

function channelOf(ctx: OutreachContext): OutreachChannelKind {
  return ctx.channel ?? "email";
}

const SYSTEM_BASE =
  "Tu es un consultant GEO francophone. Ton bref, professionnel, honnête, sans " +
  "fausse familiarité ni flatterie, jamais de promesse trompeuse. N'utilise " +
  "jamais de tiret cadratin.";

/** Channel-specific system prompt + expected output format. */
function systemFor(channel: OutreachChannelKind): string {
  if (CHANNEL_META[channel].usesEmail || channel === "contact_form") {
    return (
      `${SYSTEM_BASE} Tu rédiges une demande de mention éditoriale. Réponds ` +
      `STRICTEMENT au format :\nObjet: <objet>\n<corps du message>`
    );
  }
  return (
    `${SYSTEM_BASE} Tu rédiges un message à publier sur la plateforme indiquée ` +
    `(commentaire, réponse ou plan d'action), pas un email. Divulgue le lien avec ` +
    `la marque. Réponds uniquement avec le contenu à publier, sans objet.`
  );
}

function buildUser(ctx: OutreachContext): string {
  const channel = channelOf(ctx);
  const meta = CHANNEL_META[channel];
  const common =
    `Marque : « ${ctx.brandName} » (${ctx.category || "activité non précisée"}, ` +
    `site ${origin(ctx.websiteUrl)}).\n` +
    `Source à conquérir : ${ctx.domain} (page : ${ctx.sampleUrl || ctx.domain}), ` +
    `citée par ${enginesPhrase(ctx.engines)} sur des requêtes de cette catégorie ` +
    `mais ne mentionnant pas encore ${ctx.brandName}.\n` +
    `Canal : ${meta.label}. ${meta.howto}\n`;

  if (channel === "email" || channel === "contact_form") {
    return (
      common +
      `Rédige une demande de mention courte (moins de 140 mots) : pourquoi ` +
      `${ctx.brandName} mérite d'y figurer (valeur pour les lecteurs), propose des ` +
      `éléments concrets (lien, informations), indique poliment l'origine du contact.`
    );
  }
  if (channel === "review_platform" || channel === "listing") {
    return (
      common +
      `Rédige un court plan d'action (3 à 5 puces) pour que ${ctx.brandName} soit ` +
      `présent sur cette plateforme : revendiquer/créer la fiche, la compléter, ` +
      `obtenir des avis ou informations à jour. Pas d'email.`
    );
  }
  if (channel === "wikipedia") {
    return (
      common +
      `Rédige une suggestion neutre et sourcée à poster en page de discussion pour ` +
      `envisager d'ajouter ${ctx.brandName}, en rappelant les règles de neutralité. ` +
      `Pas de ton promotionnel.`
    );
  }
  return (
    common +
    `Rédige un message utile et non promotionnel à publier (moins de 120 mots) qui ` +
    `mentionne ${ctx.brandName} de façon pertinente et transparente, avec le lien ` +
    `${origin(ctx.websiteUrl)}.`
  );
}

/** Deterministic template used when no LLM key is configured, per channel. */
export function buildMockDraft(ctx: OutreachContext): { subject: string; body: string } {
  const channel = channelOf(ctx);
  const brandUrl = origin(ctx.websiteUrl);
  const cat = ctx.category || "votre thématique";
  const engines = enginesPhrase(ctx.engines);

  if (channel === "email" || channel === "contact_form") {
    const subject = `Suggestion : ajouter ${ctx.brandName} à votre sélection ${ctx.category || ""}`.trim();
    const via =
      channel === "contact_form"
        ? `(Message à envoyer via votre formulaire de contact. `
        : `(Ce message vous est adressé car ${ctx.domain} traite ce sujet ; `;
    const body = [
      `Bonjour,`,
      ``,
      `Je vous contacte au sujet de vos contenus autour de ${cat}, que ${engines} ` +
        `citent régulièrement comme référence.`,
      ``,
      `${ctx.brandName} (${brandUrl}) est un acteur pertinent de ce domaine qui ` +
        `n'apparaît pas encore dans votre page. Il pourrait utilement compléter votre ` +
        `sélection pour vos lecteurs qui comparent les options.`,
      ``,
      `Je reste à disposition pour vous fournir des informations, des chiffres ou un ` +
        `lien à jour si cela vous est utile. Vous décidez librement de l'opportunité ` +
        `de l'ajouter.`,
      ``,
      `Bien à vous,`,
      `L'équipe ${ctx.brandName}`,
      ``,
      `${via}répondez STOP si vous ne souhaitez pas être recontacté.)`,
    ].join("\n");
    return { subject, body };
  }

  if (channel === "review_platform" || channel === "listing") {
    const where = ctx.domain;
    const body = [
      `Plan d'action pour ${ctx.brandName} sur ${where}`,
      `(${where} est cité par ${engines} sur des requêtes de ${cat}, sans mentionner ` +
        `${ctx.brandName}.)`,
      ``,
      `- Revendiquez ou créez la fiche de ${ctx.brandName} sur ${where}.`,
      `- Complétez le profil : description claire, catégorie, lien ${brandUrl}, visuels.`,
      channel === "review_platform"
        ? `- Sollicitez quelques avis clients récents et authentiques.`
        : `- Ajoutez horaires, localisation et informations pratiques à jour.`,
      `- Reliez la fiche à ${brandUrl} pour renforcer la cohérence des signaux.`,
      ``,
      `Objectif : apparaître là où les IA vont chercher leurs références.`,
    ].join("\n");
    return { subject: "", body };
  }

  if (channel === "wikipedia") {
    const body = [
      `Suggestion à poster en page de discussion (Wikipédia)`,
      ``,
      `Bonjour, ${ctx.domain} est utilisé comme source par ${engines} sur des sujets ` +
        `de ${cat}. Si cela respecte les critères d'admissibilité et de neutralité, ` +
        `${ctx.brandName} (${brandUrl}) pourrait être mentionné avec une source fiable ` +
        `et indépendante.`,
      ``,
      `Je signale un possible conflit d'intérêt et laisse la communauté décider. ` +
        `Aucune formulation promotionnelle n'est proposée.`,
    ].join("\n");
    return { subject: "", body };
  }

  // reddit / quora / medium / youtube / forum / social: a message to publish.
  const platform = CHANNEL_META[channel].label;
  const body = [
    `Message à publier sur ${platform} (${ctx.domain})`,
    `(Page citée par ${engines} sur des requêtes de ${cat}.)`,
    ``,
    `Bonjour, pour compléter le sujet, ${ctx.brandName} (${brandUrl}) est une option ` +
      `pertinente en ${cat} qui n'est pas encore citée ici. Je précise en toute ` +
      `transparence mon lien avec cette marque.`,
    ``,
    `Message utile et non promotionnel : ajoutez un élément concret (retour ` +
      `d'expérience, chiffre, comparaison) plutôt qu'une simple mention.`,
  ].join("\n");
  return { subject: "", body };
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
 * deterministic template (flagged `mock: true`). Channel-aware.
 */
export async function generateOutreachDraft(ctx: OutreachContext): Promise<OutreachDraft> {
  const channel = channelOf(ctx);
  const mock = buildMockDraft(ctx);
  const result = await generateText(systemFor(channel), buildUser(ctx));

  if (result.mock || !result.text) {
    return { subject: mock.subject, body: mock.body, mock: true };
  }

  // Non-email channels have no subject: keep the whole model text as body.
  if (!CHANNEL_META[channel].usesEmail && channel !== "contact_form") {
    return { subject: "", body: result.text.trim(), mock: false, provider: result.provider };
  }

  const parsed = parseSubjectBody(result.text);
  if (!parsed) {
    return { subject: mock.subject, body: result.text.trim(), mock: false, provider: result.provider };
  }
  return { subject: parsed.subject, body: parsed.body, mock: false, provider: result.provider };
}
