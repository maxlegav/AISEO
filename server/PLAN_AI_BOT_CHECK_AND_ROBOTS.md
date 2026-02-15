# Plan: AI Bot Accessibility Check + robots.txt Analysis

## Context
Our HTML scanner currently has no visibility into how AI engines (ChatGPT, Claude, Perplexity, Gemini, etc.) can access a website. Since the whole product is about AI discoverability, knowing whether AI bots are blocked or allowed is critical. Two new scanner modules will be added to the existing pipeline.

## Files to Modify

1. **`server/src/services/html_scanner.py`** — add 2 new analysis functions + integrate into pipeline + update scoring
2. **`server/src/models/audit.py`** — add 2 new fields to `HtmlScanResult`

No new files. No new dependencies (httpx already installed, `urllib.robotparser` is stdlib).

---

## Feature 1: AI Bot Accessibility Check

**What:** For each major AI bot, make a lightweight HEAD request with that bot's user agent and check the HTTP status code.

**Bots to test (9):**

| Bot | Platform | User Agent |
|-----|----------|------------|
| GPTBot | OpenAI (training) | `Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; GPTBot/1.1; +https://openai.com/gptbot)` |
| ChatGPT-User | OpenAI (browsing) | `Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; ChatGPT-User/1.0; +https://openai.com/bot)` |
| OAI-SearchBot | OpenAI (search) | `OAI-SearchBot/1.0` |
| ClaudeBot | Anthropic | `Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; ClaudeBot/1.0; +claudebot@anthropic.com)` |
| PerplexityBot | Perplexity | `Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; PerplexityBot/1.0; +https://perplexity.ai/perplexitybot)` |
| Google-Extended | Google (Gemini) | `Google-Extended` |
| Bingbot | Microsoft (Copilot) | `Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)` |
| meta-externalagent | Meta AI | `meta-externalagent/1.1` |
| Applebot-Extended | Apple Intelligence | `Applebot-Extended` |

**Implementation:** New async function `check_ai_bot_accessibility(url)` using httpx HEAD requests for all 9 bots in parallel via `asyncio.gather()`. SSRF-safe via existing `_validate_url()`. Returns accessible count, blocked list, per-bot status codes.

**Return structure:**
```python
{
    "totalBots": 9,
    "accessible": 7,
    "blocked": 2,
    "botResults": [
        {"name": "GPTBot", "status": 200, "accessible": True},
        {"name": "Google-Extended", "status": 403, "accessible": False},
        ...
    ],
    "blockedBots": ["Google-Extended", "Bingbot"],
    "accessibilityScore": 77.8  # percentage accessible
}
```

---

## Feature 2: robots.txt Analysis

**What:** Fetch `/robots.txt`, parse it with Python's built-in `urllib.robotparser.RobotFileParser`, and check AI bot directives.

**Implementation:** New async function `analyze_robots_txt(url)` using httpx GET. Checks:
- Does robots.txt exist?
- Blanket `Disallow: /` for `User-agent: *`?
- Which AI bots are explicitly blocked/allowed?
- Crawl-delay values per bot?
- Sitemap declarations?

**Return structure:**
```python
{
    "exists": True,
    "sitemaps": ["https://example.com/sitemap.xml"],
    "blanketDisallow": False,
    "aiBotsBlocked": ["GPTBot", "Google-Extended"],
    "aiBotsAllowed": ["ClaudeBot"],
    "crawlDelays": {"GPTBot": 10},
    "botDirectives": [
        {"bot": "GPTBot", "allowed": False, "crawlDelay": 10},
        {"bot": "ClaudeBot", "allowed": True, "crawlDelay": None},
        ...
    ],
    "issues": ["Missing sitemap declaration"]
}
```

---

## Scoring Rebalance

Redistribute weights to include the 2 new modules (total still 100%):

| Module | Before | After |
|--------|--------|-------|
| W3C | 10% | 8% |
| Links | 10% | 8% |
| Schema.org | 20% | 18% |
| Meta tags | 20% | 18% |
| Headings | 15% | 13% |
| Alt text | 15% | 13% |
| Keywords | 10% | 8% |
| **AI Bot Access** | — | **10%** |
| **robots.txt** | — | **4%** |

**AI Bot Access scoring (10%):** percentage of bots that get HTTP 2xx.

**robots.txt scoring (4%):**
- +40 points if robots.txt exists
- +20 points if has sitemap declaration
- +20 points if no blanket `Disallow: /`
- +20 points if no AI bots explicitly blocked

---

## Integration into `_scan_single_page()`

Both new functions are async (httpx), so they slot directly into the existing `asyncio.gather()`:

```python
(w3c, link, schema, meta, heading, alt, keyword, ai_bots, robots) = await asyncio.gather(
    asyncio.to_thread(validate_html_w3c, html),
    asyncio.to_thread(check_links_lychee, url),
    asyncio.to_thread(extract_schema_org, html, url, business_type),
    asyncio.to_thread(analyze_meta_tags, html, language),
    asyncio.to_thread(analyze_headings, html),
    asyncio.to_thread(audit_images, html),
    asyncio.to_thread(extract_keywords, html, language),
    check_ai_bot_accessibility(url),   # NEW - already async, no thread needed
    analyze_robots_txt(url),           # NEW - already async, no thread needed
)
```

Model update in `HtmlScanResult`:
```python
aiBotAccessibility: dict = {}
robotsTxtAnalysis: dict = {}
```

Completeness tracking follows existing pattern — if the function returns an `"error"` key, mark as unavailable and re-normalize scoring weights.

---

## Verification Steps

1. Rebuild Docker: `docker compose up --build -d`
2. Test on shigure.fr: `curl -X POST http://localhost:8080/html-scan -H "Content-Type: application/json" -H "Authorization: Bearer <token>" -d '{"url":"https://shigure.fr"}'`
3. Confirm response includes `aiBotAccessibility` and `robotsTxtAnalysis` fields
4. Confirm all 9 bots have results
5. Confirm score reflects the new weights
6. Test on a site known to block AI bots (e.g., major news sites) to verify blocking detection works
