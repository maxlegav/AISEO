---
title: "llms.txt: The New File Your Website Needs (And Almost Nobody Has)"
excerpt: "If robots.txt is the file that tells search engines where they can go, llms.txt is the file that tells AI systems what they should know about you. It's a newer standard, and right now, the vast majority of websites don't have one."
date: "2026-02-06"
category: "Technical GEO"
readTime: "6 min read"
---

If robots.txt is the file that tells search engines where they can go, llms.txt is the file that tells AI systems what they should *know* about you.

It's a newer standard, and right now, the vast majority of websites don't have one.

## What Is llms.txt?

llms.txt is a plain text Markdown file placed at the root of your website (`yoursite.com/llms.txt`) that gives AI language models a concise, structured summary of your site: what you do, who you serve, and where to find the information that matters.

The concept was formally proposed on September 3, 2024, by [Jeremy Howard of Answer.AI](https://www.answer.ai/posts/2024-09-03-llmstxt.html). The specification lives at [llmstxt.org](https://llmstxt.org/) and the reference implementation is on [GitHub at AnswerDotAI/llms-txt](https://github.com/AnswerDotAI/llms-txt).

The problem it solves is real: AI models have finite context windows. When a model encounters your website, it can't ingest everything. llms.txt hands it a curated briefing document — similar to how `robots.txt` gives directives and `sitemap.xml` lists pages, but optimized for language model consumption rather than crawler logic.

Anthropic has published an llms.txt on their own site. [Mintlify](https://www.mintlify.com/blog/simplifying-docs-with-llms-txt), the docs platform, has adopted it. The Python library [Instructor](https://python.useinstructor.com/blog/2025/03/19/instructor-adopts-llms-txt/) published a post explaining their adoption. Adoption is early, which means there's still a real first-mover advantage in most categories.

One honest caveat: no major AI company — OpenAI, Google, Anthropic — has officially confirmed they parse llms.txt during training or inference. The file is not yet a guaranteed signal the way robots.txt directives are. But that cuts both ways: the downside of having one is essentially zero, and the upside as adoption grows is real.

## What Goes in an llms.txt File

The format is Markdown. It's meant to be readable by both machines and humans. A well-structured file typically contains:

- A one-paragraph description of your organization and what it does, written for information rather than marketing
- A list of your key pages with brief descriptions, so AI can navigate your content hierarchy without crawling everything
- Core facts in a parseable format: pricing, founding date, category, geographic coverage, key integrations
- Links to authoritative profiles elsewhere — LinkedIn, Crunchbase, Wikidata, industry directories

Keep it factual. The goal is to reduce ambiguity about who you are, not to write ad copy that AI will see through.

## A Working Example

```markdown
# Acme Corp

> Acme Corp builds browser-based invoicing software for freelancers and 
> small businesses. Founded in 2021, headquartered in Paris, France.

## Key Facts
- Category: SaaS / Business Software
- Pricing: From €29/month
- Founded: 2021
- Headquarters: Paris, France
- Languages: English, French

## Core Pages
- https://acmecorp.com: Product overview and feature descriptions
- https://acmecorp.com/pricing: Pricing plans and comparison
- https://acmecorp.com/blog: Technical guides and product updates
- https://acmecorp.com/docs: Full product documentation

## Official Profiles
- LinkedIn: https://linkedin.com/company/acmecorp
- Crunchbase: https://www.crunchbase.com/organization/acmecorp
- GitHub: https://github.com/acmecorp

## Key Differentiators
- Automatic PDF invoice generation
- Client management with history
- Stripe-integrated payment links
- EU VAT compliance built in
```

## The llms-full.txt Pattern

The spec also suggests an optional `llms-full.txt` — a more comprehensive version that includes your full documentation, all product details, or concatenated content. Some documentation platforms like Mintlify auto-generate this. If you have extensive technical docs, this file gives AI models a complete reference they can pull from at inference time.

## Why This Matters Now

AI systems are updated continuously. When they encounter an llms.txt during a crawl, it provides a reliable, first-party signal about your brand — sourced directly from you rather than inferred from third-party content or outdated cached pages.

In a category where most competitors haven't touched this file, having a well-crafted llms.txt is a differentiation that costs maybe 30 minutes to implement and compounds over time as AI adoption grows. It's also a useful forcing function: writing it requires you to articulate exactly what makes your brand distinct, in plain language, without jargon.

## Try It on Your Own Brand

ShowYourBrand audits your AI visibility across the full technical stack: robots.txt, llms.txt presence and quality, schema coverage, plus 100 prompts fired across ChatGPT, Claude, Perplexity, Gemini, and Grok. If you don't have an llms.txt, we flag it and tell you what it should say for your specific business context.

[Start your audit from €29 →](https://showyourbrand.app/#pricing)
