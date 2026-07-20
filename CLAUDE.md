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

> ⚠️ **Product pivot.** SYB used to be a **one-shot audit** platform. That legacy
> audit product (`Business`/`Audit` models, `server/` Python service, human
> review, `/share/:token` report, `config.stripe.*` audit tiers) is still in the
> code **temporarily** but is no longer the direction. New work targets the
> monitoring product in `WebSite/lib/monitoring/*`, `models/Project|LLMResult|`
> `WeeklyScore|MonitoredSource`, `pages/app/*` and `pages/api/projects/*`.

> ⚠️ Historical note: this repo was bootstrapped from an old invoice-management
> SaaS ("LoopBill/AutoInvoice"). All of that has been removed — **there are no
> invoices, no LoopBill, no "single pro plan at 10€"**. If you find references to
> those anywhere, they are stale and should be deleted, not extended.

## Repository layout (monorepo)

| Path | What it is | Stack | Deploy target |
|------|-----------|-------|---------------|
| `WebSite/` | Main app: landing, auth, **monitoring dashboard (`/app`)**, projects API + cron, payments, admin | Next.js 16 (Pages Router), TS strict, MongoDB/Mongoose, NextAuth, Stripe | Vercel |
| `server/` | **LEGACY** — old audit pipeline (Selenium/HTML scan). **Not required by SYB v2** and slated for removal | Python 3.11, FastAPI, Selenium | do not deploy for monitoring |
| `Admin/` | **Deprecated** standalone admin panel — merged into `WebSite/pages/admin` (see `Admin/DEPRECATED.md`) | Next.js | do not deploy |
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

> The **legacy audit flow** (human-in-the-loop admin review, `server/` Python,
> `/share/:token`) still exists but is not part of SYB v2 and needs no Python
> server for monitoring.

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

# Legacy audit processing service (NOT needed for SYB v2 monitoring)
# docker compose up --build      # only for the old audit pipeline
```

## Tech stack (current, not the old invoice app)

- **Frontend/API:** Next.js 16.1.4 (Pages Router), React 19, TypeScript 5.8 (strict).
- **UI:** Tailwind CSS + Shadcn/ui, Framer Motion, Recharts, Lucide.
- **State/validation:** Zustand + Zod.
- **DB/auth:** MongoDB (Mongoose 7) + NextAuth 4 (JWT, Google OAuth + credentials).
- **Payments:** Stripe — monitoring plans (`config.monitoring`) + legacy audit tiers (`config.stripe`).
- **Email:** Resend (magic-link auth + monitoring alerts).
- **Monitoring:** LLM adapters in `WebSite/lib/monitoring/adapters` (HTTP to OpenAI/Anthropic/Perplexity/Gemini), run by Vercel Cron — no Python.
- **Legacy audit:** Python FastAPI + Selenium in `server/` (being retired).

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

**Legacy audit tiers (`config.stripe.*`, kept until billing is migrated):**
Data €29 / Starter €79 (one-shot), Pro €59/mo, Agency €599/mo, Extra €50. The
Stripe webhook still maps these; monitoring checkout/webhook wiring for the new
prices (and a `solo` tier) is a documented follow-up in `PRICING_ANALYSIS.md`.

## Environment variables

- `WebSite/.env.local` — see [`WebSite/.env.example`](WebSite/.env.example).
- `server/.env` — see [`server/.env.example`](server/.env.example) and `server/README.md`.

SYB v2 needs only `WebSite/.env.local`. `server/.env` and
`PROCESSING_SERVICE_API_KEY` are **legacy** (old audit pipeline) and not used by
the monitoring product.

## Guidelines

- Read files before changing them; follow existing patterns
  (`lib/security-middleware.ts`, `lib/error-handler.ts`, Zod at the API layer).
- Audits use a **snapshot pattern** — store full state on the audit doc, don't rely
  on `.populate()` for historical records.
- Keep secrets server-side (`PROCESSING_SERVICE_API_KEY`, Stripe keys, AI keys).
- Add user-facing strings to `components/LanguageContext.tsx` (EN/FR).
- Run `npm run lint` and `npm run typecheck` before committing.
