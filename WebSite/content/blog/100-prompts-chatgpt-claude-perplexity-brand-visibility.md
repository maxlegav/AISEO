---
title: "We Tested 100 Prompts on ChatGPT, Claude, and Perplexity. Here's What We Found About Brand Visibility"
excerpt: "We ran 100 prompts across three query categories and three AI platforms. The patterns we found reveal exactly how AI decides which brands to surface, and which to ignore. Five findings every brand needs to understand."
date: "2026-02-02"
category: "Research"
readTime: "8 min read"
---

We ran a structured experiment. 100 prompts. Three query categories. Five AI platforms: ChatGPT (GPT-4o), Claude (Sonnet), Perplexity, Gemini, and Grok. One goal: understand the actual mechanics of which brands get recommended and which disappear.

The results were consistent enough to generate clear patterns — and those patterns contradict a lot of assumptions about what drives AI visibility.

## The Prompt Framework

We organized prompts into three tiers that mirror a real buyer journey.

**Tier 1 — Category-level discovery** (e.g., "What's the best [category] tool for a 15-person startup?"): High volume, high competition. These are the prompts every brand in the category theoretically wants to win.

**Tier 2 — Feature-specific evaluation** (e.g., "What [category] tools have native Slack integration and a free trial?"): Mid-funnel. The buyer has formed requirements and is filtering options.

**Tier 3 — Trust and sentiment** (e.g., "Is [brand] reliable?", "What are the downsides of [brand]?", "[Brand A] vs [Brand B]?"): Late-funnel, decision-stage. The user is close to committing and doing final diligence.

We tested each tier across all five platforms and tracked: presence (was the brand mentioned?), positioning (first mention vs. later mention), sentiment framing, and sources cited.

## Finding 1: Category Queries Are Won by External Authority, Not Your Website

For Tier 1 broad queries, the brands that consistently appeared weren't those with the best product pages or most comprehensive documentation. They were the brands most frequently discussed across *external* sources — Reddit, industry publications, comparison sites, G2/Capterra.

[Research from Onely confirms this pattern](https://www.onely.com/blog/how-chatgpt-decides-which-brands-to-recommend/): 41% of ChatGPT commercial recommendations derive from authoritative list mentions across third-party publications. Only 16% come from review sites, and a brand's own website content plays a relatively small direct role.

In our test, Brand A had an exceptional website, detailed feature documentation, and a well-structured blog. Brand B had a mediocre website but was mentioned in 12 independent articles, had 80+ G2 reviews, and had an active presence in three relevant subreddits. Brand B appeared in 71% of Tier 1 prompts. Brand A appeared in 19%.

Your homepage doesn't win category queries. The web talking about you does.

## Finding 2: Feature Queries Are Won by Structured, Extractable Content

Tier 2 flipped the pattern. For feature-specific queries, brands with clearly structured content won — particularly those with:

- Explicit feature comparison tables
- Bulleted integration lists (e.g., "Native integrations: Slack, HubSpot, Salesforce, Zapier")
- Direct FAQ answers like "Does [product] support SSO?" followed by a specific yes/no + details

Brands describing features only in prose narrative, however well-written, were frequently skipped even when the feature existed and was technically superior.

The mechanism here relates to how language models extract information. AI doesn't "read" pages the way humans do — it pattern-matches on structured signals. A page that says "we support all major integrations to help your team stay connected" gives the model nothing extractable. A page that says "Native integrations: Slack, Teams, HubSpot, Salesforce, Notion, Zapier — see full list" gives it a concrete fact it can reproduce in a recommendation.

**What to implement:** FAQ schema on every feature page. Start pages with direct answers (not preamble). Build explicit comparison tables for "does it have X" questions. According to [Search Engine Land's schema coverage](https://searchengineland.com/schema-markup-ai-search-no-hype-472339), comprehensive schema implementation increases AI citation likelihood by up to 40%.

## Finding 3: Sentiment Queries Surface Reddit and Review Sites Almost Exclusively

For Tier 3 trust queries, no brand's own website appeared as a source. Not once.

AI drew almost entirely from Reddit threads, G2/Capterra reviews, and industry media. Brands with active, substantive Reddit presence were described with specific, warm language. Brands without Reddit presence either didn't appear or were described in generic, non-differentiating terms.

The implication is uncomfortable: the way AI describes your brand to a buyer who's about to make a decision is almost entirely determined by what strangers on the internet wrote about you, not by your own marketing content.

This also means negative mentions are dangerous in a specific way — they're sticky. [Research on how ChatGPT selects brands](https://www.trysight.ai/blog/how-chatgpt-chooses-brands-to-recommend) shows that 71% of AI citations reference content from 2023–2025. Old Reddit complaints and critical reviews from two years ago are still actively shaping how AI describes you today.

## Finding 4: Each Platform Has Distinct Source Biases

The five platforms showed meaningfully different behavior:

**ChatGPT (GPT-4o):** Strongest preference for Wikipedia entries, long-form content from established publications (TechCrunch, Forbes, VentureBeat), and content with high link authority. Least likely to surface small, independent sources. Accounts for [87.4% of all AI referral traffic](https://www.brightedge.com/news/press-releases/brightedge-data-finds-ai-accounts-less-1-search-organic-traffic-continues), so this platform's bias matters most for traffic volume.

**Perplexity:** Heavily surfaces Reddit content — more than any other platform we tested. For sentiment queries, Reddit was cited in over 70% of Perplexity responses. Perplexity also cites sources explicitly with links, making it the most transparent about where its information comes from.

**Claude:** Most willing to synthesize from a broad range of sources, including well-structured smaller websites. If your content is well-organized with clear headings and direct answers, Claude is most likely to pick it up even without high external authority. Claude showed 58% month-over-month growth in mid-2025.

**Gemini:** Strong bias toward Google-indexed properties — YouTube, Google Maps, Google Business Profiles. For local or product-category queries, Gemini surfaces structured data from Google's ecosystem more than external editorial content.

**Grok:** Still building its source corpus but showed heavy reliance on X (formerly Twitter) content and recent news. Most volatile results of the five platforms — responses varied more across repeated testing. Showed 1,279% growth in referral traffic in mid-2025 from a small base.

**Practical implication:** Don't build your GEO strategy around one platform. A brand that optimizes only for ChatGPT will be invisible on Perplexity and vice versa. The distribution of effort across platform-specific tactics matters.

## Finding 5: Prompting Methodology Affects Results — Test Consistently

One finding that surprised us: prompt phrasing affects which brands appear significantly. "Best project management tool for startups" produced different results than "top project management software for small teams." The same brands didn't always appear across both.

This has a direct implication for how you should design your GEO tracking. If you test with different prompt variations each month, you're measuring prompt variation, not visibility change. Effective prompt testing requires:

- A **fixed prompt set** of 80–100 prompts that doesn't change month to month
- **Multiple phrasings** of the same intent (so you catch brand appearances across natural language variation)
- **Repeated tests** of the same prompt on the same platform in the same session (AI responses have some non-determinism — running a prompt once and recording it is noisy data)
- **Separation by query tier** so you know whether improvements are in awareness, evaluation, or trust queries

Platforms like [Promptmonitor](https://promptmonitor.io) and [Otterly.ai](https://otterly.ai) handle the consistency problem by running fixed prompt sets on schedule and normalizing results. Manual testing can work for smaller prompt sets but requires rigorous methodology to be meaningful.

## What These Five Findings Map To

Every finding here corresponds to a concrete optimization lever:

- Win category queries → build external citations (press, directories, Reddit presence, review volume)
- Win feature queries → restructure content with explicit answers, tables, and FAQ schema
- Win sentiment queries → invest in community presence and proactively address review gaps
- Win across platforms → don't optimize for ChatGPT only; build Reddit presence for Perplexity, structured content for Claude
- Measure accurately → use a consistent, fixed prompt set across all platforms, not ad-hoc testing

The brands pulling away from their competitors in AI visibility aren't doing all of this at once. They're doing it systematically, in priority order, starting from a measured baseline.

## Try It on Your Own Brand

ShowYourBrand runs 100 prompts across ChatGPT, Claude, Perplexity, Gemini and Grok. You get a GEO score, a detailed breakdown by AI engine, and a prioritized action plan. [Start your audit from €29 →](https://showyourbrand.app/#pricing)
