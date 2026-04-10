---
title: "Is Your Website Invisible to ChatGPT? Check Your robots.txt Right Now"
excerpt: "There is a single configuration file on your website that could be making your entire online presence invisible to AI. Not hard to find. Not hard to rank. Invisible. It's called robots.txt, and if it's misconfigured, ChatGPT literally cannot read your website."
date: "2026-02-16"
category: "Technical GEO"
readTime: "6 min read"
---

This post might be the most important three-minute read of your marketing year.

There is a single configuration file on your website, one that most marketing teams have never looked at, that could be making your entire online presence invisible to AI. Not hard to find. Not hard to rank. *Invisible*. Not there at all.

It's called robots.txt. And if it's misconfigured, ChatGPT, Claude, Perplexity, and Gemini literally cannot read your website.

## What Is robots.txt?

robots.txt is a plain text file that lives at the root of your website: `yoursite.com/robots.txt`. It tells web crawlers which pages they're allowed to index and which to skip.

For decades, it was primarily about Google's Googlebot and Bing's Bingbot. Marketers and developers configured it once, never touched it again, and moved on.

Then AI arrived. And AI systems have their own crawlers. And those crawlers respect robots.txt, which means if you accidentally (or deliberately) blocked them, they are not reading your content. They are not learning about your brand. They are not recommending you. You do not exist.

## Which Bots to Check

Open your robots.txt file right now. The URL is simply `https://yourdomain.com/robots.txt`. Look for any of these:

- **GPTBot**: OpenAI's primary crawler (ChatGPT)
- **ChatGPT-User**: used for real-time browsing within ChatGPT
- **OAI-SearchBot**: OpenAI's search-focused crawler
- **ClaudeBot**: Anthropic's crawler (Claude)
- **Claude-SearchBot** and **Claude-User**: additional Anthropic bots
- **PerplexityBot**: Perplexity's crawler
- **Perplexity-User**: Perplexity real-time browsing
- **Google-Extended**: used for Google's AI training and AI Overviews

If you see `Disallow: /` next to any of these, you are blocking that AI entirely. You have put a "no entry" sign on your door and are wondering why AI never visits.

## The Fix (Takes 2 Minutes)

If you need to allow these bots, add the following to your robots.txt:

```
User-agent: GPTBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: OAI-SearchBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: Claude-SearchBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Google-Extended
Allow: /
```

Save. Done. You've just opened the door to every major AI platform.

## The Hidden Danger: Cloudflare

If your site is behind Cloudflare (and a very large number of sites are), be aware that Cloudflare has AI bot protection features that can block AI crawlers at the CDN level, *before* they even reach your robots.txt. Garry Tan, President of Y Combinator, publicly reported that Cloudflare blocked all AI crawlers on Y Combinator's own domain without notifying them.

Check your Cloudflare firewall settings and "Bot Fight Mode" configuration specifically. If it's enabled with aggressive settings, you may be blocking AI regardless of what your robots.txt says.

## Why This Matters More Than You Think

One of Vercel's top e-commerce customers found that ChatGPT was referring 8% of their traffic, up 848% year over year. That's for a single site, in retail. Imagine being in a SaaS category where research-heavy buyers use AI constantly, and then discovering you blocked all of it.

The opportunity cost of being invisible to AI is not theoretical. It is compounding daily.

## What Show Your Brand Checks

The **Show Your Brand GIO audit** includes a full technical scan of your robots.txt, llms.txt, and HTML structure as part of every audit. We tell you exactly which AI bots can access your site, which can't, and what to fix. Beyond the technical layer, we then send 100 prompts across AI platforms to see what happens once they *can* access you, what they say, how they describe you, whether they trust you.

Technical access is step one. What AI does with your content once it gets in is step two.
