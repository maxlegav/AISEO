/**
 * Brand-mention detection in an LLM response.
 *
 * Pure, dependency-free functions so they can be unit-tested in isolation and
 * reused by the monitoring pipeline. Detection combines:
 *  - exact (accent- and case-insensitive) whole-token matching, and
 *  - fuzzy matching (Levenshtein distance ≤ 1 per word) to absorb typos /
 *    minor spelling drift the models sometimes produce.
 */

/** Lowercase + strip accents/diacritics so "Café" matches "cafe". */
export function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

/** Split a normalized string into alphanumeric word tokens. */
function tokenize(text: string): string[] {
  return normalize(text)
    .split(/[^a-z0-9]+/i)
    .filter(Boolean);
}

/** Classic Levenshtein edit distance between two strings. */
export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 0; i < a.length; i++) {
    const curr = [i + 1];
    for (let j = 0; j < b.length; j++) {
      const cost = a[i] === b[j] ? 0 : 1;
      curr.push(Math.min(prev[j + 1]! + 1, curr[j]! + 1, prev[j]! + cost));
    }
    prev = curr;
  }
  return prev[b.length]!;
}

/**
 * Fuzzy word equality: allow up to `maxDistance` edits, scaled down for very
 * short words (a 1-edit tolerance on a 3-letter word is too loose).
 */
function fuzzyWordMatch(a: string, b: string, maxDistance: number): boolean {
  if (a === b) return true;
  if (Math.abs(a.length - b.length) > maxDistance) return false;
  if (a.length <= 3 || b.length <= 3) return false;
  return levenshtein(a, b) <= maxDistance;
}

export interface BrandMatch {
  found: boolean;
  exact: boolean;
  /** Index (in the token stream) of the first matching token; -1 if not found. */
  tokenIndex: number;
}

/**
 * Detect whether `brand` is mentioned in `text`.
 * Multi-word brands must match consecutively (each word exactly or fuzzily).
 */
export function detectBrand(
  text: string,
  brand: string,
  opts: { fuzzy?: boolean; maxDistance?: number } = {},
): BrandMatch {
  const { fuzzy = true, maxDistance = 1 } = opts;
  const brandTokens = tokenize(brand);
  const textTokens = tokenize(text);
  if (brandTokens.length === 0 || textTokens.length === 0) {
    return { found: false, exact: false, tokenIndex: -1 };
  }

  for (let i = 0; i + brandTokens.length <= textTokens.length; i++) {
    let exactRun = true;
    let matchRun = true;
    for (let j = 0; j < brandTokens.length; j++) {
      const t = textTokens[i + j]!;
      const b = brandTokens[j]!;
      if (t === b) continue;
      exactRun = false;
      if (!(fuzzy && fuzzyWordMatch(t, b, maxDistance))) {
        matchRun = false;
        break;
      }
    }
    if (matchRun) {
      return { found: true, exact: exactRun, tokenIndex: i };
    }
  }
  return { found: false, exact: false, tokenIndex: -1 };
}

/**
 * Given the monitored brand and the list of competitors, compute the brand's
 * 1-based rank by order of first appearance in the text (1 = mentioned before
 * every competitor). Returns null if the brand is absent.
 */
export function brandPosition(
  text: string,
  brand: string,
  competitors: string[],
  opts?: { fuzzy?: boolean; maxDistance?: number },
): number | null {
  const brandMatch = detectBrand(text, brand, opts);
  if (!brandMatch.found) return null;

  const positions: number[] = [brandMatch.tokenIndex];
  for (const c of competitors) {
    const m = detectBrand(text, c, opts);
    if (m.found) positions.push(m.tokenIndex);
  }
  positions.sort((a, b) => a - b);
  return positions.indexOf(brandMatch.tokenIndex) + 1;
}
