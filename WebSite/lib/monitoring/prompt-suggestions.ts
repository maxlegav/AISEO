/**
 * Suggests the questions to monitor for a brand.
 *
 * Why this exists: asking a new user to invent 20 good prompts is the step where
 * onboarding dies. Worse, the prompts people write by hand are polished full
 * sentences — and that is *not* how anyone searches. Real queries are three or
 * four words, no verb, no question mark: "club libertin paris", "meilleur crm
 * pme". A monitoring set made only of well-formed questions measures a reality
 * that does not exist.
 *
 * So the generator is deliberately unbalanced towards `brute` phrasings, with
 * enough natural questions and long-tail variants to cover the way assistants
 * are also used conversationally. Every suggestion is tagged (`style`,
 * `intent`) so the UI can group them and, later, so we can tell the user which
 * *families* of queries they win or lose — not just which individual prompts.
 *
 * Pure and deterministic: no IO, no randomness, no LLM. An optional LLM pass
 * lives in the API layer and merges on top of this, so the feature works
 * key-free like the rest of the pipeline.
 */

/** How the query is phrased — the axis that matters for realism. */
export type PromptStyle = "brute" | "question" | "comparaison" | "longue";

/** What the searcher is trying to do. */
export type PromptIntent =
  | "decouverte"
  | "comparaison"
  | "marque"
  | "local"
  | "prix"
  | "avis"
  | "usage";

export interface PromptSuggestion {
  text: string;
  style: PromptStyle;
  intent: PromptIntent;
}

export interface SuggestInput {
  brandName: string;
  /** Free-text category, e.g. "club privé parisien", "CRM pour PME". */
  category: string;
  competitors?: string[];
  /** City or area, when the business is local. Drives the `local` family. */
  city?: string;
  /** Who it is for, e.g. "PME", "freelance". Drives the long-tail family. */
  audience?: string;
}

export const STYLE_LABEL: Record<PromptStyle, string> = {
  brute: "Requêtes brutes",
  question: "Questions",
  comparaison: "Comparaisons",
  longue: "Longue traîne",
};

export const STYLE_HELP: Record<PromptStyle, string> = {
  brute: "3-4 mots, sans verbe — la façon dont on tape réellement.",
  question: "Formulations complètes, comme on parle à un assistant.",
  comparaison: "Face à vos concurrents nommés.",
  longue: "Plus précises, moins de volume, moins de concurrence.",
};

/* ------------------------------------------------------------- helpers --- */

/**
 * Reduce a free-text category to the noun phrase people would actually type.
 * "Club privé parisien, sélectif" → "club privé". Marketing qualifiers and
 * anything after a comma are dropped: nobody types them.
 */
export function normalizeCategory(category: string): string {
  const cleaned = category
    .split(/[,;(]/)[0]
    ?.toLowerCase()
    .replace(/\b(haut de gamme|premium|de luxe|sélectif|selectif|innovant|nouvelle génération)\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned || category.toLowerCase().trim();
}

/**
 * Pluralise a French noun phrase: "club privé" → "clubs privés".
 * Every word is inflected because adjectives agree, which is exactly what makes
 * a naive `+ "s"` read as broken French ("meilleurs club privé").
 */
export function pluralizeFr(phrase: string): string {
  // A preposition introduces a complement that stays singular:
  // "logiciel de paie" -> "logiciels de paie", never "de paies".
  const prepositions = new Set(["de", "du", "des", "d'", "pour", "à", "au", "aux", "en", "sur"]);
  let stop = false;

  return phrase
    .split(" ")
    .map((word) => {
      const lower = word.toLowerCase();
      if (prepositions.has(lower)) {
        stop = true;
        return word;
      }
      if (stop || !word) return word;
      if (/[sxz]$/.test(lower)) return word;
      if (/(eau|eu)$/.test(lower)) return `${word}x`;
      if (/al$/.test(lower)) return `${word.slice(0, -2)}aux`;
      return `${word}s`;
    })
    .join(" ");
}

/** Drop a trailing city from the category so "club parisien" + Paris doesn't repeat. */
function withoutCity(category: string, city?: string): string {
  if (!city) return category;
  const c = city.toLowerCase();
  const adjectives: Record<string, string> = {
    paris: "parisien",
    lyon: "lyonnais",
    marseille: "marseillais",
    bordeaux: "bordelais",
    lille: "lillois",
    toulouse: "toulousain",
    nantes: "nantais",
  };
  const adj = adjectives[c];
  let out = category.replace(new RegExp(`\\b${c}\\b`, "gi"), "");
  if (adj) out = out.replace(new RegExp(`\\b${adj}s?\\b`, "gi"), "");
  return out.replace(/\s+/g, " ").trim() || category;
}

function dedupe(list: PromptSuggestion[]): PromptSuggestion[] {
  const seen = new Set<string>();
  const out: PromptSuggestion[] = [];
  for (const s of list) {
    const text = s.text.replace(/\s+/g, " ").trim();
    if (!text) continue;
    const key = text.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ ...s, text });
  }
  return out;
}

/* ---------------------------------------------------------- generation --- */

/**
 * Build the suggestion set. Returns roughly 100-160 prompts depending on how
 * much context is available (a local business with 4 competitors yields more
 * than a nameless category).
 */
export function suggestPrompts(input: SuggestInput): PromptSuggestion[] {
  const brand = input.brandName.trim();
  const raw = normalizeCategory(input.category || "");
  const cat = withoutCity(raw, input.city) || raw;
  const cats = pluralizeFr(cat);
  const city = input.city?.trim();
  const audience = input.audience?.trim();
  const competitors = (input.competitors ?? []).map((c) => c.trim()).filter(Boolean).slice(0, 6);
  const year = new Date().getFullYear();

  const out: PromptSuggestion[] = [];
  const add = (text: string, style: PromptStyle, intent: PromptIntent) =>
    out.push({ text, style, intent });

  if (!cat) return [];

  /* --- brute: the bulk of the set, because it is the bulk of reality ----- */
  // [modifier, intent, position, plural] — plural picks "clubs privés" over "club privé".
  const bareModifiers: [string, PromptIntent, "avant" | "apres", boolean][] = [
    ["", "decouverte", "apres", false],
    ["meilleur", "decouverte", "avant", false],
    ["meilleurs", "decouverte", "avant", true],
    ["top", "decouverte", "avant", true],
    ["bon", "decouverte", "avant", false],
    ["comparatif", "comparaison", "avant", true],
    ["classement", "comparaison", "avant", true],
    ["liste", "decouverte", "avant", true],
    ["avis", "avis", "apres", false],
    ["prix", "prix", "apres", false],
    ["tarif", "prix", "apres", false],
    ["pas cher", "prix", "apres", false],
    ["gratuit", "prix", "apres", false],
    [`${year}`, "decouverte", "apres", false],
    ["recommandé", "avis", "apres", false],
    ["fiable", "avis", "apres", false],
    ["sérieux", "avis", "apres", false],
    ["réputé", "avis", "apres", false],
    ["connu", "decouverte", "apres", false],
    ["populaire", "decouverte", "apres", false],
    ["nouveau", "decouverte", "avant", false],
    ["réservation", "usage", "apres", false],
    ["horaires", "usage", "apres", false],
  ];

  for (const [mod, intent, position, plural] of bareModifiers) {
    const noun = plural ? cats : cat;
    add(position === "avant" ? `${mod} ${noun}` : `${noun} ${mod}`, "brute", intent);
  }

  /* --- brute + local ----------------------------------------------------- */
  if (city) {
    const localModifiers: [string, PromptIntent, "avant" | "apres", boolean][] = [
      ["", "local", "apres", false],
      ["meilleur", "local", "avant", false],
      ["meilleurs", "local", "avant", true],
      ["top", "local", "avant", true],
      ["bon", "local", "avant", false],
      ["avis", "avis", "apres", false],
      ["prix", "prix", "apres", false],
      ["pas cher", "prix", "apres", false],
      ["ouvert", "local", "apres", false],
      ["proche", "local", "apres", false],
      [`${year}`, "local", "apres", false],
      ["comparatif", "comparaison", "avant", true],
    ];
    for (const [mod, intent, position, plural] of localModifiers) {
      const noun = plural ? cats : cat;
      add(
        position === "avant" ? `${mod} ${noun} ${city}` : `${noun} ${city} ${mod}`,
        "brute",
        intent,
      );
    }
    add(`${cat} centre ${city}`, "brute", "local");
    add(`où trouver ${cat} à ${city}`, "question", "local");
    add(`quel ${cat} à ${city} ?`, "question", "local");
    add(`le ${cat} le plus réputé à ${city}`, "longue", "local");
    add(`le ${cat} le plus fréquenté à ${city}`, "longue", "local");
  }

  /* --- questions: how people talk to an assistant ------------------------ */
  const questions: [string, PromptIntent][] = [
    [`quel est le meilleur ${cat} ?`, "decouverte"],
    [`quel ${cat} choisir ?`, "decouverte"],
    [`comment choisir un ${cat} ?`, "usage"],
    [`quels sont les meilleurs ${cats} ?`, "decouverte"],
    [`peux-tu me recommander un ${cat} ?`, "decouverte"],
    [`quel ${cat} me conseilles-tu ?`, "decouverte"],
    [`quel est le ${cat} le mieux noté ?`, "avis"],
    [`quel ${cat} a la meilleure réputation ?`, "avis"],
    [`combien coûte un ${cat} ?`, "prix"],
    [`quel ${cat} pour un petit budget ?`, "prix"],
    [`quels ${cats} éviter ?`, "avis"],
    [`à quoi faire attention avant de choisir un ${cat} ?`, "usage"],
    [`quel ${cat} en ${year} ?`, "decouverte"],
    [`quelles sont les références du ${cat} ?`, "decouverte"],
    [`quels ${cats} sont les plus recommandés ?`, "avis"],
  ];
  for (const [text, intent] of questions) add(text, "question", intent);

  /* --- comparison: only meaningful with named competitors ---------------- */
  for (const c of competitors) {
    add(`alternative à ${c}`, "comparaison", "comparaison");
    add(`alternatives à ${c}`, "comparaison", "comparaison");
    add(`concurrent de ${c}`, "comparaison", "comparaison");
    add(`${c} avis`, "comparaison", "avis");
    add(`${c} ou ${brand}`, "comparaison", "comparaison");
    add(`mieux que ${c}`, "comparaison", "comparaison");
    add(`quelle est la meilleure alternative à ${c} ?`, "comparaison", "comparaison");
    add(`${c} vs ${brand} : lequel choisir ?`, "comparaison", "comparaison");
  }
  if (competitors.length >= 2) {
    add(`${competitors[0]} ou ${competitors[1]}`, "comparaison", "comparaison");
    add(
      `quelle différence entre ${competitors[0]} et ${competitors[1]} ?`,
      "comparaison",
      "comparaison",
    );
  }

  /* --- brand: does the engine know you by name at all? ------------------- */
  const brandQueries: [string, PromptStyle, PromptIntent][] = [
    [`${brand}`, "brute", "marque"],
    [`${brand} avis`, "brute", "avis"],
    [`${brand} prix`, "brute", "prix"],
    [`${brand} c'est bien ?`, "question", "avis"],
    [`${brand} ça vaut le coup ?`, "question", "avis"],
    [`qui est ${brand} ?`, "question", "marque"],
    [`que fait ${brand} ?`, "question", "marque"],
    [`${brand} est-il fiable ?`, "question", "avis"],
    [`avis clients sur ${brand}`, "longue", "avis"],
    [`retour d'expérience sur ${brand}`, "longue", "avis"],
  ];
  for (const [text, style, intent] of brandQueries) add(text, style, intent);

  /* --- long tail: lower volume, far easier to win ------------------------ */
  const segments = [
    audience,
    "débutant",
    "professionnel",
    "petit budget",
    "première fois",
  ].filter(Boolean) as string[];

  for (const seg of segments) {
    add(`meilleur ${cat} pour ${seg}`, "longue", "usage");
    add(`quel ${cat} pour ${seg} ?`, "longue", "usage");
    add(`${cat} adapté ${seg}`, "brute", "usage");
  }

  const longTail: [string, PromptStyle, PromptIntent][] = [
    [`quel ${cat} offre le meilleur rapport qualité prix ?`, "longue", "prix"],
    [`quel ${cat} est le plus recommandé par les utilisateurs ?`, "longue", "avis"],
    [`quels ${cats} reviennent le plus souvent ?`, "longue", "decouverte"],
    [`liste des meilleurs ${cats}`, "brute", "decouverte"],
    [`sélection de ${cats}`, "brute", "decouverte"],
    [`guide pour choisir son ${cat}`, "longue", "usage"],
    [`erreurs à éviter avec un ${cat}`, "longue", "usage"],
    [`${cat} : que faut-il regarder ?`, "longue", "usage"],
    [`combien de temps pour choisir un ${cat} ?`, "longue", "usage"],
  ];
  for (const [text, style, intent] of longTail) add(text, style, intent);

  return dedupe(out);
}

/** Group suggestions by phrasing style, in display order. */
export function groupByStyle(
  suggestions: PromptSuggestion[],
): { style: PromptStyle; items: PromptSuggestion[] }[] {
  const order: PromptStyle[] = ["brute", "question", "comparaison", "longue"];
  return order
    .map((style) => ({ style, items: suggestions.filter((s) => s.style === style) }))
    .filter((g) => g.items.length > 0);
}

/**
 * A sensible pre-selection when the user just wants to start: keep the set
 * realistic (mostly `brute`) while covering every family and both the brand's
 * own name and its competitors.
 */
export function defaultSelection(
  suggestions: PromptSuggestion[],
  limit = 40,
): PromptSuggestion[] {
  const quota: Record<PromptStyle, number> = {
    brute: Math.round(limit * 0.5),
    question: Math.round(limit * 0.2),
    comparaison: Math.round(limit * 0.2),
    longue: Math.round(limit * 0.1),
  };
  const out: PromptSuggestion[] = [];
  for (const { style, items } of groupByStyle(suggestions)) {
    out.push(...items.slice(0, quota[style]));
  }
  return out.slice(0, limit);
}
