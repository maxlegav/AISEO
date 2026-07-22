/**
 * GEO deliverables agent.
 *
 * Turns a project's monitoring data (lost queries, cited sources, competitors,
 * live site scan) into ready-to-publish content: a full llms.txt, a filled
 * FAQPage JSON-LD, an answer page for a query the brand loses, a helpful
 * (non-promotional) forum draft, and an Organization JSON-LD patch.
 *
 * When an LLM API key is configured the content is actually written by the
 * model; otherwise `generateDeliverable` returns a deterministic template built
 * from the same data and marks it `mock: true` so the UI can label it honestly.
 */
import type { LLMId } from "@/lib/monitoring/types";
import { generateText } from "@/lib/llm/generate";
import { domainOf } from "@/lib/monitoring/source-extraction";

export type DeliverableKind =
  | "llms_txt"
  | "faq_jsonld"
  | "answer_page"
  | "forum_reply"
  | "org_jsonld";

export const DELIVERABLE_KINDS: DeliverableKind[] = [
  "llms_txt",
  "faq_jsonld",
  "answer_page",
  "forum_reply",
  "org_jsonld",
];

export interface DeliverableContext {
  brandName: string;
  websiteUrl: string;
  category: string;
  competitors: string[];
  /** Target query for answer_page / forum_reply. */
  prompt?: string;
  /** Domains the engines cite in this category (context for forum drafts). */
  sourceDomains?: string[];
  /** Home page signals from the live scan, when available. */
  homeTitle?: string | null;
  homeMeta?: string | null;
  homeH1?: string | null;
}

export type DeliverableFormat = "markdown" | "json" | "text";

export interface DeliverableResult {
  kind: DeliverableKind;
  title: string;
  content: string;
  format: DeliverableFormat;
  /** True when the content is a deterministic template (no LLM key). */
  mock: boolean;
  provider?: LLMId;
  note: string;
}

interface KindSpec {
  title: string;
  format: DeliverableFormat;
  /** Requires a target query. */
  needsPrompt: boolean;
  buildSystem: () => string;
  buildUser: (ctx: DeliverableContext) => string;
  buildMock: (ctx: DeliverableContext) => string;
}

function origin(websiteUrl: string): string {
  try {
    return new URL(websiteUrl).origin;
  } catch {
    const trimmed = websiteUrl.replace(/\/+$/, "");
    return /^https?:\/\//.test(trimmed) ? trimmed : `https://${trimmed}`;
  }
}

function questionForm(prompt: string): string {
  const p = prompt.trim();
  return /\?$/.test(p) ? p : `${p} ?`;
}

const WRITER_SYSTEM =
  "Tu es un consultant GEO (Generative Engine Optimization) francophone. " +
  "Tu produis des livrables prêts à publier, factuels et spécifiques à la marque. " +
  "Interdiction d'utiliser des formulations génériques à trous du type « décrivez ici ». " +
  "N'utilise jamais de tiret cadratin. Réponds uniquement avec le livrable demandé, sans préambule.";

const SPECS: Record<DeliverableKind, KindSpec> = {
  llms_txt: {
    title: "llms.txt complet",
    format: "markdown",
    needsPrompt: false,
    buildSystem: () => WRITER_SYSTEM,
    buildUser: (ctx) =>
      `Rédige un fichier llms.txt complet pour la marque « ${ctx.brandName} » (site ${origin(
        ctx.websiteUrl,
      )}).\n` +
      `Activité : ${ctx.category || "non précisée"}.\n` +
      `Concurrents connus : ${ctx.competitors.join(", ") || "aucun"}.\n` +
      `Format attendu : un titre « # ${ctx.brandName} », une ligne « > » de résumé, ` +
      `une section « ## À propos » (2 à 4 puces factuelles), et une section « ## Pages clés » ` +
      `avec des URLs plausibles du domaine. Sois concret et spécifique à cette marque.`,
    buildMock: (ctx) => {
      const site = origin(ctx.websiteUrl);
      const cat = ctx.category || "votre activité";
      const lines = [
        `# ${ctx.brandName}`,
        "",
        `> ${ctx.brandName} : ${cat}.`,
        "",
        "## À propos",
        `- ${ctx.brandName} est spécialisé dans : ${cat}.`,
        `- Site officiel : ${site}`,
        ctx.competitors.length
          ? `- Souvent comparé à : ${ctx.competitors.slice(0, 3).join(", ")}.`
          : `- Marque de référence dans sa catégorie.`,
        "",
        "## Pages clés",
        `- ${site}/ (accueil)`,
        `- ${site}/a-propos`,
        `- ${site}/faq`,
      ];
      return lines.join("\n");
    },
  },

  faq_jsonld: {
    title: "FAQ rédigée + JSON-LD FAQPage",
    format: "json",
    needsPrompt: false,
    buildSystem: () => WRITER_SYSTEM,
    buildUser: (ctx) =>
      `Rédige un bloc JSON-LD schema.org FAQPage valide pour « ${ctx.brandName} » ` +
      `(${ctx.category || "activité non précisée"}).\n` +
      `Génère 4 à 6 questions réellement posées par des prospects de cette catégorie, ` +
      `avec des réponses factuelles de 2 à 3 phrases citant ${ctx.brandName}. ` +
      `Réponds uniquement avec le JSON (aucun texte autour).`,
    buildMock: (ctx) => {
      const cat = (ctx.category || "cette catégorie").toLowerCase();
      const questions = [
        {
          q: `Qu'est-ce que ${ctx.brandName} ?`,
          a: `${ctx.brandName} est une marque de ${cat}. Elle aide ses clients à répondre à ce besoin avec une offre dédiée et un positionnement clair.`,
        },
        {
          q: `Pourquoi choisir ${ctx.brandName} ?`,
          a: ctx.competitors.length
            ? `Comparé à ${ctx.competitors.slice(0, 2).join(" et ")}, ${ctx.brandName} met en avant son expérience, sa qualité de service et sa spécialisation sur ${cat}.`
            : `${ctx.brandName} met en avant son expérience, sa qualité de service et sa spécialisation sur ${cat}.`,
        },
        {
          q: `Comment contacter ${ctx.brandName} ?`,
          a: `Vous pouvez contacter ${ctx.brandName} directement via son site officiel ${origin(ctx.websiteUrl)}, où sont détaillés ses services et ses coordonnées.`,
        },
        {
          q: `${ctx.brandName} est-il adapté à mon besoin ?`,
          a: `Si vous cherchez une solution de ${cat}, ${ctx.brandName} propose une offre pensée pour ce cas d'usage. Consultez ses pages produit pour vérifier l'adéquation.`,
        },
      ];
      const doc = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: questions.map((item) => ({
          "@type": "Question",
          name: item.q,
          acceptedAnswer: { "@type": "Answer", text: item.a },
        })),
      };
      return JSON.stringify(doc, null, 2);
    },
  },

  answer_page: {
    title: "Page de réponse optimisée",
    format: "markdown",
    needsPrompt: true,
    buildSystem: () => WRITER_SYSTEM,
    buildUser: (ctx) =>
      `Rédige une page de réponse GEO complète, en Markdown, pour la requête « ${ctx.prompt} », ` +
      `pour la marque « ${ctx.brandName} » (${ctx.category || "activité non précisée"}, site ${origin(
        ctx.websiteUrl,
      )}).\n` +
      `Structure : un H1, un paragraphe de réponse directe, 2 à 3 sections H2 utiles, ` +
      `une mini-FAQ de 2 questions, et une conclusion mentionnant ${ctx.brandName}. ` +
      `${ctx.competitors.length ? `Positionne la marque face à ${ctx.competitors.slice(0, 3).join(", ")}. ` : ""}` +
      `Contenu réellement informatif, pas de remplissage.`,
    buildMock: (ctx) => {
      const prompt = ctx.prompt ?? "votre requête cible";
      const site = origin(ctx.websiteUrl);
      const cat = ctx.category || "ce domaine";
      return [
        `# ${questionForm(prompt).replace(/\?$/, "")}`,
        "",
        `${ctx.brandName} répond à la question « ${prompt} ». Voici l'essentiel à savoir, ` +
          `ainsi que les critères pour bien choisir dans ${cat}.`,
        "",
        "## Réponse rapide",
        `Pour « ${prompt} », ${ctx.brandName} propose une solution spécialisée. ` +
          `Les points à vérifier sont la pertinence de l'offre, la réputation et la qualité du service.`,
        "",
        "## Ce qui compte vraiment",
        `- Adéquation avec votre besoin précis en ${cat}.`,
        `- Preuves concrètes : avis clients, exemples, résultats.`,
        ctx.competitors.length
          ? `- Comparaison objective avec ${ctx.competitors.slice(0, 3).join(", ")}.`
          : `- Comparaison objective avec les alternatives du marché.`,
        "",
        `## Pourquoi ${ctx.brandName}`,
        `${ctx.brandName} se distingue par sa spécialisation sur ${cat} et son suivi client. ` +
          `Détails et exemples sur ${site}.`,
        "",
        "## FAQ",
        `**${questionForm(prompt)}**  `,
        `${ctx.brandName} apporte une réponse dédiée à ce besoin.`,
        "",
        `**Comment démarrer avec ${ctx.brandName} ?**  `,
        `Rendez-vous sur ${site} pour découvrir l'offre et prendre contact.`,
      ].join("\n");
    },
  },

  forum_reply: {
    title: "Brouillon Reddit / Quora (non promotionnel)",
    format: "text",
    needsPrompt: true,
    buildSystem: () =>
      WRITER_SYSTEM +
      " Ce livrable est une réponse de forum : elle doit être authentiquement utile, " +
      "honnête, jamais promotionnelle, et ne mentionner la marque qu'en passant et seulement si c'est pertinent.",
    buildUser: (ctx) =>
      `Rédige un brouillon de réponse utile pour un fil Reddit ou Quora sur le sujet « ${ctx.prompt} ».\n` +
      `Contexte marque (à ne PAS survendre) : ${ctx.brandName}, ${ctx.category || "activité non précisée"}.\n` +
      `${ctx.sourceDomains?.length ? `Sources souvent citées sur ce sujet : ${ctx.sourceDomains.slice(0, 4).join(", ")}.\n` : ""}` +
      `La réponse doit d'abord aider sincèrement (conseils concrets), puis mentionner ${ctx.brandName} ` +
      `de façon transparente uniquement si c'est réellement pertinent. Ton naturel, première personne.`,
    buildMock: (ctx) => {
      const prompt = ctx.prompt ?? "ce sujet";
      const cat = ctx.category || "ce domaine";
      return [
        `Sur « ${prompt} », voici ce qui m'a vraiment aidé :`,
        "",
        `1. Définis d'abord ton besoin précis, ça évite de payer pour des options inutiles.`,
        `2. Compare 2 ou 3 solutions sur des critères concrets (prix, support, résultats réels).`,
        `3. Regarde les retours d'expérience récents plutôt que les pages marketing.`,
        "",
        `Dans ${cat}, j'ai testé plusieurs options. ${ctx.brandName} fait partie de celles qui ` +
          `m'ont paru sérieuses pour ce cas précis, mais le meilleur choix dépend vraiment de ton contexte. ` +
          `Regarde aussi les alternatives avant de décider.`,
        "",
        `(Transparence : je cite ${ctx.brandName} car je l'ai utilisé, pas pour faire de la pub.)`,
      ].join("\n");
    },
  },

  org_jsonld: {
    title: "Correctif Organization JSON-LD",
    format: "json",
    needsPrompt: false,
    buildSystem: () => WRITER_SYSTEM,
    buildUser: (ctx) =>
      `Génère un bloc JSON-LD schema.org de type Organization valide pour « ${ctx.brandName} », ` +
      `à coller dans le <head> du site ${origin(ctx.websiteUrl)}.\n` +
      `Activité : ${ctx.category || "non précisée"}.\n` +
      `${ctx.homeMeta ? `Description actuelle du site : ${ctx.homeMeta}\n` : ""}` +
      `Inclus name, url, description, et un tableau sameAs vide à compléter par les profils sociaux. ` +
      `Réponds uniquement avec le JSON.`,
    buildMock: (ctx) => {
      const description =
        ctx.homeMeta?.trim() ||
        `${ctx.brandName} : ${ctx.category || "présentation de la marque"}.`;
      const doc = {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: ctx.brandName,
        url: origin(ctx.websiteUrl),
        description,
        sameAs: [] as string[],
      };
      return JSON.stringify(doc, null, 2);
    },
  },
};

/** Human-readable label for a deliverable kind. */
export function deliverableTitle(kind: DeliverableKind): string {
  return SPECS[kind].title;
}

/** Whether a deliverable kind requires a target query. */
export function deliverableNeedsPrompt(kind: DeliverableKind): boolean {
  return SPECS[kind].needsPrompt;
}

function mockNote(): string {
  return (
    "Contenu généré en mode local (aucune clé LLM configurée) : c'est un modèle " +
    "déterministe rempli avec vos données, à vérifier avant publication. Avec une clé " +
    "API, ce même bouton produit un contenu réellement rédigé par le modèle."
  );
}

function realNote(provider?: LLMId): string {
  const by = provider ? ` par ${provider}` : "";
  return `Contenu rédigé${by} à partir de vos données de monitoring. Relisez-le avant publication.`;
}

/**
 * Produce one deliverable. Uses a real LLM when a key is set; otherwise a
 * deterministic template built from the same context (flagged `mock: true`).
 */
export async function generateDeliverable(
  kind: DeliverableKind,
  ctx: DeliverableContext,
): Promise<DeliverableResult> {
  const spec = SPECS[kind];
  if (spec.needsPrompt && !ctx.prompt?.trim()) {
    throw new Error(`Deliverable "${kind}" requires a target prompt`);
  }

  const mockContent = spec.buildMock(ctx);
  const result = await generateText(spec.buildSystem(), spec.buildUser(ctx));

  if (result.mock || !result.text) {
    return {
      kind,
      title: spec.title,
      content: mockContent,
      format: spec.format,
      mock: true,
      note: mockNote(),
    };
  }

  return {
    kind,
    title: spec.title,
    content: result.text,
    format: spec.format,
    mock: false,
    provider: result.provider,
    note: realNote(result.provider),
  };
}

/** Domains of the brand's own site, filtered out of forum source context. */
export function externalSourceDomains(
  websiteUrl: string,
  domains: string[],
): string[] {
  const own = domainOf(websiteUrl);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const d of domains) {
    const norm = d.replace(/^www\./, "");
    if (!norm || norm === own || seen.has(norm)) continue;
    seen.add(norm);
    out.push(norm);
  }
  return out;
}
