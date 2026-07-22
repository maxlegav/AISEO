/**
 * Best-effort discovery of a PUBLIC contact email for an outreach target
 * domain. We only read emails that the site itself displays (mailto: links or
 * plain addresses on the home / contact pages). We never guess addresses
 * (no "prenom.nom@"), never scrape aggressively (a few pages, one at a time,
 * short timeout), and degrade to "contact à trouver manuellement" on failure.
 */
import type { ContactSource } from "@/models/OutreachTarget";

const FETCH_TIMEOUT_MS = 4000;

/** Candidate paths a public contact email is usually shown on. */
const CONTACT_PATHS = ["", "/contact", "/contact-us", "/contactez-nous", "/about", "/a-propos"];

// Generic mailboxes we do not want to surface as an editorial contact, and
// obvious noise (assets, example addresses, tracking).
const REJECT_LOCALPARTS = new Set([
  "noreply",
  "no-reply",
  "donotreply",
  "postmaster",
  "abuse",
  "privacy",
]);
const REJECT_DOMAINS = new Set(["example.com", "sentry.io", "wixpress.com", "domain.com"]);
const REJECT_EXT = /\.(png|jpg|jpeg|gif|svg|webp|css|js)$/i;

const EMAIL_RE = /[a-z0-9](?:[a-z0-9._%+-]*[a-z0-9])?@[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?\.[a-z]{2,}/gi;

export interface ContactResult {
  email: string | null;
  source: ContactSource;
}

/** Rank editorial-ish mailboxes first (press/editor/contact), generic last. */
function scoreEmail(email: string): number {
  const local = (email.split("@")[0] ?? "").toLowerCase();
  if (/(press|presse|editor|redaction|redac|media|pr)\b/.test(local)) return 3;
  if (/(contact|hello|bonjour|info|hi)\b/.test(local)) return 2;
  return 1;
}

/**
 * Extract the best public contact email from raw HTML. Pure and unit-tested.
 * Prefers mailto: links, then editorial mailboxes, filtering out asset noise
 * and generic no-reply addresses. Returns null when nothing usable is found.
 */
export function extractEmail(html: string, domain: string): string | null {
  if (!html) return null;
  const found = new Set<string>();

  // 1) mailto: links (most reliable).
  const mailtoRe = /mailto:([^"'?>\s]+)/gi;
  let m: RegExpExecArray | null;
  while ((m = mailtoRe.exec(html)) !== null) {
    const addr = m[1];
    if (addr) found.add(addr.toLowerCase());
  }
  // 2) plain addresses in the text.
  const plain = html.match(EMAIL_RE) ?? [];
  for (const e of plain) found.add(e.toLowerCase());

  const host = domain.replace(/^www\./, "");
  const candidates = Array.from(found).filter((e) => {
    if (REJECT_EXT.test(e)) return false;
    const [local, dom] = e.split("@");
    if (!local || !dom) return false;
    if (REJECT_LOCALPARTS.has(local)) return false;
    if (REJECT_DOMAINS.has(dom)) return false;
    return true;
  });
  if (candidates.length === 0) return null;

  // Prefer an address on the target's own domain, then editorial mailbox.
  candidates.sort((a, b) => {
    const sameA = a.endsWith(`@${host}`) || a.endsWith(`.${host}`) ? 1 : 0;
    const sameB = b.endsWith(`@${host}`) || b.endsWith(`.${host}`) ? 1 : 0;
    if (sameA !== sameB) return sameB - sameA;
    return scoreEmail(b) - scoreEmail(a);
  });
  return candidates[0] ?? null;
}

async function fetchText(url: string): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: { "user-agent": "ShowYourBrand-GEO-Outreach/1.0" },
    });
    if (!res.ok) return null;
    return (await res.text()).slice(0, 200000);
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Look up a public contact email for a domain, checking a few common pages one
 * at a time (respectful, short timeout). Returns the first usable address, or
 * `{ email: null, source: null }` when none is publicly displayed.
 */
export async function findContactEmail(domain: string): Promise<ContactResult> {
  const host = domain.replace(/^https?:\/\//, "").replace(/\/.*$/, "").replace(/^www\./, "");
  if (!host || !host.includes(".")) return { email: null, source: null };

  for (const path of CONTACT_PATHS) {
    const html = await fetchText(`https://${host}${path}`);
    if (!html) continue;
    const email = extractEmail(html, host);
    if (email) return { email, source: "page_contact" };
  }
  return { email: null, source: null };
}
