/**
 * Extract the URLs / sources an LLM cites in its answer.
 *
 * Handles three shapes the models emit:
 *  - bare/inline URLs ("https://example.com/path"),
 *  - markdown links ("[label](https://example.com)"),
 *  - a provider-supplied list of citation URLs (Perplexity returns these).
 *
 * Pure & dependency-free for unit testing.
 */

const URL_RE = /https?:\/\/[^\s<>()\[\]"']+/gi;
const MD_LINK_RE = /\[[^\]]*\]\((https?:\/\/[^\s)]+)\)/gi;

/** Strip trailing punctuation the regex may greedily capture. */
function cleanUrl(raw: string): string {
  return raw.replace(/[.,;:!?)\]}'"]+$/, "");
}

/** Parse the registrable-ish domain from a URL (drops "www."). Lowercased. */
export function domainOf(url: string): string {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return host.replace(/^www\./, "");
  } catch {
    // Fallback for malformed inputs: best-effort host extraction.
    const m = url.match(/^https?:\/\/([^/?#]+)/i);
    return m?.[1] ? m[1].toLowerCase().replace(/^www\./, "") : url.toLowerCase();
  }
}

export interface ExtractedSource {
  url: string;
  domain: string;
}

/**
 * Extract a de-duplicated (by full URL) list of cited sources from a response
 * plus any explicit citation URLs the provider returned separately.
 */
export function extractSources(
  responseText: string,
  explicitCitations: string[] = [],
): ExtractedSource[] {
  const found = new Map<string, ExtractedSource>();

  const add = (raw: string) => {
    const url = cleanUrl(raw.trim());
    if (!/^https?:\/\//i.test(url)) return;
    if (!found.has(url)) found.set(url, { url, domain: domainOf(url) });
  };

  // Markdown links first (so we capture the real href, not the label).
  let m: RegExpExecArray | null;
  MD_LINK_RE.lastIndex = 0;
  while ((m = MD_LINK_RE.exec(responseText)) !== null) {
    if (m[1]) add(m[1]);
  }

  // Then any remaining bare URLs.
  URL_RE.lastIndex = 0;
  while ((m = URL_RE.exec(responseText)) !== null) add(m[0]);

  // Provider-supplied citations.
  for (const c of explicitCitations) add(c);

  return Array.from(found.values());
}
