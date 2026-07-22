/**
 * Outreach channel classification. Not every "source à conquérir" is contacted
 * the same way: a small editorial site is reached by email, but a Reddit thread,
 * a Quora question, a Medium article, a YouTube video, a G2/Capterra listing or a
 * TripAdvisor page each need a different, platform-appropriate action (and never
 * a cold email to a generic address). This module maps a domain to the right
 * channel so the agent can prepare a tailored draft + the correct call to action.
 */

export type OutreachChannelKind =
  | "email"
  | "contact_form"
  | "reddit"
  | "quora"
  | "medium"
  | "youtube"
  | "forum"
  | "review_platform"
  | "listing"
  | "wikipedia"
  | "social";

export interface ChannelMeta {
  /** Short badge label (FR). */
  label: string;
  /** Primary call-to-action label when a destination URL is available. */
  actionLabel: string;
  /** One-line instruction shown under the draft. */
  howto: string;
  /** Verb used for the "I did it" status button ("envoyé" vs "publié"). */
  doneVerb: string;
  /** Whether this channel is reached via an email address (email field + mailto). */
  usesEmail: boolean;
}

export const CHANNEL_META: Record<OutreachChannelKind, ChannelMeta> = {
  email: {
    label: "Email",
    actionLabel: "Ouvrir dans ma messagerie",
    howto: "Contact direct : relisez, éditez, puis envoyez depuis votre messagerie.",
    doneVerb: "envoyé",
    usesEmail: true,
  },
  contact_form: {
    label: "Formulaire de contact",
    actionLabel: "Ouvrir le formulaire",
    howto:
      "Aucun email public : copiez le message et envoyez-le via le formulaire de contact du site.",
    doneVerb: "envoyé",
    usesEmail: false,
  },
  reddit: {
    label: "Reddit",
    actionLabel: "Répondre sur le fil Reddit",
    howto:
      "Répondez dans le fil cité avec un commentaire utile et honnête (créez un compte si besoin, précisez votre lien avec la marque).",
    doneVerb: "publié",
    usesEmail: false,
  },
  quora: {
    label: "Quora",
    actionLabel: "Répondre sur Quora",
    howto:
      "Publiez une réponse utile à la question citée en mentionnant la marque de façon transparente.",
    doneVerb: "publié",
    usesEmail: false,
  },
  medium: {
    label: "Medium",
    actionLabel: "Ouvrir l'article Medium",
    howto:
      "Commentez l'article ou contactez l'auteur pour proposer d'ajouter la marque comme référence pertinente.",
    doneVerb: "publié",
    usesEmail: false,
  },
  youtube: {
    label: "YouTube",
    actionLabel: "Ouvrir la vidéo YouTube",
    howto:
      "Commentez la vidéo ou contactez le créateur pour suggérer la marque (précisez votre lien avec elle).",
    doneVerb: "publié",
    usesEmail: false,
  },
  forum: {
    label: "Forum / communauté",
    actionLabel: "Ouvrir la discussion",
    howto:
      "Participez à la discussion citée avec un message utile et non promotionnel, en mentionnant la marque si c'est pertinent.",
    doneVerb: "publié",
    usesEmail: false,
  },
  review_platform: {
    label: "Plateforme d'avis",
    actionLabel: "Revendiquer la fiche produit",
    howto:
      "Revendiquez / créez la fiche produit sur cette plateforme et sollicitez des avis clients : c'est ce que les IA citent.",
    doneVerb: "fait",
    usesEmail: false,
  },
  listing: {
    label: "Annuaire / fiche",
    actionLabel: "Revendiquer la fiche",
    howto:
      "Créez ou revendiquez votre fiche sur cet annuaire et complétez-la (photos, description, catégorie).",
    doneVerb: "fait",
    usesEmail: false,
  },
  wikipedia: {
    label: "Wikipédia",
    actionLabel: "Ouvrir l'article",
    howto:
      "Proposez un ajout neutre et sourcé en page de discussion de l'article : pas de contenu promotionnel, une source fiable requise.",
    doneVerb: "proposé",
    usesEmail: false,
  },
  social: {
    label: "Réseau social",
    actionLabel: "Ouvrir la page",
    howto:
      "Engagez la conversation ou contactez le compte, ou créez votre propre présence sur ce réseau.",
    doneVerb: "publié",
    usesEmail: false,
  },
};

/**
 * Domains for known platforms → their channel. Matched on the registrable
 * suffix (exact domain or a subdomain of it).
 */
const PLATFORM_RULES: { suffixes: string[]; kind: OutreachChannelKind }[] = [
  { suffixes: ["reddit.com"], kind: "reddit" },
  { suffixes: ["quora.com"], kind: "quora" },
  { suffixes: ["medium.com"], kind: "medium" },
  { suffixes: ["youtube.com", "youtu.be"], kind: "youtube" },
  {
    suffixes: [
      "ycombinator.com",
      "stackexchange.com",
      "stackoverflow.com",
      "producthunt.com",
    ],
    kind: "forum",
  },
  {
    suffixes: [
      "g2.com",
      "capterra.com",
      "capterra.fr",
      "getapp.com",
      "getapp.fr",
      "trustpilot.com",
      "trustradius.com",
      "softwareadvice.com",
      "sourceforge.net",
    ],
    kind: "review_platform",
  },
  {
    suffixes: [
      "tripadvisor.com",
      "tripadvisor.fr",
      "yelp.com",
      "yelp.fr",
      "thefork.com",
      "thefork.fr",
      "lafourchette.com",
      "pagesjaunes.fr",
      "michelin.com",
      "guide.michelin.com",
      "foursquare.com",
    ],
    kind: "listing",
  },
  { suffixes: ["wikipedia.org", "wikimedia.org", "wikidata.org"], kind: "wikipedia" },
  {
    suffixes: [
      "linkedin.com",
      "instagram.com",
      "facebook.com",
      "x.com",
      "twitter.com",
      "tiktok.com",
      "pinterest.com",
      "threads.net",
    ],
    kind: "social",
  },
];

function normalizeHost(domain: string): string {
  return domain
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
    .replace(/^www\./, "");
}

/**
 * Classify a domain into a known platform channel, or `null` when it looks like
 * a regular website (a person / editorial site) that should be reached by email
 * or a contact form. `null` means "run email discovery".
 */
export function classifyChannel(domain: string): OutreachChannelKind | null {
  const host = normalizeHost(domain);
  if (!host) return null;
  for (const rule of PLATFORM_RULES) {
    for (const suffix of rule.suffixes) {
      if (host === suffix || host.endsWith(`.${suffix}`)) return rule.kind;
    }
  }
  return null;
}
