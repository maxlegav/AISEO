# CLAUDE.md

This file provides guidance to Claude Code / AI agents working in this repository.

> **This is the monorepo-level guide.** The most detailed, up-to-date guide for the
> main app lives in [`WebSite/CLAUDE.md`](WebSite/CLAUDE.md). Read that too before
> working in `WebSite/`.

## What this project is

**ShowYourBrand** is a **GEO (Generative Engine Optimization) audit platform**. It
tests how visible a business is inside AI search engines (ChatGPT, Claude,
Perplexity, Gemini), computes a **GEO Health Score (0–100)**, compares against
competitors, and produces actionable, shareable reports. Target market: **B2B
agencies** auditing their clients.

> ⚠️ Historical note: this repo was bootstrapped from an old invoice-management
> SaaS ("LoopBill/AutoInvoice"). All of that has been removed — **there are no
> invoices, no LoopBill, no "single pro plan at 10€"**. If you find references to
> those anywhere, they are stale and should be deleted, not extended.

## Repository layout (monorepo)

| Path | What it is | Stack | Deploy target |
|------|-----------|-------|---------------|
| `WebSite/` | Main app: landing, auth, dashboard, audits, payments, **admin** | Next.js 16 (Pages Router), TS strict, MongoDB/Mongoose, NextAuth, Stripe | Vercel |
| `server/` | Processing service: runs the actual GEO audit pipeline | Python 3.11, FastAPI, Selenium, AI SDKs | Docker → Infomaniak Kubernetes (see `server/KUBE_SETUP.md`) |
| `Admin/` | **Deprecated** standalone admin panel — merged into `WebSite/pages/admin` (see `Admin/DEPRECATED.md`) | Next.js | do not deploy |
| `_bmad-output/` | Planning artifacts (PRD, architecture, epics, UX, specs) | Markdown | — |
| `_bmad/` | BMAD method tooling (agent workflows) | — | — |
| `sales/` | Go-to-market assets (pitch deck, pricing, LinkedIn agent context) | Markdown | — |
| `video/` | Remotion video templates for marketing | Remotion/React | — |

Most application work happens in `WebSite/`.

## How the pieces talk

```
Browser ──> WebSite (Next.js on Vercel)
                │  creates Audit doc (status: pending) in MongoDB
                │  fire-and-forget POST /audit  (Bearer PROCESSING_SERVICE_API_KEY)
                ▼
          server/ (FastAPI on Infomaniak K8s, IP 83.228.202.11)
                │  prompt gen → parallel AI queries → mention detection
                │  → scoring → HTML scan → writes results back to MongoDB
                ▼
          MongoDB Atlas (shared by WebSite, server, and Admin)
```

The audit flow is **human-in-the-loop by design** (kept on purpose while report
quality is being validated):
1. User launches an audit → `Audit` created `pending`, processing server triggered.
2. Server generates prompts → status `awaiting_prompt_approval`.
3. **Admin approves prompts** (`/api/audits/approve` → server `/audit/:id/approve-prompts`).
4. Server runs the full audit → status `review_pending`.
5. **Admin marks complete** (`/api/admin/audits/:id/complete`) → status `completed`,
   client notified, report shareable via `/share/:shareToken`.

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

# Processing service (from repo root)
docker compose up --build        # http://localhost:8080
# or run the container directly — see server/README.md
```

## Tech stack (current, not the old invoice app)

- **Frontend/API:** Next.js 16.1.4 (Pages Router), React 19, TypeScript 5.8 (strict).
- **UI:** Tailwind CSS + Shadcn/ui, Framer Motion, Recharts, Lucide.
- **State/validation:** Zustand + Zod.
- **DB/auth:** MongoDB (Mongoose 7) + NextAuth 4 (JWT, Google OAuth + credentials).
- **Payments:** Stripe — 4 tiers + one-shots (see pricing below).
- **Email:** Resend.
- **Processing:** Python FastAPI + Selenium + OpenAI/Anthropic/Gemini/Perplexity SDKs.

## Pricing — single source of truth

The **authoritative pricing lives in [`WebSite/config.ts`](WebSite/config.ts)**
(`config.stripe.*`). Do not hardcode prices elsewhere; import from `config`.
Current tiers:

| Key | Name | Price | Mode |
|-----|------|-------|------|
| `data` | Data | €29 | one-shot |
| `starter` | Starter | €79 | one-shot |
| `pro` | Pro | €59/mo | subscription |
| `agency` | Agency | €599/mo | subscription |
| `agencyExtraAudit` | Extra Audit | €50 | one-shot (agency) |

> Older planning docs in `_bmad-output/` mention €100/€200/€500 — those are
> **outdated**; `config.ts` wins.

## Environment variables

- `WebSite/.env.local` — see [`WebSite/.env.example`](WebSite/.env.example).
- `server/.env` — see [`server/.env.example`](server/.env.example) and `server/README.md`.

Both the web app and the processing service must point at the **same MongoDB** and
share the same `PROCESSING_SERVICE_API_KEY`.

## Guidelines

- Read files before changing them; follow existing patterns
  (`lib/security-middleware.ts`, `lib/error-handler.ts`, Zod at the API layer).
- Audits use a **snapshot pattern** — store full state on the audit doc, don't rely
  on `.populate()` for historical records.
- Keep secrets server-side (`PROCESSING_SERVICE_API_KEY`, Stripe keys, AI keys).
- Add user-facing strings to `components/LanguageContext.tsx` (EN/FR).
- Run `npm run lint` and `npm run typecheck` before committing.
