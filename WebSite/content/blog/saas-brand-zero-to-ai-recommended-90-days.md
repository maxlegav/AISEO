---
title: "How a SaaS Brand Went From Zero AI Visibility to AI-Recommended in 90 Days"
excerpt: "A mid-sized B2B SaaS brand, a project management tool targeting SMBs, went from being completely absent from AI responses to being regularly recommended by ChatGPT, Perplexity, and Claude within 90 days. The tactics are replicable. The timeline is realistic."
date: "2026-02-04"
category: "Case Study"
readTime: "9 min read"
---

The client is a B2B project management tool for agencies — 15 to 50 person teams, mid-market positioning, US and UK focus. Good product, decent SEO, zero AI visibility. When we ran the baseline audit in October 2024, they were mentioned in **4 out of 100 prompts**. Their main competitor appeared in 68 out of the same 100.

Two of those 4 mentions were negative (Reddit complaints surfaced verbatim). The other two were brief list inclusions with no positive framing.

By day 90: 62% mention rate, consistently positive sentiment, appearing in ChatGPT, Perplexity, and Claude across all three query tiers.

Here's exactly what was done.

## Week 1: The Technical Audit Revealed an Embarrassing Problem

The first thing we checked was `robots.txt`. It contained this block:

```
User-agent: GPTBot
Disallow: /

User-agent: ClaudeBot
Disallow: /

User-agent: PerplexityBot
Disallow: /
```

An old Cloudflare Bot Fight Mode configuration, probably enabled during a security review 18 months earlier. Nobody had noticed it was blocking all three major AI crawlers. The fix took 20 minutes.

The corrected configuration:

```
User-agent: GPTBot
Allow: /

User-agent: OAI-SearchBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: Claude-User
Allow: /

User-agent: Claude-SearchBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Perplexity-User
Allow: /
```

Note: Anthropic now runs [three separate bots](https://almcorp.com/blog/anthropic-claude-bots-robots-txt-strategy/) (training, search indexing, real-time retrieval). OpenAI runs a parallel three-bot system. If you're only allowing GPTBot, you may be blocking ChatGPT-User — the bot that handles real-time link retrieval when a user clicks a citation. Allow all of them.

**Week 1 also produced an `llms.txt` file.** Created from scratch, deployed at `domain.com/llms.txt`. Structure:

```
# [Company Name]

> [Company Name] is a project management platform for creative and marketing agencies, helping teams of 10-60 people manage client projects, track time, and automate reporting.

## Key pages

- [Homepage](https://example.com): Overview, pricing, main value proposition
- [Features](https://example.com/features): Full feature list including time tracking, client portal, integrations
- [Integrations](https://example.com/integrations): Native integrations with Slack, HubSpot, Google Workspace, Zapier
- [Pricing](https://example.com/pricing): Plans for agencies of all sizes
- [Case Studies](https://example.com/customers): Real customer results

## Company

- Founded: 2019, headquartered in Austin TX
- Category: Project management software, agency management software
- Target customer: Marketing agencies, creative studios, consulting teams
```

The `llms.txt` standard (see [thinkdmg.com's explanation](https://thinkdmg.com/what-is-llms-txt-the-new-robots-txt-for-ai-explained/)) acts as a structured briefing for AI systems — a curated table of contents that gives models the context to describe you accurately.

## Weeks 2–3: Restructuring the 10 Most Important Pages

With crawl access restored, the next priority was making content extractable.

Before restructuring, the homepage opened with: *"[Company] is where great agencies get great work done. Streamline your workflow, delight your clients, and grow your business."* Compelling marketing copy. Zero extractable information.

After restructuring, the first paragraph read: *"[Company] is project management software for agencies with 10–60 people. It combines project tracking, client portals, time logging, and automated status reports in one platform. Agencies report saving an average of 4.2 hours per client per week on reporting alone."*

That's a paragraph AI can use. It contains: category, audience size, core features, and a specific outcome with a number.

Every key page got the same treatment:

- **Direct answer first:** The first 50 words answer the main question about the page
- **Feature tables:** Instead of "we support all major integrations," a table listing 23 specific integrations with links
- **FAQ sections appended to each page:** 5–8 questions per page, directly answering what buyers actually ask

The FAQ format for a feature page looked like this:

```
## Frequently Asked Questions

**Does [product] integrate with Slack?**
Yes. The native Slack integration sends automatic project updates, 
deadline reminders, and client approval requests directly to 
designated Slack channels. No Zapier required.

**Can clients access [product] without a paid account?**
Yes. Client portals are included on all plans. Clients get a 
separate login with view-only access to their projects, files, 
and invoices.

**Is there a free trial?**
14-day free trial, no credit card required. Full feature access 
during the trial period.
```

## Week 4: Schema Markup

Three schema types implemented and validated using [Google's Rich Results Test](https://search.google.com/test/rich-results):

**Organization Schema** (homepage):

```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "[Company Name]",
  "url": "https://example.com",
  "logo": "https://example.com/logo.png",
  "description": "Project management software for marketing and creative agencies with 10-60 employees.",
  "foundingDate": "2019",
  "sameAs": [
    "https://www.linkedin.com/company/example",
    "https://twitter.com/example",
    "https://www.g2.com/products/example",
    "https://www.capterra.com/p/example",
    "https://www.crunchbase.com/organization/example"
  ],
  "contactPoint": {
    "@type": "ContactPoint",
    "contactType": "customer support",
    "email": "support@example.com"
  }
}
```

The `sameAs` array is the most important property for AI entity recognition. [Research confirms](https://www.aivisible.co.uk/blog/blog-organization-schema.html) it's the single most powerful property for entity disambiguation — each URL tells AI systems that the entity on one page is the same entity at that URL, creating a verification network that models trust.

**SoftwareApplication Schema** (product page):

```json
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "[Product Name]",
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "Web, iOS, Android",
  "offers": {
    "@type": "Offer",
    "price": "29",
    "priceCurrency": "USD"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.7",
    "reviewCount": "312"
  }
}
```

**FAQ Schema** on all restructured pages — auto-generated from the FAQ sections added in weeks 2–3.

## Month 2: Building External Authority

Technical access is necessary but not sufficient. AI recommendations at the category level are driven by what the external web says about you, not by your own content.

**Reddit strategy (days 31–60):**

The founder created an account and spent three weeks building genuine presence in `r/agency`, `r/projectmanagement`, and `r/freelance`. The rule: no promotional content for the first month. Only genuinely useful responses to questions. Example: someone asked about tools for client reporting — the response described their internal process (before and after using any software) and mentioned three tools including their own as one option among equals.

By day 45, the account had 800+ karma and was recognized as a helpful regular contributor in all three subreddits. When promotional content eventually appeared (a case study, framed as "here's how we handled this problem"), it got upvotes rather than reports because the credibility was already built.

**Publication placements (days 35–55):**

Two guest posts placed on industry publications (DR 42 and DR 51). Both mentioned the brand in context as a solution example. Published by day 45. Not thought leadership pieces — practical, specific guides: "How agencies should structure their first client kickoff" and "The project management stack for a $2M agency." Real content that happened to include a brand mention.

**Existing high-ranking content (days 40–50):**

Used Ahrefs to identify comparison articles already ranking for "[category] tools for agencies" that were being cited by AI in our monitoring. Three articles qualified. Contacted two of them. One added the brand to their list within 8 days. The other required a small editorial fee (standard for roundup updates).

This tactic has asymmetric leverage: an article that already ranks and is already being cited by AI will immediately propagate any additions it contains. Getting added to one well-cited article is worth more than publishing 10 new articles on your own domain.

**PR (days 32–60):**

Responded to three journalist queries via [HARO](https://www.helpareporter.com) (Help A Reporter Out) and [Featured.com](https://featured.com). One response was published in a recognized industry outlet by day 52. One short mention in a "tools we're watching" newsletter with 18K subscribers.

## Day 60 Check-In: 4% to 31%

Mention rate at day 60: **31%** (up from 4%). Sentiment had flipped from negative/neutral to predominantly positive. The negative Reddit threads were still present but now outnumbered by positive mentions, which shifted how AI framed its responses.

By day 75: **47%**. By day 90: **62%** across the full 100-prompt set, with consistently positive framing across ChatGPT, Perplexity, and Claude.

The pattern was compounding: each new external citation made the brand more visible, which produced more AI mentions, which drove more traffic, which produced more reviews and user content, which reinforced the citations.

## The Business Numbers

AI platform traffic increased 43% over the 90-day period. More importantly, [consistent with the data from Seer Interactive and Semrush](https://www.seerinteractive.com/insights/case-study-6-learnings-about-how-traffic-from-chatgpt-converts), conversion rates from AI-referred visitors were 2.1x the rate from Google organic. The pipeline impact was measurable within 60 days of the technical fixes.

The fastest ROI came from the robots.txt fix. That was 20 minutes of work with immediate visibility improvement. The slowest ROI came from Reddit — it required genuine investment of time before producing results, but it produced the most durable improvement because community presence doesn't disappear when you stop running ads.

## What Makes This Replicable

The sequence matters:

1. **Technical foundation first** (robots.txt, llms.txt, schema) — without this, everything else is slower
2. **Content restructuring second** — extractable content enables AI to describe you accurately
3. **External authority third** — Reddit, publications, comparison articles, PR
4. **Monitoring throughout** — you need visibility into what's working so you can double down

None of these tactics are novel. What's novel is applying them systematically to AI visibility rather than traditional SEO ranking. The mechanics are different enough that most brands haven't adapted their content and distribution strategy yet — which is exactly the window that currently exists.

## Try It on Your Own Brand

ShowYourBrand runs 100 prompts across ChatGPT, Claude, Perplexity, Gemini and Grok. You get a GEO score, a detailed breakdown by AI engine, and a prioritized action plan. [Start your audit from €29 →](https://showyourbrand.app/#pricing)
