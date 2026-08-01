import type { LLMId } from "@/lib/monitoring/types";

/**
 * Hand-authored answer model for the demo brands.
 *
 * The generic mock (`./mock.ts`) decides citations from a hash: it populates the
 * dashboard but the numbers mean nothing — a brand can "win" a query it would
 * never win in reality. For the two showcase projects we want the opposite: a
 * dataset that reflects the actual market, so the dashboard tells a story a
 * practitioner would recognise.
 *
 * ⚠️ This is authored judgement, not measurement. It stands in for the LLM APIs
 * while no key is configured. Results are still stored with `mock: true`; the
 * moment real keys exist, the real adapters take over and this file stops being
 * consulted.
 *
 * The model has three parts:
 *
 *  1. **Players** — the brands that actually compete on these queries, each with
 *     a per-engine authority (0-1). Authority differs by engine because the
 *     engines source differently: ChatGPT follows Bing, Perplexity favours
 *     recent high-traffic pages, Gemini leans on Google properties, Claude
 *     over-cites forums.
 *  2. **Families** — query families matched by keyword, each re-weighting the
 *     players. A niche brand can dominate its family while being invisible on
 *     the generic query, which is exactly the insight the product sells.
 *  3. **Engine reticence** — some engines answer certain categories poorly or
 *     not at all (Claude hedges on sensitive categories). That is a real,
 *     measurable visibility fact.
 */

interface Player {
  name: string;
  /** Baseline standing per engine, 0-1. */
  authority: Record<LLMId, number>;
}

interface Family {
  /**
   * Lowercased keywords. Matched on **whole words**: a substring test would put
   * "bioburger" in the "bio" family and silently mis-score every brand query.
   */
  match: string[];
  /** Multiplier applied to a player's authority within this family. */
  weights: Record<string, number>;
  /**
   * Per-engine correction inside the family, for a given player.
   *
   * Positioning is not documented evenly across the web: Bioburger's organic
   * angle is covered by food press and its own site (which Perplexity and Bing
   * read) but barely discussed on the forums Claude leans on. Without this, a
   * strong family multiplier saturates every engine at once and the per-engine
   * breakdown — the thing being sold — goes flat.
   */
  engineWeights?: Record<string, Partial<Record<LLMId, number>>>;
  /** Domains the engines actually lean on for this family. */
  sources: string[];
  /**
   * Bypass engine reticence. A search on the brand's own name is a direct
   * lookup: the engine answers even in a category it otherwise avoids.
   */
  alwaysAnswers?: boolean;
}

export interface DemoProfile {
  brand: string;
  players: Player[];
  families: Family[];
  /** Fallback weighting when no family matches. */
  defaultSources: string[];
  /**
   * Probability the engine produces a usable answer at all for this category.
   * 0 means "never answers" — recorded as a genuine absence.
   */
  reticence: Record<LLMId, number>;
  /** How many brands a typical answer names. */
  namedCount: number;
}

/* ------------------------------------------------------------ Bioburger -- */

/**
 * Bioburger: French organic burger chain. Small next to the mainstream players,
 * but the reference on the organic/vegetarian angle — so it should win its
 * family and lose the generic "best burger in Paris" query.
 */
const BIOBURGER: DemoProfile = {
  brand: "Bioburger",
  namedCount: 3,
  players: [
    {
      name: "Big Fernand",
      authority: { chatgpt: 0.95, perplexity: 0.9, gemini: 0.9, claude: 0.75 },
    },
    {
      name: "Blend",
      authority: { chatgpt: 0.85, perplexity: 0.85, gemini: 0.7, claude: 0.7 },
    },
    {
      name: "PNY",
      authority: { chatgpt: 0.8, perplexity: 0.85, gemini: 0.65, claude: 0.9 },
    },
    {
      name: "Les Burgers de Papa",
      authority: { chatgpt: 0.6, perplexity: 0.5, gemini: 0.6, claude: 0.35 },
    },
    {
      name: "Bioburger",
      // Modest generic standing: a real chain, but not the one press lists first.
      authority: { chatgpt: 0.45, perplexity: 0.6, gemini: 0.34, claude: 0.24 },
    },
  ],
  families: [
    {
      match: ["bio", "biologique", "vegan", "végan", "végétarien", "vegetarien", "healthy", "sain"],
      // Its whole positioning: on this family it outranks everyone.
      weights: { Bioburger: 2.1, "Big Fernand": 0.5, Blend: 0.6, PNY: 0.7, "Les Burgers de Papa": 0.4 },
      engineWeights: {
        // Own site + food press carry the organic angle; forums almost never do.
        Bioburger: { perplexity: 1.2, chatgpt: 1, gemini: 0.7, claude: 0.5 },
      },
      sources: [
        "https://www.bioburger.fr",
        "https://www.timeout.fr/paris/restaurants/meilleurs-burgers-paris",
        "https://www.sortiraparis.com/restaurant/burger",
        "https://www.happycow.net/europe/france/paris",
      ],
    },
    {
      match: ["viande française", "viande francaise", "circuit court", "local", "responsable", "durable"],
      weights: { Bioburger: 1.9, "Big Fernand": 1.1, Blend: 0.8, PNY: 0.6 },
      engineWeights: {
        Bioburger: { perplexity: 1.15, chatgpt: 1, gemini: 0.7, claude: 0.55 },
      },
      sources: [
        "https://www.bioburger.fr",
        "https://www.lefooding.com/restaurants/paris",
        "https://www.sortiraparis.com/restaurant/burger",
      ],
    },
    {
      match: ["pas cher", "prix", "tarif", "budget", "gratuit"],
      weights: { Bioburger: 0.7, "Big Fernand": 1.1, "Les Burgers de Papa": 1.3, PNY: 0.8 },
      sources: [
        "https://www.tripadvisor.fr/Restaurants-g187147-Paris",
        "https://www.thefork.fr/ville/paris",
      ],
    },
    {
      match: ["bioburger"],
      // Brand-name queries: the engines know who it is.
      alwaysAnswers: true,
      weights: { Bioburger: 3.5, "Big Fernand": 0.4, Blend: 0.3, PNY: 0.3 },
      sources: [
        "https://www.bioburger.fr",
        "https://fr.wikipedia.org/wiki/Bioburger",
        "https://www.tripadvisor.fr/Restaurants-g187147-Paris",
      ],
    },
  ],
  defaultSources: [
    "https://www.timeout.fr/paris/restaurants/meilleurs-burgers-paris",
    "https://www.sortiraparis.com/restaurant/burger",
    "https://www.tripadvisor.fr/Restaurants-g187147-Paris",
    "https://www.reddit.com/r/paris",
  ],
  // Everyone answers restaurant questions happily.
  reticence: { chatgpt: 1, perplexity: 1, gemini: 1, claude: 1 },
};

/* ------------------------------------------------------ Les Chandelles -- */

/**
 * Les Chandelles: historic Parisian private club. The reference name in a very
 * narrow niche — but the category is one engines handle unevenly: Claude hedges
 * and Gemini stays vague, so the per-engine spread is the whole point of this
 * project.
 */
const CHANDELLES: DemoProfile = {
  brand: "Les Chandelles",
  namedCount: 3,
  players: [
    {
      name: "Les Chandelles",
      // The historic, most-documented name in its category.
      authority: { chatgpt: 0.85, perplexity: 0.9, gemini: 0.7, claude: 0.5 },
    },
    {
      name: "Le Set",
      authority: { chatgpt: 0.6, perplexity: 0.65, gemini: 0.5, claude: 0.4 },
    },
    {
      name: "L'Orangerie",
      authority: { chatgpt: 0.5, perplexity: 0.55, gemini: 0.45, claude: 0.35 },
    },
    {
      name: "Le 2+2",
      authority: { chatgpt: 0.4, perplexity: 0.45, gemini: 0.35, claude: 0.3 },
    },
    {
      name: "Chris et Manu",
      authority: { chatgpt: 0.35, perplexity: 0.4, gemini: 0.3, claude: 0.25 },
    },
  ],
  families: [
    {
      match: ["chandelles"],
      alwaysAnswers: true,
      weights: { "Les Chandelles": 3.5, "Le Set": 0.4, "L'Orangerie": 0.3 },
      sources: [
        "https://www.leschandelles.com",
        "https://fr.wikipedia.org/wiki/Les_Chandelles",
        "https://www.sortiraparis.com/loisirs/sortie-en-boite",
      ],
    },
    {
      match: ["libertin", "échangiste", "echangiste", "privé", "prive", "couple"],
      weights: { "Les Chandelles": 1.6, "Le Set": 1.1, "L'Orangerie": 1 },
      sources: [
        "https://www.leschandelles.com",
        "https://www.sortiraparis.com/loisirs/sortie-en-boite",
        "https://www.tripadvisor.fr/Attractions-g187147-Paris",
      ],
    },
    {
      match: ["sortir", "soirée", "soiree", "boîte", "boite", "nuit", "samedi"],
      // Drowned by mainstream nightlife on generic going-out queries.
      weights: { "Les Chandelles": 0.5, "Le Set": 0.5, "L'Orangerie": 0.4 },
      sources: [
        "https://www.sortiraparis.com/loisirs/sortie-en-boite",
        "https://www.timeout.fr/paris/vie-nocturne",
        "https://www.reddit.com/r/paris",
      ],
    },
    {
      match: ["prix", "tarif", "entrée", "entree", "réservation", "reservation", "horaires"],
      weights: { "Les Chandelles": 1.4, "Le Set": 0.9 },
      sources: [
        "https://www.leschandelles.com",
        "https://www.tripadvisor.fr/Attractions-g187147-Paris",
      ],
    },
  ],
  defaultSources: [
    "https://www.sortiraparis.com/loisirs/sortie-en-boite",
    "https://www.tripadvisor.fr/Attractions-g187147-Paris",
    "https://www.reddit.com/r/paris",
  ],
  reticence: {
    chatgpt: 0.85,
    perplexity: 0.9,
    gemini: 0.55,
    // Claude declines or answers without naming venues more often than the rest.
    claude: 0.35,
  },
};

/* ----------------------------------------------------------------- Alan -- */

/**
 * Alan: digital-native health insurer. Owns the "mutuelle en ligne / pour
 * startup" framing, but generic "meilleure mutuelle" searches are dominated by
 * incumbents and comparison sites that have twenty years of SEO behind them.
 */
const ALAN: DemoProfile = {
  brand: "Alan",
  namedCount: 3,
  players: [
    { name: "Malakoff Humanis", authority: { chatgpt: 0.9, perplexity: 0.8, gemini: 0.85, claude: 0.6 } },
    { name: "Harmonie Mutuelle", authority: { chatgpt: 0.85, perplexity: 0.75, gemini: 0.8, claude: 0.55 } },
    { name: "Axa", authority: { chatgpt: 0.85, perplexity: 0.8, gemini: 0.85, claude: 0.6 } },
    { name: "Swiss Life", authority: { chatgpt: 0.7, perplexity: 0.65, gemini: 0.7, claude: 0.45 } },
    { name: "Alan", authority: { chatgpt: 0.62, perplexity: 0.7, gemini: 0.5, claude: 0.55 } },
  ],
  families: [
    {
      match: ["startup", "en ligne", "digitale", "simple", "moderne", "sans paperasse"],
      weights: { Alan: 2.3, "Malakoff Humanis": 0.5, Axa: 0.5, "Harmonie Mutuelle": 0.5 },
      engineWeights: { Alan: { perplexity: 1.15, chatgpt: 1, gemini: 0.8, claude: 0.9 } },
      sources: ["https://alan.com", "https://www.welcometothejungle.com", "https://www.journaldunet.com"],
    },
    {
      match: ["alan"],
      alwaysAnswers: true,
      weights: { Alan: 3.5, "Malakoff Humanis": 0.3, Axa: 0.3 },
      sources: ["https://alan.com", "https://fr.trustpilot.com", "https://www.journaldunet.com"],
    },
    {
      match: ["comparatif", "comparateur", "classement", "moins cher", "prix", "tarif"],
      // Comparison sites are built for exactly this query; Alan rarely leads.
      weights: { Alan: 0.6, "Malakoff Humanis": 1.2, Axa: 1.2, "Harmonie Mutuelle": 1.1 },
      sources: ["https://www.lesfurets.com", "https://www.lecomparateurassurance.com", "https://www.quechoisir.org"],
    },
  ],
  defaultSources: [
    "https://www.lesfurets.com",
    "https://www.journaldunet.com",
    "https://www.quechoisir.org",
    "https://www.reddit.com/r/vosfinances",
  ],
  reticence: { chatgpt: 1, perplexity: 1, gemini: 0.95, claude: 0.9 },
};

/* ---------------------------------------------------------------- Qonto -- */

/** Qonto: the default answer for "business account" in France. Strong almost everywhere. */
const QONTO: DemoProfile = {
  brand: "Qonto",
  namedCount: 3,
  players: [
    { name: "Qonto", authority: { chatgpt: 0.92, perplexity: 0.93, gemini: 0.8, claude: 0.75 } },
    { name: "Shine", authority: { chatgpt: 0.75, perplexity: 0.7, gemini: 0.65, claude: 0.6 } },
    { name: "Revolut Business", authority: { chatgpt: 0.8, perplexity: 0.78, gemini: 0.75, claude: 0.7 } },
    { name: "Blank", authority: { chatgpt: 0.45, perplexity: 0.4, gemini: 0.4, claude: 0.3 } },
    { name: "BNP Paribas", authority: { chatgpt: 0.7, perplexity: 0.55, gemini: 0.75, claude: 0.4 } },
  ],
  families: [
    {
      match: ["qonto"],
      alwaysAnswers: true,
      weights: { Qonto: 3.5, Shine: 0.3, "Revolut Business": 0.3 },
      sources: ["https://qonto.com", "https://fr.trustpilot.com", "https://www.lesechos.fr"],
    },
    {
      match: ["banque traditionnelle", "agence", "dépôt", "espèces", "chèque"],
      // Cash and cheques are where the incumbents still win.
      weights: { Qonto: 0.5, "BNP Paribas": 1.6, Shine: 0.6 },
      sources: ["https://www.bnpparibas.fr", "https://www.service-public.fr"],
    },
  ],
  defaultSources: [
    "https://qonto.com",
    "https://www.journaldunet.com",
    "https://www.capital.fr",
    "https://www.reddit.com/r/entrepreneur",
  ],
  reticence: { chatgpt: 1, perplexity: 1, gemini: 1, claude: 0.95 },
};

/* --------------------------------------------------------------- PayFit -- */

/**
 * PayFit: owns the "payroll without an accountant" framing for small companies.
 * Silae owns the accountant channel, which is a different question entirely.
 */
const PAYFIT: DemoProfile = {
  brand: "PayFit",
  namedCount: 3,
  players: [
    { name: "Silae", authority: { chatgpt: 0.85, perplexity: 0.75, gemini: 0.8, claude: 0.55 } },
    { name: "PayFit", authority: { chatgpt: 0.72, perplexity: 0.78, gemini: 0.6, claude: 0.6 } },
    { name: "Sage", authority: { chatgpt: 0.8, perplexity: 0.65, gemini: 0.75, claude: 0.5 } },
    { name: "Lucca", authority: { chatgpt: 0.5, perplexity: 0.5, gemini: 0.45, claude: 0.4 } },
    { name: "Factorial", authority: { chatgpt: 0.45, perplexity: 0.5, gemini: 0.4, claude: 0.35 } },
  ],
  families: [
    {
      match: ["startup", "pme", "sans expert-comptable", "simple", "automatisé", "en ligne"],
      weights: { PayFit: 2, Silae: 0.6, Sage: 0.6 },
      engineWeights: { PayFit: { perplexity: 1.15, chatgpt: 1, gemini: 0.8, claude: 0.85 } },
      sources: ["https://payfit.com", "https://www.appvizer.fr", "https://www.journaldunet.com"],
    },
    {
      match: ["expert-comptable", "cabinet", "comptable", "certifié"],
      // Silae is sold through accountants; PayFit is not.
      weights: { PayFit: 0.4, Silae: 2, Sage: 1.2 },
      sources: ["https://www.silae.fr", "https://www.compta-online.com"],
    },
    {
      match: ["payfit"],
      alwaysAnswers: true,
      weights: { PayFit: 3.5, Silae: 0.3, Sage: 0.3 },
      sources: ["https://payfit.com", "https://www.capterra.fr", "https://www.g2.com"],
    },
  ],
  defaultSources: [
    "https://www.appvizer.fr",
    "https://www.capterra.fr",
    "https://www.journaldunet.com",
    "https://www.g2.com",
  ],
  reticence: { chatgpt: 1, perplexity: 1, gemini: 0.95, claude: 0.95 },
};

/* ---------------------------------------------------------------- Swile -- */

/**
 * Swile: the modern challenger on meal vouchers. Edenred and Pluxee still own
 * the category name, so Swile wins on "card / app / modern" and loses on the
 * generic and employer-procurement queries.
 */
const SWILE: DemoProfile = {
  brand: "Swile",
  namedCount: 3,
  players: [
    { name: "Edenred", authority: { chatgpt: 0.9, perplexity: 0.82, gemini: 0.85, claude: 0.6 } },
    { name: "Swile", authority: { chatgpt: 0.75, perplexity: 0.8, gemini: 0.65, claude: 0.6 } },
    { name: "Pluxee", authority: { chatgpt: 0.7, perplexity: 0.65, gemini: 0.7, claude: 0.45 } },
    { name: "Up Déjeuner", authority: { chatgpt: 0.6, perplexity: 0.55, gemini: 0.6, claude: 0.4 } },
    { name: "Bimpli", authority: { chatgpt: 0.45, perplexity: 0.42, gemini: 0.45, claude: 0.3 } },
  ],
  families: [
    {
      match: ["carte", "application", "appli", "moderne", "dématérialisé", "mobile"],
      weights: { Swile: 2.1, Edenred: 0.7, Pluxee: 0.6, "Up Déjeuner": 0.5 },
      engineWeights: { Swile: { perplexity: 1.15, chatgpt: 1, gemini: 0.85, claude: 0.9 } },
      sources: ["https://www.swile.co", "https://www.journaldunet.com", "https://www.capital.fr"],
    },
    {
      match: ["papier", "carnet", "urssaf", "plafond", "législation", "réglementation"],
      weights: { Swile: 0.6, Edenred: 1.4, Pluxee: 1.2 },
      sources: ["https://www.urssaf.fr", "https://www.service-public.fr", "https://www.edenred.fr"],
    },
    {
      match: ["swile"],
      alwaysAnswers: true,
      weights: { Swile: 3.5, Edenred: 0.3 },
      sources: ["https://www.swile.co", "https://fr.trustpilot.com", "https://www.journaldunet.com"],
    },
  ],
  defaultSources: [
    "https://www.journaldunet.com",
    "https://www.capital.fr",
    "https://www.urssaf.fr",
    "https://www.reddit.com/r/france",
  ],
  reticence: { chatgpt: 1, perplexity: 1, gemini: 1, claude: 0.9 },
};

/* ------------------------------------------------------------- Doctolib -- */

/**
 * Doctolib: near-monopoly. The interesting signal here is not "are we cited"
 * but "where does even a dominant brand slip" — telehealth queries, where Qare
 * and Livi are the specialists.
 */
const DOCTOLIB: DemoProfile = {
  brand: "Doctolib",
  namedCount: 3,
  players: [
    { name: "Doctolib", authority: { chatgpt: 0.95, perplexity: 0.95, gemini: 0.92, claude: 0.85 } },
    { name: "Maiia", authority: { chatgpt: 0.55, perplexity: 0.5, gemini: 0.5, claude: 0.4 } },
    { name: "KelDoc", authority: { chatgpt: 0.5, perplexity: 0.45, gemini: 0.45, claude: 0.35 } },
    { name: "Qare", authority: { chatgpt: 0.6, perplexity: 0.6, gemini: 0.55, claude: 0.45 } },
    { name: "Livi", authority: { chatgpt: 0.58, perplexity: 0.58, gemini: 0.5, claude: 0.45 } },
  ],
  families: [
    {
      match: ["téléconsultation", "teleconsultation", "à distance", "vidéo", "ordonnance en ligne"],
      // The one family where pure-play telehealth outranks the incumbent.
      weights: { Doctolib: 0.8, Qare: 1.8, Livi: 1.8, Maiia: 0.9 },
      sources: ["https://www.qare.fr", "https://www.livi.fr", "https://www.ameli.fr"],
    },
    {
      match: ["doctolib"],
      alwaysAnswers: true,
      weights: { Doctolib: 3.5, Maiia: 0.3, KelDoc: 0.3 },
      sources: ["https://www.doctolib.fr", "https://fr.wikipedia.org/wiki/Doctolib", "https://www.lemonde.fr"],
    },
    {
      match: ["logiciel", "praticien", "cabinet", "agenda", "libéral"],
      weights: { Doctolib: 1.4, Maiia: 1.3, KelDoc: 1.2, Qare: 0.5, Livi: 0.4 },
      sources: ["https://www.doctolib.fr", "https://www.maiia.com", "https://www.appvizer.fr"],
    },
  ],
  defaultSources: [
    "https://www.doctolib.fr",
    "https://www.ameli.fr",
    "https://www.sante.fr",
    "https://www.lemonde.fr",
  ],
  reticence: { chatgpt: 1, perplexity: 1, gemini: 1, claude: 0.95 },
};

/* -------------------------------------------------------------- lemlist -- */

/** lemlist: heavy content marketing makes it a default answer on cold email. */
const LEMLIST: DemoProfile = {
  brand: "lemlist",
  namedCount: 3,
  players: [
    { name: "lemlist", authority: { chatgpt: 0.88, perplexity: 0.9, gemini: 0.72, claude: 0.8 } },
    { name: "Instantly", authority: { chatgpt: 0.8, perplexity: 0.82, gemini: 0.6, claude: 0.85 } },
    { name: "Smartlead", authority: { chatgpt: 0.72, perplexity: 0.75, gemini: 0.55, claude: 0.8 } },
    { name: "Apollo", authority: { chatgpt: 0.85, perplexity: 0.8, gemini: 0.7, claude: 0.7 } },
    { name: "Woodpecker", authority: { chatgpt: 0.55, perplexity: 0.5, gemini: 0.45, claude: 0.5 } },
  ],
  families: [
    {
      match: ["lemlist"],
      alwaysAnswers: true,
      weights: { lemlist: 3.5, Instantly: 0.4, Smartlead: 0.3 },
      sources: ["https://www.lemlist.com", "https://www.g2.com", "https://www.capterra.fr"],
    },
    {
      match: ["délivrabilité", "delivrabilite", "spam", "warmup", "chauffe"],
      // Deliverability is where the newer tools are talked about most.
      weights: { lemlist: 0.9, Instantly: 1.6, Smartlead: 1.7 },
      sources: ["https://www.reddit.com/r/coldemail", "https://www.g2.com", "https://www.emailtooltester.com"],
    },
    {
      match: ["base de données", "leads", "prospects", "enrichissement", "contacts"],
      weights: { lemlist: 1.1, Apollo: 1.9, Instantly: 0.9 },
      sources: ["https://www.apollo.io", "https://www.g2.com", "https://www.capterra.fr"],
    },
  ],
  defaultSources: [
    "https://www.g2.com",
    "https://www.capterra.fr",
    "https://www.reddit.com/r/sales",
    "https://www.producthunt.com",
  ],
  reticence: { chatgpt: 1, perplexity: 1, gemini: 0.95, claude: 1 },
};

const PROFILES: DemoProfile[] = [
  BIOBURGER,
  CHANDELLES,
  ALAN,
  QONTO,
  PAYFIT,
  SWILE,
  DOCTOLIB,
  LEMLIST,
];

/** The authored profile for a brand, or null when it should use the generic mock. */
export function demoProfileFor(brandName: string): DemoProfile | null {
  const key = brandName.trim().toLowerCase();
  return PROFILES.find((p) => p.brand.toLowerCase() === key) ?? null;
}

/**
 * True for questions about how something *works* rather than which vendor to
 * pick ("comment automatiser la paie ?", "titre restaurant plafond"). Engines
 * answer those by explaining the mechanism and often name nobody — a real and
 * frequent way to be absent that a pure ranking model would miss entirely.
 */
function isInformational(prompt: string): boolean {
  return (
    /^(comment|pourquoi|faut-il|combien|est-ce|à quoi|quelle est la différence)/.test(prompt) ||
    /réglementation|législation|urssaf|plafond|obligatoire|rembours|fonctionne|résilier|mettre en place/.test(
      prompt,
    )
  );
}

/** Whole-word keyword match, so "bio" never fires on "bioburger". */
function matchesWord(haystack: string, keyword: string): boolean {
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^a-zà-ÿ0-9])${escaped}($|[^a-zà-ÿ0-9])`, "i").test(haystack);
}

/** Stable 0-1 value, so a given (prompt, engine) always yields the same answer. */
function noise(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 0xffffffff;
}

export interface AuthoredAnswer {
  /** Brands named, best first. Empty when the engine gave no usable answer. */
  named: string[];
  sources: string[];
}

/**
 * Decide who a given engine names for a given prompt, from the authored model.
 * Deterministic: the same inputs always produce the same answer, so scores are
 * stable across runs the way a real measurement would be week to week.
 */
export function authoredAnswer(
  profile: DemoProfile,
  prompt: string,
  llm: LLMId,
): AuthoredAnswer {
  const lower = prompt.toLowerCase();

  const family = profile.families.find((f) => f.match.some((m) => matchesWord(lower, m)));
  const sources = family ? family.sources : profile.defaultSources;

  // The engine may simply not answer this category.
  if (!family?.alwaysAnswers && noise(`${llm}::${prompt}::reticence`) > profile.reticence[llm]) {
    return { named: [], sources: sources.slice(0, 1) };
  }

  // "How does it work" questions usually get an explanation, not a shortlist.
  if (
    !family?.alwaysAnswers &&
    isInformational(lower) &&
    noise(`${llm}::${prompt}::informational`) > 0.35
  ) {
    return { named: [], sources: sources.slice(0, 2) };
  }

  const ranked = profile.players
    .map((p) => {
      const base = p.authority[llm];
      const weight = family?.weights[p.name] ?? 1;
      const perEngine = family?.engineWeights?.[p.name]?.[llm] ?? 1;
      // A little jitter so a brand sitting near the cut-off wins some queries
      // and loses others, as it would in reality.
      const jitter = 0.7 + noise(`${llm}::${prompt}::${p.name}`) * 0.6;
      return { name: p.name, score: base * weight * perEngine * jitter };
    })
    .sort((a, b) => b.score - a.score);

  // Only genuinely plausible candidates get named.
  // Answers name two or three brands, not a fixed count.
  const count = 2 + Math.floor(noise(`${llm}::${prompt}::count`) * (profile.namedCount - 1));
  const named = ranked
    .filter((r) => r.score >= 0.55)
    .slice(0, Math.max(1, count))
    .map((r) => r.name);

  return { named, sources };
}

/**
 * Compose the answer text an engine would return, naming the chosen brands.
 *
 * The prompt is deliberately **not** echoed back. Brand detection scans this
 * text, so quoting the query would mark every brand-name search as a citation —
 * including the ones where the engine answered nothing. A presence has to come
 * from the ranking model, never from the wording of the question.
 */
export function authoredText(answer: AuthoredAnswer): string {
  if (answer.named.length === 0) {
    return (
      "Je n'ai pas de recommandation précise à donner ici. " +
      "Le mieux est de consulter des avis récents et de vérifier les informations sur place."
    );
  }

  const list =
    answer.named.length === 1
      ? answer.named[0]
      : `${answer.named.slice(0, -1).join(", ")} et ${answer.named[answer.named.length - 1]}`;

  // Source URLs stay out of the text and travel in `citations`: the brand's own
  // domain would otherwise read as a mention ("bioburger.fr" contains the brand)
  // and inflate presence on every answer that merely links to its site.
  return (
    `Les adresses les plus souvent citées sont ${list}. ` +
    `${answer.named[0]} revient en premier dans la plupart des retours.`
  );
}
