---
title: "Is Your Brand Invisible to AI? Take This 10-Point GEO Self-Audit"
excerpt: "Before investing in any optimization strategy, you need to know where you stand today. This 10-point self-audit will help you identify the biggest gaps in your current AI visibility. Work through each point honestly and see where you stand."
date: "2026-01-17"
category: "GEO Audit"
readTime: "8 min read"
---

[BrightEdge data shows](https://www.brightedge.com/news/press-releases/brightedge-data-finds-ai-accounts-less-1-search-organic-traffic-continues) that ChatGPT alone accounts for 87.4% of all AI referral traffic. Most brands don't know whether they appear in those results at all — let alone how they're described when they do.

This self-audit takes about 30 minutes. It won't give you the full picture (100 prompts across 5 platforms will), but it will tell you whether you have obvious gaps that need immediate attention, and give you a concrete starting score to beat.

Score yourself **0** (not done), **1** (partially done), or **2** (fully done). Max score: 20 points.

---

## Point 1: AI Crawler Access (0 or 2)

**What to check:** Go to `yourdomain.com/robots.txt` and search for GPTBot, ClaudeBot, PerplexityBot, OAI-SearchBot, and Claude-SearchBot.

**The detail that trips people up:** Anthropic now runs three separate bots — `ClaudeBot` (training), `Claude-SearchBot` (search indexing), and `Claude-User` (real-time retrieval). If you're only allowing `ClaudeBot`, you may be blocking Claude from using your content in live responses. Same logic applies to OpenAI: `GPTBot` handles training, `OAI-SearchBot` handles indexing, and `ChatGPT-User` handles real-time link clicks from chat responses.

[62% of sites block GPTBot and 69% block ClaudeBot](https://almcorp.com/blog/anthropic-claude-bots-robots-txt-strategy/) — often unintentionally through Cloudflare Bot Fight Mode or generic "block all bots" rules.

**Also check:** Cloudflare dashboard > Security > Bots. Verify "AI Scrapers and Crawlers" blocking is not enabled if you want AI visibility.

**Score 0:** Any major AI bot is blocked (or your robots.txt doesn't explicitly address them and a blanket `Disallow: /` exists).

**Score 2:** GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot, Claude-SearchBot, Claude-User, PerplexityBot, and Perplexity-User all have `Allow: /` entries.

---

## Point 2: llms.txt Presence and Quality (0 or 2)

**What to check:** Go to `yourdomain.com/llms.txt`.

**What a good llms.txt contains:** Company name and one-sentence description at the top. A brief overview paragraph (2–4 sentences) with your category, target customer, and core differentiation. A structured list of your most important pages with descriptions. Optionally: founding date, location, key people.

**Template:**
```
# [Company Name]

> [One sentence: what you do, for whom]

## Key pages
- [Homepage](url): [one-line description]
- [Product/Features](url): [one-line description]
- [Pricing](url): [one-line description]
- [About](url): [one-line description]
```

**Score 0:** File doesn't exist.

**Score 2:** File exists, contains accurate company description, categorization, and links to key pages.

---

## Point 3: Organization Schema Markup (0, 1, or 2)

**What to check:** Go to [Google's Rich Results Test](https://search.google.com/test/rich-results), enter your homepage URL, and look for Organization schema in the results.

**The most important property:** `sameAs`. This array of URLs tells AI systems that the entity on your page is the same entity on LinkedIn, G2, Crunchbase, and your social profiles. It's the single most powerful property for AI entity recognition — [connecting your schema to external profiles can deliver significantly higher citation rates](https://www.aivisible.co.uk/blog/blog-organization-schema.html).

**Minimum viable Organization schema:**
```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Your Company",
  "url": "https://yoursite.com",
  "logo": "https://yoursite.com/logo.png",
  "description": "One clear sentence about what you do and for whom.",
  "sameAs": [
    "https://www.linkedin.com/company/yourcompany",
    "https://twitter.com/yourhandle",
    "https://www.g2.com/products/yourproduct",
    "https://www.crunchbase.com/organization/yourcompany"
  ]
}
```

**Score 0:** No Organization schema on homepage.

**Score 1:** Schema exists but is missing `sameAs` links.

**Score 2:** Schema exists with name, URL, logo, description, and at least 3 `sameAs` links to external profiles.

---

## Point 4: FAQ Schema on Key Pages (0, 1, or 2)

**What to check:** Use [Google's Rich Results Test](https://search.google.com/test/rich-results) on your top 3 pages (homepage, main product page, pricing page). Look for FAQ schema in the structured data panel.

**Why this matters for AI:** Feature-specific queries ("does [product] support SSO?", "what integrations does [product] have?") are won by brands with explicitly structured answers that AI can extract. FAQ sections with schema markup are the most reliable way to surface in these queries.

**What to audit per page:** Does a FAQ section exist? Are questions phrased as buyers actually ask them ("Does it integrate with Slack?" not "Integration capabilities")? Is FAQ schema markup implemented?

You can validate FAQ schema in the terminal with: `curl -s "https://search.google.com/test/rich-results?url=https://yoursite.com/your-page" | grep -i "faqPage"` — but the visual Rich Results Test is easier.

**Score 0:** No FAQ sections on key pages.

**Score 1:** FAQ sections exist but no schema markup (check source code for `"@type": "FAQPage"`).

**Score 2:** FAQ sections present with validated FAQ schema on at least 3 key pages.

---

## Point 5: Content Opening Quality (0, 1, or 2)

**What to check:** Open your three most important pages. Read only the first 50 words of each.

**The test:** Could an AI reproduce a useful, specific description of what you offer from just those first 50 words? Or does it read like marketing preamble ("We believe in empowering teams...")?

AI models prioritize content that answers questions directly and contains specific, extractable facts. The opening paragraph of your page is disproportionately weighted in how AI describes you.

**Before (fails):** "Streamline your workflow and delight your clients with our all-in-one platform designed for modern teams."

**After (passes):** "[Product] is project management software for marketing agencies with 10–50 people. It combines project tracking, time logging, client portals, and automated reporting. Agencies report saving 4+ hours per week on client status updates."

**Score 0:** First paragraph is marketing language with no extractable facts.

**Score 1:** Answer is present but buried after preamble.

**Score 2:** First 50 words contain: category, target audience, core capability, and at least one specific differentiator or outcome.

---

## Point 6: External Citation Footprint (0, 1, or 2)

**What to check:**

1. Google search: `"[your brand name]" -site:yourdomain.com` — count the independent third-party mentions on page 1
2. Google search: `site:g2.com "[your product name]"` — count G2 reviews
3. Google search: `site:capterra.com "[your product name]"` — count Capterra reviews

**Why this is the most important lever for category queries:** [Research shows 41% of ChatGPT's commercial brand recommendations derive from authoritative list mentions](https://www.onely.com/blog/how-chatgpt-decides-which-brands-to-recommend/) on third-party publications. Your own website content plays a much smaller direct role in whether you appear in broad category queries.

**Score 0:** Only your own website and social profiles on Google page 1. Fewer than 20 reviews across G2/Capterra combined.

**Score 1:** 2–4 independent mentions. 20–50 third-party reviews.

**Score 2:** 6+ independent mentions from diverse authoritative sources. 50+ third-party reviews with a 4.0+ average.

---

## Point 7: Reddit Presence (0, 1, or 2)

**What to check:** Run this Google search: `site:reddit.com "[your brand name]"`. Then also search: `site:reddit.com "[your category]"` and scan the top 20 results for any mention of your brand.

**Why Reddit matters specifically:** Perplexity surfaces Reddit content more heavily than any other AI platform. For trust and sentiment queries ("is [brand] reliable?", "what do people think of [brand]?"), AI draws almost exclusively from Reddit threads and review sites — not your website. If you have no Reddit presence, AI will describe you in generic terms, or not at all.

**Score 0:** Zero Reddit mentions, or only negative ones.

**Score 1:** Occasional neutral mentions, no active community presence.

**Score 2:** Multiple substantive, positive threads in 2+ relevant subreddits. Your brand appears naturally in category discussions, not just in promotional posts.

---

## Point 8: Content Freshness (0, 1, or 2)

**What to check:**

1. When were your key pages last substantively updated? (Check the `<meta name="date">` tag or your CMS)
2. Go to `yourdomain.com/sitemap.xml` and check the `<lastmod>` dates for your key pages — do they reflect real update dates, or are they all set to the sitemap generation date?

**Why this matters:** [Research shows 71% of AI citations reference content from 2023–2025](https://www.trysight.ai/blog/how-chatgpt-chooses-brands-to-recommend). Stale content gets deprioritized. More practically: if you've added features, changed pricing, or shifted positioning but your key pages still describe your 2022 product, AI is describing your 2022 product to buyers.

**The sitemap test:** Open your sitemap and check if all `<lastmod>` dates are identical (a sign they're auto-generated). Tools like Screaming Frog (free up to 500 URLs) will show you accurate crawl dates.

**Score 0:** Core pages last updated 12+ months ago, or `lastmod` dates are all identical (auto-generated).

**Score 1:** Updated within the past year but not regularly refreshed.

**Score 2:** Core pages updated within the past 4 months with accurate `lastmod` tags matching actual content changes.

---

## Point 9: Manual AI Mention Test (0, 1, or 2)

**What to test:** Open ChatGPT (GPT-4o), Perplexity, and Claude separately. In each, run:

- "What are the best [your exact category] tools for [your target audience]?"
- "I'm looking for [your category] software for [your use case] — what do you recommend?"
- "What do users think of [your brand name]?"

Record: Does your brand appear? Is it mentioned positively? Does AI describe your features accurately? Does it mention competitors you don't want to be compared to?

Run each prompt twice in separate sessions — AI responses have some non-determinism, and a single run can be misleading.

**Score 0:** Not mentioned in any platform, or mentioned with inaccurate or negative framing.

**Score 1:** Mentioned on one platform, neutrally, without specific positive attributes.

**Score 2:** Mentioned on at least two platforms with positive framing and at least one accurate specific attribute.

---

## Point 10: Competitor Benchmarking (0, 1, or 2)

**What to check:** Run the same Tier 1 and Tier 2 prompts from Point 9 and note specifically how your top two competitors are described versus how you are.

**What to measure:**
- Are competitors mentioned before you (position in response)?
- Are they described with more specific positive attributes?
- Are they recommended for use cases that you also serve?

If your competitor is described as "ideal for agencies that need [specific feature]" and you're described as "also a good option," that's a content and external authority problem with a specific fix.

**Score 0:** Competitors mentioned prominently and positively; you are not mentioned.

**Score 1:** Both mentioned, but competitors described more specifically and favorably.

**Score 2:** You are mentioned at least as early and with comparable or stronger positive framing as your main competitors.

---

## Your Score

| Score | What it means |
|---|---|
| **0–7 points** | Significant foundational gaps. You're likely invisible or mis-described across most AI platforms. Start with Points 1, 3, and 5 — they're fastest to fix and most impactful. |
| **8–13 points** | Technical foundation is partially in place but external authority and content quality are limiting visibility. Points 6, 7, and 9 are your priority. |
| **14–18 points** | Strong foundation. You're visible but likely not dominating. A full 100-prompt audit will surface the specific competitive gaps and the marginal improvements with disproportionate impact. |
| **19–20 points** | You're doing this right. The next level is continuous monitoring, competitor benchmarking, and optimizing for the specific prompts that drive the highest-value buyer intent. |

---

## What This Self-Audit Doesn't Tell You

This 10-point checklist catches the obvious failures. What it can't tell you:

- How exactly AI describes your brand across 100 specific prompts, including the ones your best-fit buyers are actually asking
- Whether your sentiment is trending positive or negative over time
- Which specific external sources AI is drawing on when it talks about you
- How you compare to competitors on a per-platform, per-query-type basis
- Which of your pages are being actively cited versus merely indexed

That's what a full 100-prompt audit measures — systematically, across all major AI engines, with source citation analysis and competitive benchmarking built in.

If this self-audit revealed even three gaps, a full audit will reveal the complete picture. And the complete picture is what turns GEO investment from guesswork into a prioritized action plan.

## Try It on Your Own Brand

ShowYourBrand runs 100 prompts across ChatGPT, Claude, Perplexity, Gemini and Grok. You get a GEO score, a detailed breakdown by AI engine, and a prioritized action plan. [Start your audit from €29 →](https://showyourbrand.app/#pricing)
