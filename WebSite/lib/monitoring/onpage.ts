/**
 * On-page GEO scanner + llms.txt analysis.
 *
 * Pure, dependency-free parsing of a live home page's HTML and the site's own
 * /llms.txt, so the recommendations can point at what the *real* site is missing
 * ("your home page has no meta description", "your llms.txt exists but lists no
 * key pages") instead of giving generic advice.
 *
 * Regex-based on purpose: no cheerio/jsdom dependency, runs server-side in
 * getServerSideProps, and degrades gracefully on malformed markup.
 */

import type {
  LlmsTxtStatus,
  OnPageItem,
  OnPageScan,
} from "@/lib/mock/monitoring";

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#0*39;/gi, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/&apos;/gi, "'")
    .replace(/&nbsp;/gi, " ");
}

function collapse(s: string): string {
  return decodeEntities(s.replace(/\s+/g, " ").trim());
}

/** First `<title>` text, or null. */
function extractTitle(html: string): string | null {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return m?.[1] ? collapse(m[1]) : null;
}

/** `content` of a `<meta name="...">` or `<meta property="...">`, or null. */
function extractMeta(html: string, key: string, attr: "name" | "property"): string | null {
  // Match the tag containing the attr=key, then pull its content attribute.
  const tagRe = new RegExp(`<meta\\b[^>]*\\b${attr}\\s*=\\s*["']${key}["'][^>]*>`, "i");
  const tag = html.match(tagRe)?.[0];
  if (!tag) return null;
  const content = tag.match(/\bcontent\s*=\s*["']([\s\S]*?)["']/i)?.[1];
  return content ? collapse(content) : null;
}

/** First `<h1>` text (tags stripped), or null. */
function extractH1(html: string): string | null {
  const m = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (!m?.[1]) return null;
  const text = collapse(m[1].replace(/<[^>]+>/g, " "));
  return text || null;
}

/** All `@type` values found across the page's JSON-LD script blocks. */
function extractJsonLdTypes(html: string): string[] {
  const types = new Set<string>();
  const blockRe =
    /<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m: RegExpExecArray | null;
  while ((m = blockRe.exec(html)) !== null) {
    const raw = m[1]?.trim();
    if (!raw) continue;
    // Prefer real parsing; fall back to a regex sweep for @type on bad JSON.
    try {
      collectTypes(JSON.parse(raw), types);
    } catch {
      const tRe = /"@type"\s*:\s*"([^"]+)"/g;
      let t: RegExpExecArray | null;
      while ((t = tRe.exec(raw)) !== null) if (t[1]) types.add(t[1]);
    }
  }
  return Array.from(types);
}

function collectTypes(node: unknown, out: Set<string>): void {
  if (Array.isArray(node)) {
    for (const n of node) collectTypes(n, out);
    return;
  }
  if (node && typeof node === "object") {
    const obj = node as Record<string, unknown>;
    const t = obj["@type"];
    if (typeof t === "string") out.add(t);
    else if (Array.isArray(t)) for (const x of t) if (typeof x === "string") out.add(x);
    for (const key of Object.keys(obj)) {
      if (key === "@type") continue;
      collectTypes(obj[key], out);
    }
  }
}

/** True when the fetched text is actually an HTML page (soft-404 for llms.txt). */
function looksLikeHtml(text: string): boolean {
  return /<!doctype html|<html[\s>]|<head[\s>]|<body[\s>]/i.test(text.slice(0, 2000));
}

/**
 * Scan the live home page HTML for the GEO-relevant on-page signals and turn
 * each into an actionable checklist item.
 */
export function scanOnPage(html: string | null, brandName: string): OnPageScan {
  if (!html) {
    return {
      scanned: false,
      title: null,
      metaDescription: null,
      h1: null,
      jsonLdTypes: [],
      hasFaqSchema: false,
      hasOrganizationSchema: false,
      openGraph: false,
      items: [],
    };
  }

  const title = extractTitle(html);
  const metaDescription = extractMeta(html, "description", "name");
  const h1 = extractH1(html);
  const jsonLdTypes = extractJsonLdTypes(html);
  const lowerTypes = jsonLdTypes.map((t) => t.toLowerCase());
  const hasFaqSchema = lowerTypes.includes("faqpage");
  const hasOrganizationSchema =
    lowerTypes.includes("organization") ||
    lowerTypes.includes("localbusiness") ||
    lowerTypes.includes("corporation");
  const ogTitle = extractMeta(html, "og:title", "property");
  const ogDescription = extractMeta(html, "og:description", "property");
  const openGraph = !!(ogTitle || ogDescription);

  const items: OnPageItem[] = [];

  // Title
  if (!title) {
    items.push({
      label: "Balise <title>",
      status: "missing",
      detail: "Aucun <title> détecté. Ajoutez un titre clair mentionnant votre marque et votre activité.",
    });
  } else if (title.length < 15 || title.length > 65) {
    items.push({
      label: "Balise <title>",
      status: "warn",
      detail: `Titre présent (« ${title} ») mais ${title.length < 15 ? "trop court" : "trop long"} (${title.length} car.). Visez 15 à 65 caractères, marque incluse.`,
    });
  } else {
    items.push({
      label: "Balise <title>",
      status: "ok",
      detail: `« ${title} »`,
    });
  }

  // Meta description
  if (!metaDescription) {
    items.push({
      label: "Meta description",
      status: "missing",
      detail: "Aucune meta description. Ajoutez une phrase factuelle décrivant votre offre : les IA la reprennent souvent telle quelle.",
    });
  } else if (metaDescription.length < 50 || metaDescription.length > 165) {
    items.push({
      label: "Meta description",
      status: "warn",
      detail: `Meta description présente mais ${metaDescription.length < 50 ? "trop courte" : "trop longue"} (${metaDescription.length} car.). Visez 50 à 160 caractères.`,
    });
  } else {
    items.push({
      label: "Meta description",
      status: "ok",
      detail: `« ${metaDescription} »`,
    });
  }

  // H1
  if (!h1) {
    items.push({
      label: "Titre H1",
      status: "missing",
      detail: "Aucun <h1> détecté sur la page d'accueil. Ajoutez un H1 unique décrivant votre marque et sa proposition de valeur.",
    });
  } else {
    items.push({
      label: "Titre H1",
      status: "ok",
      detail: `« ${h1} »`,
    });
  }

  // Organization / structured data
  if (!hasOrganizationSchema) {
    items.push({
      label: "Données structurées Organization",
      status: "missing",
      detail: `Aucun balisage schema.org Organization/LocalBusiness détecté. Ajoutez-le pour aider les IA à identifier ${brandName} (nom, logo, URL, réseaux).`,
    });
  } else {
    items.push({
      label: "Données structurées Organization",
      status: "ok",
      detail: `Balisage détecté (${jsonLdTypes.join(", ")}).`,
    });
  }

  // FAQ schema
  items.push(
    hasFaqSchema
      ? { label: "Données structurées FAQPage", status: "ok", detail: "Un balisage FAQPage est déjà présent." }
      : {
          label: "Données structurées FAQPage",
          status: "warn",
          detail: "Pas de FAQPage détectée. Publiez le bloc FAQ + JSON-LD ci-dessous : c'est le format que les IA reprennent le plus.",
        },
  );

  // OpenGraph
  items.push(
    openGraph
      ? { label: "Balises OpenGraph", status: "ok", detail: "Balises og: présentes (bon partage social et lecture par les crawlers)." }
      : {
          label: "Balises OpenGraph",
          status: "warn",
          detail: "Aucune balise og:title / og:description. Ajoutez-les pour un meilleur rendu au partage et à l'indexation.",
        },
  );

  return {
    scanned: true,
    title,
    metaDescription,
    h1,
    jsonLdTypes,
    hasFaqSchema,
    hasOrganizationSchema,
    openGraph,
    items,
  };
}

/**
 * Compare the site's own /llms.txt (if any) against what a complete one should
 * contain: a title heading, a one-line description, and at least one key page.
 */
export function analyzeLlmsTxt(existing: string | null): LlmsTxtStatus {
  if (!existing || !existing.trim() || looksLikeHtml(existing)) {
    return {
      found: false,
      complete: false,
      missing: ["fichier absent"],
      note: "Aucun llms.txt détecté à la racine du site. Publiez celui recommandé ci-dessous pour décrire votre marque aux crawlers IA.",
    };
  }

  const lines = existing.split(/\r?\n/).map((l) => l.trim());
  const hasHeading = lines.some((l) => /^#\s+\S/.test(l));
  const hasDescription = lines.some((l) => /^>\s+\S/.test(l));
  const hasPages = lines.some((l) => /^-\s+\S/.test(l) && /https?:\/\/|\/\S/.test(l));

  const missing: string[] = [];
  if (!hasHeading) missing.push("un titre « # Marque »");
  if (!hasDescription) missing.push("une description « > … »");
  if (!hasPages) missing.push("des pages clés (liste « - … »)");

  const complete = missing.length === 0;
  return {
    found: true,
    complete,
    missing,
    note: complete
      ? "Un llms.txt est déjà en ligne et bien structuré. Vérifiez qu'il liste vos pages les plus utiles."
      : `Un llms.txt existe mais il lui manque : ${missing.join(", ")}. Complétez-le avec la version recommandée ci-dessous.`,
  };
}
