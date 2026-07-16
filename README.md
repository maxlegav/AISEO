# ShowYourBrand - GEO Audit Platform

**Make your business visible in AI search engines** (ChatGPT, Claude, Perplexity, DeepSeek)

## Project Overview

ShowYourBrand is a B2B SaaS platform that helps agencies audit and optimize their clients' visibility in AI search engines through comprehensive GEO (Generative Engine Optimization) audits.

**Core Features:**

- 100 AI prompt testing across 4 engines
- GEO Health Score calculation (0-100%)
- Competitor comparison
- AI-powered recommendations
- Professional PDF reports
- Multi-language support (EN/FR)

## Repository Structure

This is a unified monorepo containing all ShowYourBrand components:

```
/ShowYourBrand/
├── /WebSite/              # Next.js 16 frontend + API (main application)
├── /server/               # Python scraping service (Docker)
├── /_bmad/                # BMAD method files (Build Method for AI Development)
├── /_bmad-output/         # Planning artifacts (PRD, Architecture, Epics, UX)
│   └── /planning-artifacts/
│       ├── prd.md                        # Product Requirements (88 FRs)
│       ├── architecture.md               # Technical architecture decisions
│       ├── epics.md                      # 71 stories across 13 epics
│       └── ux-design-specification.md    # Dreelio-inspired design
└── CLAUDE.md              # Developer guide for Claude Code

```

## Quick Start

### Prerequisites

- Node.js 20+
- MongoDB (local or Atlas)
- Docker (for scraping service)

### WebSite (Next.js App)

```bash
cd WebSite
cp .env.example .env.local  # Fill in your secrets
npm install
npm run dev                  # http://localhost:3000
```

See `WebSite/CLAUDE.md` for complete development guide.

### Server (Scraping Service)

```bash
cd server
docker-compose up  # Coming in Epic 1 Story 1.4
```

## Tech Stack

**Frontend:**

- Next.js 16.1.4 (Pages Router)
- TypeScript 5.8.3+ (strict mode)
- Tailwind CSS + Shadcn/ui
- React 19.2.3

**Backend:**

- MongoDB 5.9.2+ with Mongoose
- NextAuth 4.24.11+ (Google OAuth + Credentials)
- Stripe 13.2.0+ (subscriptions)
- Resend (email)

**AI Integration (in the Python processing service):**

- OpenAI API (ChatGPT)
- Anthropic API (Claude)
- Perplexity API
- Google Gemini API

**Infrastructure:**

- Vercel (Next.js hosting)
- Infomaniak Kubernetes (Python processing service — see `server/KUBE_SETUP.md`)
- MongoDB Atlas (shared database)

## Project Status

> The old "Epic 1 in progress / Epics 2–13 planned" status was **out of date** —
> most of the MVP is already built and the app builds cleanly. Below reflects the
> **actual** state of the codebase.

### ✅ Built and working

- **Foundation:** Next.js 16 + TypeScript strict, all legacy invoice code removed, ShowYourBrand branding, EN/FR i18n, Zustand + Zod.
- **Auth:** email/password + Google OAuth, password reset, account deletion (GDPR).
- **Projects/businesses:** create / list / edit / delete with per-tier limits.
- **Audit engine (Python `server/`):** prompt generation, parallel AI queries (ChatGPT/Claude/Perplexity/Gemini), mention detection, scoring, HTML scanner (W3C + schema.org + TF-IDF keywords), competitor comparison, GSC integration.
- **Payments (Stripe):** checkout, one-shot audit purchase, webhooks (idempotent), subscription portal, tier-based feature gating.
- **Reports:** shareable web report at `/share/:shareToken` (dashboard drill-down + competitor comparison).
- **Admin:** human-in-the-loop review flow (approve prompts → complete → notify client).
- **Marketing:** blog (20 posts), SEO (sitemap, `llms.txt`), waitlist, Remotion video templates.

### 🚧 Known gaps / things to tighten

- **Payment flow** should be re-verified end-to-end against live Stripe (see `WebSite/STRIPE_SETUP.md`).
- **Admin is now consolidated** into `WebSite/pages/admin` (dashboard, audit list, audit detail, prompt/audit review). The legacy standalone `Admin/` app is deprecated (`Admin/DEPRECATED.md`) — keep it until the integrated admin is verified in prod, then remove it.
- **Report** is a shareable web page (by design — no server-side PDF).
- No CI/CD and no automated test suite (intentionally skipped for a solo, fast-moving setup).

Historical planning (PRD, epics, UX) lives in `_bmad-output/` for reference, but the
code — not those docs — is the source of truth for what exists today.

## Development Workflow

1. **Planning reference:** artifacts in `_bmad-output/` (PRD, Architecture, Epics, UX) — historical, may lag the code.
2. **Development:** Work in `WebSite/` following patterns in `WebSite/CLAUDE.md`.
3. **Processing service:** Python FastAPI in `server/` (Docker locally, Kubernetes in prod — see `server/KUBE_SETUP.md`).
4. **Before committing:** `npm run lint` and `npm run typecheck` in `WebSite/`.

## Migration History

**Previous Setup:**

- Separate GitLab repos: `ai-seo/WebSite` and `ai-seo/server`
- Shared files (`_bmad-output/`) not versioned

**Current Setup (Jan 24, 2026):**

- Unified GitHub monorepo: All components in one place
- Easier collaboration for 2 developers
- Shared planning artifacts versioned

**GitLab History Preserved:**

- WebSite commits: https://gitlab.com/ai-seo/WebSite
- Last GitLab commit: c1be1cd (Story 1.2 complete)
- Notable commits:
  - 8cd7055: Story 1.1 Part A (Next.js 16 + cleanup)
  - 28368a1: Story 1.1 Part B (dependencies)
  - c1be1cd: Story 1.2 (ShowYourBrand rebrand)

## Success Metrics

**Month 3 Target:**

- 10-15 active agencies
- 100+ audits delivered
- €10K MRR

**Month 12 Target (North Star):**

- 30+ agencies
- 500 audits/month
- €50K MRR
- Recognized as "THE GEO audit platform"

## License

Proprietary - All rights reserved

## Team

2 developers, 8-10 week MVP timeline

---

**For detailed development documentation, see:**

- `WebSite/CLAUDE.md` - Complete developer guide
- `_bmad-output/planning-artifacts/` - All planning documents (PRD, Architecture, Epics, UX)
