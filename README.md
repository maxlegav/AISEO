# AISEO - GEO Audit Platform

**Make your business visible in AI search engines** (ChatGPT, Claude, Perplexity, DeepSeek)

## Project Overview

AISEO is a B2B SaaS platform that helps agencies audit and optimize their clients' visibility in AI search engines through comprehensive GEO (Generative Engine Optimization) audits.

**Core Features:**
- 100 AI prompt testing across 4 engines
- GEO Health Score calculation (0-100%)
- Competitor comparison
- AI-powered recommendations
- Professional PDF reports
- Multi-language support (EN/FR)

## Repository Structure

This is a unified monorepo containing all AISEO components:

```
/AISEO/
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

**AI Integration:**
- OpenAI API (ChatGPT)
- Anthropic API (Claude)
- Perplexity API
- DeepSeek API

**Infrastructure:**
- Vercel (Next.js hosting)
- AWS Lambda/ECS (scraping service)
- Vercel Blob (PDF storage)

## Project Status

### ✅ Completed (Epic 1 Foundation)

- **Story 1.1:** Next.js 16 upgrade + TypeScript strict mode + Auto-Invoice cleanup
- **Story 1.2:** AISEO rebrand + translations (EN/FR) + documentation

### 🚧 In Progress (Epic 1)

- **Story 1.3:** Zustand state management + Zod validation
- **Story 1.4:** Docker Compose for scraping service
- **Story 1.5:** GitLab CI/CD pipeline

### 📋 Planned (Epics 2-13)

- Epic 2: User Authentication
- Epic 3: Subscription & Payments (Basic €50, Pro €150, Premium €300, One-shot €299)
- Epic 4: Project Management
- Epic 5: Audit Engine Core
- Epic 6: HTML Scanner
- Epic 7: AI Recommendations
- Epic 8: Dashboard & Visualizations
- Epic 9: Report Generation
- Epic 10: Email Notifications
- Epic 11: Admin Interface
- Epic 12: GDPR Compliance
- Epic 13: Google Integrations (conditional)

## Development Workflow

1. **Planning:** All artifacts in `_bmad-output/` (PRD, Architecture, Epics, UX)
2. **Development:** Work in `WebSite/` following patterns in `WebSite/CLAUDE.md`
3. **Docker Service:** Separate scraping service in `server/`
4. **CI/CD:** GitLab pipeline (lint, type-check, test) - Coming in Story 1.5

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
  - c1be1cd: Story 1.2 (AISEO rebrand)

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
