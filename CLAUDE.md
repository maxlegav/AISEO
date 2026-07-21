# CLAUDE.md

This file provides guidance to Claude Code / AI agents working in this repository.

> **This is the monorepo-level guide.** The most detailed, up-to-date guide for the
> main app lives in [`WebSite/CLAUDE.md`](WebSite/CLAUDE.md). Read that too before
> working in `WebSite/`.

## What this project is

**ShowYourBrand (SYB v2)** is a **continuous GEO monitoring tool** — a French
clone of Promptmonitor / Temso. Users configure brands, competitors and prompts;
the app queries ChatGPT / Claude / Perplexity / Gemini automatically (weekly or
daily), stores results, computes a **per-LLM visibility score** and tracks it
over time (competitors, cited sources, per-engine recommendations, email
alerts). Target users: SaaS marketing teams, freelance SEO consultants, and
agencies monitoring 10–20 clients.

> ✅ **Product pivot complete.** SYB used to be a **one-shot audit** platform.
> That legacy audit product has been **removed**: the `Business`/`Audit` models,
> the `server/` Python service, the human-review admin UI, the `/share/:token`
> report, the `/{username}` audit dashboard and all `/api/audits|businesses|`
> `admin|share` routes are gone. The product now lives entirely in the monitoring
> code: `WebSite/lib/monitoring/*`, `models/Project|LLMResult|WeeklyScore|`
> `MonitoredSource`, `pages/app/*`, `pages/api/projects/*` and
> `pages/api/cron/run-monitoring`.
>
> The only audit remnants intentionally kept are billing-compatibility shims:
> the legacy Stripe tier mapping in `config.stripe.*` / `lib/stripe-tiers.ts`
> (so existing subscriptions keep resolving) and the `auditCredits` /
> `data`/`starter` values on the `User` model. These carry no UI or pipeline.

> ⚠️ Historical note: this repo was bootstrapped from an old invoice-management
> SaaS ("LoopBill/AutoInvoice"). All of that has been removed — **there are no
> invoices, no LoopBill, no "single pro plan at 10€"**. If you find references to
> those anywhere, they are stale and should be deleted, not extended.

## Repository layout (monorepo)

| Path | What it is | Stack | Deploy target |
|------|-----------|-------|---------------|
| `WebSite/` | Main app: landing, auth, **monitoring dashboard (`/app`)**, projects API + cron, payments | Next.js 16 (Pages Router), TS strict, MongoDB/Mongoose, NextAuth, Stripe | Vercel |
| `_bmad-output/` | Planning artifacts (PRD, architecture, epics, UX, specs) | Markdown | — |
| `_bmad/` | BMAD method tooling (agent workflows) | — | — |
| `sales/` | Go-to-market assets (pitch deck, pricing, LinkedIn agent context) | Markdown | — |
| `video/` | Remotion video templates for marketing | Remotion/React | — |

Most application work happens in `WebSite/`.

## How the pieces talk (SYB v2 — no Python server required)

Everything runs inside Next.js. Querying the LLMs is plain HTTP to the official
APIs, so there is **no external processing service** in the monitoring path.

```
Vercel Cron (daily) ──> /api/cron/run-monitoring
   └─ for each active Project due (nextRunAt):
        for each prompt × configured LLM:
           fetch LLM API (HTTP) → brand detection (exact+fuzzy)
                                 → source extraction → write LLMResult (Mongo)
        → recompute WeeklyScore (per-engine + global + delta)
        → update MonitoredSource → Resend alert if |delta| ≥ threshold
```

Without LLM API keys, adapters return deterministic **mocks** (`mock:true`
persisted) so the whole pipeline runs key-free (ideal for market validation).
Manual first run for onboarding: `POST /api/projects/[id]/run`.

## Common commands

```bash
# Main web app
cd WebSite
npm install --legacy-peer-deps   # NextAuth 4 + Next 16 need legacy peer deps
npm run dev          # http://localhost:3000
npm run build        # production build (also type-checks)
npm run lint         # ESLint (flat config, eslint.config.mjs)
npm run typecheck    # tsc --noEmit
npm run test         # Vitest unit tests (see WebSite/__tests__)
```

## Tech stack (current, not the old invoice app)

- **Frontend/API:** Next.js 16.1.4 (Pages Router), React 19, TypeScript 5.8 (strict).
- **UI:** Tailwind CSS + Shadcn/ui, Framer Motion, Recharts, Lucide.
- **State/validation:** Zustand + Zod.
- **DB/auth:** MongoDB (Mongoose 7) + NextAuth 4 (JWT, Google OAuth + credentials).
- **Payments:** Stripe — monitoring plans (`config.monitoring`); a legacy tier mapping (`config.stripe`) is retained only for billing compatibility.
- **Email:** Resend (magic-link auth + monitoring alerts).
- **Monitoring:** LLM adapters in `WebSite/lib/monitoring/adapters` (HTTP to OpenAI/Anthropic/Perplexity/Gemini), run by Vercel Cron — no Python.

## Pricing — single source of truth

Prices live in [`WebSite/config.ts`](WebSite/config.ts); per-plan **limits** live
in [`WebSite/lib/monitoring/plans.ts`](WebSite/lib/monitoring/plans.ts). Do not
hardcode prices elsewhere; import from `config`.

**SYB v2 — recurring monitoring plans (`config.monitoring`, the direction):**

| Key | Name | Price | Projects | LLMs | Frequency |
|-----|------|-------|----------|------|-----------|
| `solo` | Solo | €29/mo | 2 | 3 | weekly |
| `pro` | Pro | €79/mo | 10 | 4 | daily |
| `agency` | Agence | €149/mo | ∞ | 4 | daily + branded PDF |

Cost model + margins: [`WebSite/PRICING_ANALYSIS.md`](WebSite/PRICING_ANALYSIS.md).

**Legacy tier mapping (`config.stripe.*`, billing compatibility only):** the
old `data`/`starter`/`pro`/`agency` price IDs still resolve in the Stripe
webhook so pre-existing subscriptions keep working. There is no audit product
behind them anymore — new checkouts use the monitoring plans above.

## Environment variables

- `WebSite/.env.local` — see [`WebSite/.env.example`](WebSite/.env.example).

SYB v2 needs only `WebSite/.env.local`.

## Guidelines

- Read files before changing them; follow existing patterns
  (`lib/security-middleware.ts`, `lib/error-handler.ts`, Zod at the API layer).
- Keep secrets server-side (Stripe keys, AI keys, `NEXTAUTH_SECRET`).
- Add user-facing strings to `components/LanguageContext.tsx` (EN/FR).
- Run `npm run lint` and `npm run typecheck` before committing.
