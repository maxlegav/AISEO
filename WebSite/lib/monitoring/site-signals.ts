/**
 * Best-effort fetch of a site's robots.txt / sitemap.xml so the technical GEO
 * recommendations can reflect the real site. Never throws: on any failure the
 * caller degrades to "non vérifié".
 */

export interface SiteSignals {
  robotsText: string | null;
  robotsReachable: boolean;
  sitemapFound: boolean | null;
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

export async function fetchSiteSignals(websiteUrl: string): Promise<SiteSignals> {
  const origin = originOf(websiteUrl);
  if (!origin) {
    return { robotsText: null, robotsReachable: false, sitemapFound: null };
  }

  const [robotsRes, sitemapRes] = await Promise.all([
    fetchWithTimeout(`${origin}/robots.txt`, 3000),
    fetchWithTimeout(`${origin}/sitemap.xml`, 3000),
  ]);

  let robotsText: string | null = null;
  let robotsReachable = false;
  if (robotsRes && robotsRes.ok) {
    robotsReachable = true;
    try {
      robotsText = (await robotsRes.text()).slice(0, 20000);
    } catch {
      robotsText = null;
    }
  }

  const sitemapFound = sitemapRes ? sitemapRes.ok : null;

  return { robotsText, robotsReachable, sitemapFound };
}
