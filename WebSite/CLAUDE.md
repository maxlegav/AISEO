# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**ShowYourBrand** is a GEO (Generative Engine Optimization) audit platform that helps businesses become visible in AI search engines (ChatGPT, Claude, Perplexity, DeepSeek).

**Core Value Proposition:** Test visibility across 100 AI prompts, calculate GEO Health Score (0-100%), and provide actionable recommendations to improve AI citations.

**Target Market:** B2B (Agencies) selling GEO audits to their business clients.

## Repository Structure

This is a Next.js monorepo with two services:

- **`WebSite/`**: Next.js 16 application (this directory)
- **`server/`**: Docker processing service (Python + Selenium - to be built in Epic 1)

All development work happens in the `WebSite/` directory.

## Common Commands

```bash
cd WebSite
npm run dev          # Start development server on localhost:3000
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

## Stack Overview

**Framework:** Next.js 16.1.4 (Pages Router - NOT App Router)
**Language:** TypeScript 5.8.3+ (strict mode enabled)
**UI:** Tailwind CSS + Shadcn/ui (copy-paste components)
**Database:** MongoDB 5.9.2+ with Mongoose 7.4.4+
**Auth:** NextAuth 4.24.11+ (JWT strategy, 30-day sessions, Google OAuth + Credentials)
**Payments:** Stripe 13.2.0+ (Basic €50/mo, Pro €150/mo, Premium €300/mo, One-shot €299)
**Email:** Resend (NOT Mailgun)
**State:** Zustand 4.x (to be configured in Epic 1)
**Validation:** Zod 3.x at API layer + Mongoose at DB layer
**i18n:** React i18next (English + French)
**Deployment:** Vercel (Next.js) + AWS Lambda/ECS (Docker service)

## Architecture Patterns

### Data Models

**User Model:**

```typescript
{
  name: string,
  email: string,
  password: string, // bcrypt hashed
  image?: string,
  emailVerified?: Date,
  language: 'en' | 'fr',
  subscriptionTier: 'none' | 'basic' | 'pro' | 'premium',
  stripeCustomerId?: string,
  createdAt: Date,
  updatedAt: Date
}
```

**Business Model** (user's website to audit):

```typescript
{
  userId: ObjectId,
  name: string,
  primaryUrl: string,
  subUrls: string[],
  competitorUrls: string[], // max 5
  category: string, // for FAQ generation
  createdAt: Date,
  updatedAt: Date
}
```

**Audit Model** (uses snapshot pattern):

```typescript
{
  businessId: ObjectId,
  userId: ObjectId,
  status: 'pending' | 'processing' | 'completed' | 'failed',
  geoScore: number, // 0-100

  // CRITICAL: Snapshot pattern - capture business state at audit time
  businessSnapshot: {
    name: string,
    primaryUrl: string,
    subUrls: string[],
    competitorUrls: string[]
  },

  promptResults: { /* AI engine results */ },
  htmlScan: { /* HTML analysis */ },
  recommendations: { /* AI-generated suggestions */ },
  reportPdfUrl: string, // Vercel Blob Storage

  createdAt: Date,
  completedAt?: Date
}
```

**IMPORTANT:** Always use snapshot pattern for historical data. Never `.populate()` for audits - store complete data at creation time.

### Security Patterns

**API Security Middleware** (`lib/security-middleware.ts`):

```typescript
// Authentication + user validation
export function withSecurity(handler) {
  /* ... */
}

// Check user owns resource
export function withResourceOwnership(resourceIdExtractor, resourceModel) {
  /* ... */
}

// Input sanitization (remove MongoDB operators, XSS chars)
export function sanitizeInput(input) {
  /* ... */
}

// Rate limiting (Upstash Redis in production)
export function withRateLimit(maxRequests, windowMs) {
  /* ... */
}
```

**Field Encryption** (`models/plugins/fieldEncryption.ts`):

- Uses AES-256-GCM
- Encrypts specified fields on save, decrypts on load
- Fail-closed on decryption errors

**Error Handling** (`lib/error-handler.ts`):

```typescript
export class ApiError extends Error {
  constructor(errorType, message, statusCode, details?) {}
}

export function handleApiError(error, res) {
  // Never expose internal errors in production
}
```

### API Response Format

**Standard format for all API responses:**

```typescript
// Success
{
  success: true,
  data: { /* response data */ }
}

// Error
{
  success: false,
  error: "ERROR_TYPE", // e.g., "VALIDATION_ERROR", "UNAUTHORIZED"
  message: "Human-readable message",
  details?: any // Only in development
}
```

### Dual Validation Strategy

**1. API Layer (Zod):**

```typescript
import { z } from "zod";

const CreateAuditSchema = z.object({
  businessId: z.string().min(1),
  competitorUrls: z.array(z.string().url()).max(5),
  language: z.enum(["en", "fr"]),
});

// In API route
const body = CreateAuditSchema.parse(req.body);
```

**2. Database Layer (Mongoose):**

```typescript
const AuditSchema = new Schema({
  status: {
    type: String,
    enum: ["pending", "processing", "completed", "failed"],
    required: true,
  },
  geoScore: {
    type: Number,
    min: 0,
    max: 100,
  },
});
```

### State Management (Zustand - To Be Configured)

**Convention:** Verb-first action naming

```typescript
// Store actions
(setUser, updateAudit, clearFilters, toggleSidebar);
```

### Naming Conventions

- **Files:** camelCase (`auditService.ts`, `dashboardLayout.tsx`)
- **Components:** PascalCase (`GeoScoreRing.tsx`, `AuditCard.tsx`)
- **Utilities:** kebab-case (`format-date.ts`, `calculate-score.ts`)
- **Constants:** SCREAMING_SNAKE_CASE (`API_TIMEOUT`, `MAX_RETRIES`)
- **Actions (Zustand):** Verb-first (`setUser`, `updateAudit`, `clearFilters`)

## Key Features (MVP - 8 Core Features)

1. **Visual Site Health Dashboard** - GEO Score 0-100%, top issues, competitor comparison
2. **Prompt Gap Analysis** - 100 prompts tested on 4 AI engines (ChatGPT, Claude, Perplexity, DeepSeek)
3. **HTML Scanner** - Schema.org detection, meta tags, headings, alt text, top 30 keywords (TF-IDF)
4. **AI-Optimized Content Suggestions** - FAQ generation, schema snippets, alt text, priority system (🔴🟠🟢)
5. **Comprehensive Report Generation** - PDF with executive summary + technical details
6. **Subscription Management** - Stripe integration (Basic/Pro/Premium + one-shot)
7. **Internationalization** - English + French (next-i18next, easy to add languages)
8. **Admin Interface** - Founder oversight, audit debugging, platform statistics

## Important Implementation Details

### Parallel AI API Processing

**CRITICAL:** Query 4 AI engines in parallel (NOT sequentially)

- Exponential backoff on rate limits (1s → 2s → 4s → 8s, max 4 retries)
- Minimum 2/4 APIs must succeed to generate report
- 10-minute timeout (quality-first, not performance target)

### Real-Time Updates: Polling (NOT WebSockets)

- Polling interval: 10 seconds for audit progress
- **Rationale:** WebSockets problematic on Vercel (serverless)

### PDF Storage

- Use Vercel Blob Storage (NOT filesystem, NOT GridFS)
- Download endpoint: `/api/audits/pdf/download`
- Secured with authentication checks

### i18n Architecture

- Translation keys in `components/LanguageContext.tsx`
- User language preference stored in DB
- PDF reports generated in user's language
- **Adding new language:** 1-2 days (translation only, no code)

## Environment Variables

See `.env.example` for complete list. Critical variables:

```bash
# Database
MONGODB_URI=mongodb+srv://...
MONGODB_ENCRYPTION_KEY=<32-byte base64>

# Auth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<generated secret>
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# Stripe (4 price IDs)
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_test_...
STRIPE_PRICE_ID_BASIC=price_...
STRIPE_PRICE_ID_PRO=price_...
STRIPE_PRICE_ID_PREMIUM=price_...
STRIPE_PRICE_ID_ONE_SHOT=price_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=noreply@domain.com

# AI APIs
OPENAI_API_KEY=sk-proj-...
ANTHROPIC_API_KEY=sk-ant-...
PERPLEXITY_API_KEY=pplx-...
DEEPSEEK_API_KEY=sk-...

# Processing Service
PROCESSING_SERVICE_API_KEY=<shared secret>
PROCESSING_SERVICE_URL=http://localhost:5000
```

## Development Guidelines

### When Modifying Code

1. **Read files first** - NEVER propose changes to code you haven't read
2. **Use existing patterns** - Follow security middleware, error handling, validation patterns
3. **Avoid over-engineering** - Only make changes directly requested or clearly necessary
4. **Snapshot pattern** - Always capture full state for historical records (audits)
5. **Security first** - Validate auth, check resource ownership, sanitize inputs
6. **i18n ready** - Add translation keys to LanguageContext for new UI strings

### When Adding API Routes

1. Validate authentication using NextAuth `getSession()`
2. Validate user ownership of resources (audits, businesses, etc.)
3. Use Zod for request validation
4. Use standardized API response format
5. Use centralized error handling (ApiError class)
6. Log errors but don't expose sensitive data

### When Adding UI Components

1. Use Shadcn/ui components when possible (components/ui/)
2. Follow Tailwind + utility-first CSS approach
3. Add translation keys to LanguageContext
4. Use `useLanguage()` hook for translations: `const { t } = useLanguage(); t('key.name')`
5. Implement loading states (skeleton screens)
6. Implement empty states (friendly illustrations with CTAs)

## File Structure

```
/ShowYourBrand-platform/
├── /pages/                    # Next.js Pages Router
│   ├── /api/                  # Backend API routes
│   │   ├── /auth/             # NextAuth endpoints
│   │   ├── /audits/           # Audit CRUD (to be built)
│   │   ├── /businesses/       # Business management (to be built)
│   │   └── /webhook/          # Stripe webhooks (to be built)
│   ├── /dashboard/            # Protected dashboard pages (to be built)
│   ├── index.tsx              # Landing page (ShowYourBrand branded)
│   ├── login.tsx, signup.tsx  # Auth pages
│   └── dashboard.tsx          # Main dashboard entry
├── /components/               # React components
│   ├── /ui/                   # Shadcn/ui primitives
│   ├── /audit/                # Audit-specific (to be built)
│   ├── /dashboard/            # Dashboard components (to be built)
│   └── LanguageContext.tsx    # i18n translations
├── /lib/                      # Core utilities
│   ├── crypto.ts              # AES-256-GCM encryption
│   ├── security-middleware.ts # API security HOCs
│   ├── error-handler.ts       # Centralized errors
│   ├── mongoose.ts            # MongoDB connection
│   └── utils.ts               # Helpers (cn, etc.)
├── /models/                   # Mongoose schemas
│   ├── /plugins/              # Reusable plugins
│   │   └── fieldEncryption.ts # Encryption plugin
│   └── User.ts                # User model (auth only, no subscription field yet)
├── /types/                    # TypeScript types
├── config.ts                  # Centralized config (ShowYourBrand pricing, colors, etc.)
├── next.config.js             # Next.js configuration
├── tailwind.config.ts         # Tailwind + Shadcn/ui
└── vercel.json                # Vercel deployment config
```

## Current Project Status

**Story 1.1 (Complete):** ✅

- Next.js upgraded to 16.1.4
- TypeScript strict mode enabled
- All Auto-Invoice code removed
- Dependencies cleaned

**Story 1.2 (Complete):** ✅

- ShowYourBrand branding applied
- Translations updated (EN/FR)
- Config files updated
- Assets documented for replacement

**Next Steps (Epic 1):**

- Story 1.3: Setup Zustand + Zod
- Story 1.4: Configure Docker Compose for scraping service
- Story 1.5: Setup GitLab CI/CD

**MVP Timeline:** 8-10 weeks, 2 developers

## Common Issues & Solutions

### Build Fails with Peer Dependency Errors

- Use `npm install --legacy-peer-deps`
- NextAuth 4 + Next.js 16 have peer dependency conflicts (acceptable for MVP)

### MongoDB Connection Issues

- Verify `MONGODB_URI` is set correctly
- Ensure IP whitelist in MongoDB Atlas includes your IP
- Check `MONGODB_ENCRYPTION_KEY` is exactly 32 bytes base64

### Authentication Not Working

- Verify `NEXTAUTH_URL` matches your current URL (http://localhost:3000 in dev)
- Verify `NEXTAUTH_SECRET` is set
- Check Google OAuth credentials if using Google Sign-In

### TypeScript Errors After Upgrade

- Run `npm run build` to see all errors
- Most common: unused variables (prefix with `_`), missing null checks (add `?` or `??`)

## Important Notes

- **This is a greenfield project** - Clean slate, no legacy code (except proven security patterns)
- **Premium Walking Skeleton** - UI must be impeccable from day 1 (agencies demand polish)
- **First-mover race** - Speed matters, 12-18 months before giants (Ahrefs, SEMrush) arrive
- **Agency-first** - UI polish = credibility = agency adoption
- **All-in bet on GEO** - No hedge, pivot if it doesn't work

**Current Phase:** Foundation complete, ready to build core features (Epics 2-13)

**Success Metrics:**

- Month 3: 10-15 active agencies, 100+ audits delivered, €10K MRR
- Month 12: 30+ agencies, 500+ audits/month (North Star), €50K MRR

---

For detailed architecture decisions and epic breakdown, see:

- `/_bmad-output/planning-artifacts/architecture.md` (125K detailed architecture)
- `/_bmad-output/planning-artifacts/epics.md` (71 stories across 13 epics)
- `/_bmad-output/planning-artifacts/prd.md` (complete product requirements)
- `/_bmad-output/planning-artifacts/ux-design-specification.md` (Dreelio-inspired design)
