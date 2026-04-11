---
title: "Is Your Website Invisible to ChatGPT? Check Your robots.txt Right Now"
excerpt: "There is a single configuration file on your website that could be making your entire online presence invisible to AI. Not hard to find. Not hard to rank. Invisible. It's called robots.txt, and if it's misconfigured, ChatGPT literally cannot read your website."
date: "2026-02-16"
category: "Technical GEO"
readTime: "6 min read"
---

There is a single configuration file on your website — one most marketing teams have never looked at — that could be making your entire brand invisible to AI. Not hard to rank. Not buried in search results. *Not there at all.*

It's robots.txt. And if it's misconfigured for AI crawlers, ChatGPT, Claude, Perplexity, and Gemini literally cannot read your site.

## What Is robots.txt?

robots.txt is a plain text file at `yoursite.com/robots.txt`. It tells crawlers which paths they're allowed to fetch. For decades, it was primarily about Googlebot and Bingbot. Configure it once, move on.

Then AI arrived with its own fleet of crawlers, and those crawlers respect robots.txt. If you blocked them — deliberately or accidentally — they are not reading your content. They are not building a representation of your brand in their training data. You do not exist in their world.

Open your robots.txt file right now: `https://yourdomain.com/robots.txt`.

## The AI Bots You Need to Allow

Here are the primary AI crawlers and their official documentation:

**OpenAI** operates three crawlers, documented at [platform.openai.com/docs/bots](https://platform.openai.com/docs/bots):
- `GPTBot` — training data collection for GPT models
- `ChatGPT-User` — real-time browsing when a user asks ChatGPT to look something up
- `OAI-SearchBot` — OpenAI's search-focused crawler

**Anthropic** operates three crawlers, documented at [support.claude.com](https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler):
- `ClaudeBot` — training data for Claude models (replaced the deprecated `Claude-Web` and `Anthropic-AI` strings)
- `Claude-User` — fetches pages in response to live user queries
- `Claude-SearchBot` — indexes content for Claude's search features

**Perplexity** uses `PerplexityBot`, documented at [docs.perplexity.ai/docs/resources/perplexity-crawlers](https://docs.perplexity.ai/docs/resources/perplexity-crawlers). Note: there have been reports of Perplexity-User not fully honoring robots.txt in real-time browsing mode — worth knowing if you're specifically trying to control access.

**Google** uses `Google-Extended` specifically for AI training data (Gemini, Vertex AI). Documented at [developers.google.com/crawling/docs/crawlers-fetchers/overview-google-crawlers](https://developers.google.com/crawling/docs/crawlers-fetchers/overview-google-crawlers). Importantly, Google-Extended does *not* affect regular Googlebot crawling or search ranking — it's a separate signal for AI training only.

## The Fix

If you need to allow these bots (most sites should), add this to your robots.txt:

```
User-agent: GPTBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: OAI-SearchBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: Claude-User
Allow: /

User-agent: Claude-SearchBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Google-Extended
Allow: /
```

If you *want* to block AI training crawlers but still allow real-time AI browsing (a legitimate choice for content publishers), you can be granular:

```
# Block AI model training crawlers
User-agent: GPTBot
Disallow: /

User-agent: ClaudeBot
Disallow: /

User-agent: Google-Extended
Disallow: /

# Allow real-time AI browsing (still lets AI cite you in answers)
User-agent: ChatGPT-User
Allow: /

User-agent: Claude-User
Allow: /
```

## The Cloudflare Problem

If your site is behind Cloudflare — and a very large share of the web is — be aware that Cloudflare added a one-click "Block AI bots" feature in July 2024. More than one million Cloudflare customers have enabled it. The blocking happens at the CDN layer, *before* crawlers even see your robots.txt.

Check your Cloudflare dashboard under Security → Bots. The "AI Crawlers and Scrapers" managed rule and "Bot Fight Mode" both have the potential to block legitimate AI crawlers. Cloudflare's own documentation at [developers.cloudflare.com/bots/additional-configurations/block-ai-bots](https://developers.cloudflare.com/bots/additional-configurations/block-ai-bots/) explains the options. Use "AI Crawl Control" if you want to allow specific bots rather than all or nothing.

## Why the Stakes Are Real

A Cloudflare analysis published in their [2025 crawl report](https://blog.cloudflare.com/from-googlebot-to-gptbot-whos-crawling-your-site-in-2025/) found that GPTBot is now the most active AI crawler on their network, having overtaken Bytespider. AI-referred traffic is growing fast across every category. Being blocked means zero share of that traffic, compounding daily.

Robots.txt and CDN configuration aren't glamorous. But they're the prerequisite for everything else: schema markup, llms.txt, content strategy. None of it matters if the bots can't get in.

## Try It on Your Own Brand

ShowYourBrand audits your full AI technical stack: robots.txt configuration, llms.txt presence, and schema coverage — then fires 100 prompts across ChatGPT, Claude, Perplexity, Gemini, and Grok to see what AI actually says about you once it *can* reach your site. Technical access is step one. What AI does with your content after it gets in is step two.

[Start your audit from €29 →](https://showyourbrand.app/#pricing)
