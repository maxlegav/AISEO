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
 * How prominently a brand is featured in a response, beyond a binary mention.
 * A brand named once in the last sentence is far less "present" to a reader than
 * one named early and repeatedly, even though both count as a single mention.
 */
export interface Prominence {
  found: boolean;
  /** Prominence score in [0, 1]; higher = more prominent. 0 when absent. */
  score: number;
  /** Number of (non-overlapping) mentions in the text. */
  mentions: number;
  /** Position of the first mention as a fraction of the text (0 = very start). */
  firstRatio: number;
}

/** Count non-overlapping occurrences of `brand` and the first one's token index. */
function findOccurrences(
  textTokens: string[],
  brand: string,
  opts: { fuzzy?: boolean; maxDistance?: number },
): { count: number; firstIndex: number } {
  const { fuzzy = true, maxDistance = 1 } = opts;
  const brandTokens = tokenize(brand);
  if (brandTokens.length === 0 || textTokens.length === 0) {
    return { count: 0, firstIndex: -1 };
  }
  let count = 0;
  let firstIndex = -1;
  for (let i = 0; i + brandTokens.length <= textTokens.length; ) {
    let matchRun = true;
    for (let j = 0; j < brandTokens.length; j++) {
      const t = textTokens[i + j]!;
      const b = brandTokens[j]!;
      if (t === b) continue;
      if (!(fuzzy && fuzzyWordMatch(t, b, maxDistance))) {
        matchRun = false;
        break;
      }
    }
    if (matchRun) {
      if (firstIndex === -1) firstIndex = i;
      count++;
      i += brandTokens.length; // non-overlapping
    } else {
      i++;
    }
  }
  return { count, firstIndex };
}

/**
 * Semantic prominence of a brand in a response. Combines three signals:
 *  - earliness: how early the first mention appears (readers weight the top),
 *  - frequency: how often it is repeated (capped, diminishing returns),
 *  - a lead boost when the brand appears in the first fifth of the answer.
 */
export function brandProminence(
  text: string,
  brand: string,
  opts: { fuzzy?: boolean; maxDistance?: number } = {},
): Prominence {
  const textTokens = tokenize(text);
  const total = textTokens.length;
  const { count, firstIndex } = findOccurrences(textTokens, brand, opts);
  if (count === 0 || total === 0) {
    return { found: false, score: 0, mentions: 0, firstRatio: 1 };
  }
  const firstRatio = firstIndex / total;
  const earliness = 1 - firstRatio;
  const frequency = Math.min(count, 3) / 3;
  const leadBoost = firstRatio <= 0.2 ? 1 : 0;
  const score = 0.55 * earliness + 0.3 * frequency + 0.15 * leadBoost;
  return {
    found: true,
    score: Math.round(score * 1000) / 1000,
    mentions: count,
    firstRatio: Math.round(firstRatio * 1000) / 1000,
  };
}

/**
 * Given the monitored brand and the list of competitors, compute the brand's
 * 1-based rank by *semantic prominence* (1 = most prominently featured brand in
 * the answer), not merely by which name appears first. Ties are broken by the
 * earlier first mention. Returns null if the brand is absent.
 */
export function brandPosition(
  text: string,
  brand: string,
  competitors: string[],
  opts?: { fuzzy?: boolean; maxDistance?: number },
): number | null {
  const own = brandProminence(text, brand, opts);
  if (!own.found) return null;

  const ranked = [
    { name: brand, isOwn: true, prom: own },
    ...competitors.map((c) => ({
      name: c,
      isOwn: false,
      prom: brandProminence(text, c, opts),
    })),
  ]
    .filter((e) => e.prom.found)
    .sort((a, b) => {
      if (b.prom.score !== a.prom.score) return b.prom.score - a.prom.score;
      return a.prom.firstRatio - b.prom.firstRatio;
    });

  return ranked.findIndex((e) => e.isOwn) + 1;
}
