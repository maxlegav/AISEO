/**
 * Best-effort fetch of a site's robots.txt / sitemap.xml so the technical GEO
 * recommendations can reflect the real site. Never throws: on any failure the
 * caller degrades to "non vérifié".
 */

export interface SiteSignals {
  robotsText: string | null;
  robotsReachable: boolean;
  sitemapFound: boolean | null;
  /** Raw content of the site's own /llms.txt, or null if absent/unreachable. */
  llmsTxt: string | null;
  /** Home page HTML (capped), or null if unreachable, for the on-page scan. */
  homeHtml: string | null;
}

function originOf(websiteUrl: string): string | null {
  try {
    return new URL(websiteUrl).origin;
  } catch {
    try {
      return new URL(`https://${websiteUrl}`).origin;
    } catch {
      return null;
    }
  }
}

async function fetchWithTimeout(url: string, ms: number): Promise<Response | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: { "user-agent": "ShowYourBrand-GEO-Audit/1.0" },
    });
    return res;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function readText(res: Response | null, cap: number): Promise<string | null> {
  if (!res || !res.ok) return null;
  try {
    return (await res.text()).slice(0, cap);
  } catch {
    return null;
  }
}

export async function fetchSiteSignals(websiteUrl: string): Promise<SiteSignals> {
  const origin = originOf(websiteUrl);
  if (!origin) {
    return {
      robotsText: null,
      robotsReachable: false,
      sitemapFound: null,
      llmsTxt: null,
      homeHtml: null,
    };
  }

  const [robotsRes, sitemapRes, llmsRes, homeRes] = await Promise.all([
    fetchWithTimeout(`${origin}/robots.txt`, 3000),
    fetchWithTimeout(`${origin}/sitemap.xml`, 3000),
    fetchWithTimeout(`${origin}/llms.txt`, 3000),
    fetchWithTimeout(origin, 4000),
  ]);

  const robotsText = await readText(robotsRes, 20000);
  const robotsReachable = !!(robotsRes && robotsRes.ok);
  const sitemapFound = sitemapRes ? sitemapRes.ok : null;
  const llmsTxt = await readText(llmsRes, 20000);
  const homeHtml = await readText(homeRes, 250000);

  return { robotsText, robotsReachable, sitemapFound, llmsTxt, homeHtml };
}
