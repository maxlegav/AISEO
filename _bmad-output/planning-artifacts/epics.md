---
stepsCompleted: [1, 2, 3]
inputDocuments:
  - '/Users/maxlemoinegavoille/Desktop/Projets/AISEO/_bmad-output/planning-artifacts/prd.md'
  - '/Users/maxlemoinegavoille/Desktop/Projets/AISEO/_bmad-output/planning-artifacts/architecture.md'
  - '/Users/maxlemoinegavoille/Desktop/Projets/AISEO/_bmad-output/planning-artifacts/ux-design-specification.md'
totalEpics: 13
totalFRs: 88
totalStories: 71
status: 'stories_complete'
---

# AISEO - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for AISEO, decomposing the requirements from the PRD, UX Design, and Architecture into implementable stories.

## Requirements Inventory

### Functional Requirements

**1. User Management & Authentication**
- FR1: Users can create an account using email/password
- FR2: Users can authenticate using Google OAuth
- FR3: Users can reset their password via email
- FR4: Users can view and edit their profile information
- FR5: Users can select their preferred language (English or French)
- FR6: Users can delete their account and all associated data
- FR7: System can maintain secure user sessions for 30 days

**2. Project Management**
- FR8: Users can create a new project by providing brand name and primary URL
- FR9: Users can add optional sub-URLs to a project (e.g., /blog, /shop)
- FR10: Users can add up to 5 competitor URLs for comparison analysis
- FR11: Users can view a list of all their projects
- FR12: Users can edit project details (brand name, URLs)
- FR13: Users can delete a project and all its audit history
- FR14: Users can manage multiple projects based on their subscription tier (1 for Basic, 5 for Pro, 10+ for Premium)

**3. Audit Engine & Analysis**
- FR15: Users can initiate a GEO audit for any project
- FR16: System can test project visibility across 100 AI prompts (consistent across all subscription tiers)
- FR17: System can query multiple AI engines (ChatGPT, Claude, Perplexity, DeepSeek) in parallel
- FR18: System can calculate a GEO Health Score (0-100%) based on audit results
- FR19: System can compare project visibility against competitor URLs
- FR20: System can identify which prompt categories show strongest/weakest visibility
- FR21: System can track audit history over time for trend analysis
- FR22: Users can view detailed prompt test results (which prompts mentioned the business, which didn't)

**4. HTML Scanner & Technical Analysis**
- FR23: System can scan website HTML structure (homepage + key pages)
- FR24: System can detect existing schema.org markup (Organization, Person, Product, FAQPage, etc.)
- FR25: System can analyze meta tags (title, description, Open Graph, Twitter Cards)
- FR26: System can evaluate heading structure (H1-H6 hierarchy)
- FR27: System can audit images for alt text presence and quality
- FR28: System can extract top 30 content keywords from scanned pages, ranked by importance (frequency, relevance, TF-IDF scoring)
- FR29: System can identify missing schema markup opportunities
- FR30: System can assess AI-friendliness of existing content structure

**5. AI-Powered Recommendations**
- FR31: System can generate 10 FAQ questions and answers based on user-provided business category
- FR32: System can provide copy-paste ready schema.org code snippets (JSON-LD format)
- FR33: System can suggest optimized alt text for images without descriptions
- FR34: System can recommend additional keywords to improve AI visibility
- FR35: System can prioritize recommendations using 3-level system (🔴 Critical / 🟠 Important / 🟢 Nice-to-have)
- FR36: System can provide plain-language explanations for each recommendation (Grade 8 reading level)
- FR37: System can generate implementation instructions specifying exact code locations

**6. Dashboard & Visualization**
- FR38: Users can view GEO Health Score prominently displayed with color-coding (red/orange/green)
- FR39: Users can view Prompt Gap Analysis visualization showing percentage visibility
- FR40: Users can view competitor comparison charts (user vs 3-5 competitors)
- FR41: Users can view top 3-5 priority issues with plain-language descriptions
- FR42: Users can drill down into detailed audit results
- FR43: Users can view audit history timeline for a project
- FR44: Users can compare multiple audits to track improvement over time
- FR45: Users can switch dashboard language between English and French

**7. Report Generation & Distribution**
- FR46: System can generate professional PDF reports from audit results
- FR47: Reports can include executive summary (1 page, visual, for business owners)
- FR48: Reports can include technical details (5-10 pages, code snippets, for developers)
- FR49: Reports can be localized in user's preferred language (English or French)
- FR50: Users can download PDF reports from the dashboard
- FR51: System can store PDF reports securely (MongoDB GridFS)
- FR52: Users can receive email notification when report is ready
- FR53: Users can share report download links with team members or clients

**8. Subscription & Payment Management**
- FR54: Users can purchase one-time audits (€300 per audit)
- FR55: Users can subscribe to Basic tier (1 project, €50/month)
- FR56: Users can subscribe to Pro tier (5 projects, €150/month)
- FR57: Users can subscribe to Premium tier (10+ projects, €300/month)
- FR58: Users can upgrade or downgrade their subscription tier
- FR59: Users can cancel their subscription
- FR60: Users can access Stripe Customer Portal to manage payment methods
- FR61: System can process subscription lifecycle events via Stripe webhooks
- FR62: System can restrict features based on subscription tier (project count limits)

**9. Email Notifications**
- FR63: Users can receive welcome email upon account creation
- FR64: Users can receive audit completion notification with download link
- FR65: Users can receive subscription confirmation emails
- FR66: Users can receive payment receipts via email

**10. Integration Capabilities (Conditional MVP)**
- FR67: Users can connect their Google Search Console account (OAuth)
- FR68: System can retrieve traditional SEO performance metrics from Google Search Console
- FR69: Users can connect their Google Analytics account (OAuth)
- FR70: System can retrieve traffic and user behavior data from Google Analytics
- FR71: Dashboard can display correlation between GEO visibility and traditional SEO/traffic metrics

**11. Data Management & Compliance**
- FR72: System can encrypt sensitive data at rest (MongoDB Atlas encryption)
- FR73: System can export all user data in machine-readable format (GDPR compliance)
- FR74: System can permanently delete all user data upon account closure
- FR75: System can respect robots.txt when scraping websites
- FR76: System can rate-limit web scraping requests to avoid overwhelming target servers
- FR77: System can identify itself with descriptive user-agent string when making web requests

**12. Admin Interface & Operations**
- FR78: Admins can access dedicated admin dashboard (protected route)
- FR79: Admins can view list of all audits across all users with filters
- FR80: Admins can view detailed audit information (user, business, status, results, logs)
- FR81: Admins can view complete user dashboard for any audit
- FR82: Admins can manually edit audit data with audit trail logging
- FR83: Admins can manually re-generate PDF reports for any audit
- FR84: Admins can view platform-wide statistics (audits, success rate, subscriptions, revenue)
- FR85: Admins can search and filter audits by multiple criteria
- FR86: Admins can view error logs and debug information for failed audits
- FR87: Admins can manually trigger audit retry for failed audits
- FR88: Admins can view raw API responses from AI engines for debugging

### Non-Functional Requirements

**Performance Requirements**
- NFR-P1: GEO audits must complete successfully with 10-minute timeout (5-8 minute target)
- NFR-P2: Dashboard pages must load in under 2 seconds for 95th percentile users
- NFR-P3: API endpoints must respond in under 1 second for 95th percentile
- NFR-P4: Prompt testing must query 4 AI engines in parallel, not sequentially
- NFR-P5: PDF generation must complete within 2 minutes (async with email notification)

**Security Requirements**
- NFR-S1: All sensitive user data must be encrypted at rest (MongoDB Atlas encryption)
- NFR-S2: Passwords hashed with bcrypt (10 rounds), session tokens as JWT with secure flags
- NFR-S3: All traffic served over HTTPS (TLS 1.2+), no mixed content
- NFR-S4: API keys and credentials never exposed in client-side code or logs
- NFR-S5: Payment processing must be PCI-DSS compliant (via Stripe)
- NFR-S6: Users must only access their own data (no cross-user data leakage)

**Reliability Requirements**
- NFR-R1: 95%+ of paid audits must complete successfully and deliver a report
- NFR-R2: Dashboard and authentication must maintain 99%+ uptime
- NFR-R3: If 1+ AI APIs fail, audit must complete with remaining APIs (min 2 required)
- NFR-R4: User data must be backed up daily, recoverable within 24 hours
- NFR-R5: Critical errors must be logged and alert founders within 5 minutes

**Scalability Requirements**
- NFR-SC1: Platform must support 100 concurrent users without degradation
- NFR-SC2: System must handle 500 audits/month (North Star at Month 12)
- NFR-SC3: MongoDB must scale to 10,000 audits + 1,000 users without performance degradation
- NFR-SC4: Audit processing service must scale horizontally

**Integration Requirements**
- NFR-I1: Stripe webhooks must be idempotent and handle retries gracefully
- NFR-I2: System must respect AI API rate limits with exponential backoff (1s → 2s → 4s → 8s)
- NFR-I3: Transactional emails must have 95%+ delivery rate
- NFR-I4: Google API failures must not block audit completion (if integrated)

**Accessibility Requirements**
- NFR-A1: Dashboard must meet WCAG 2.1 Level A standards
- NFR-A2: All interactive elements accessible via keyboard
- NFR-A3: Dashboard must be navigable with screen readers

**Internationalization Requirements**
- NFR-I18N1: Users can switch UI language between English and French without page reload
- NFR-I18N2: PDF reports generated in user's preferred language
- NFR-I18N3: Adding a new language must require < 2 days (translation only, no code changes)

### Additional Requirements

**From Architecture Document:**
- **Starter Template**: Use create-next-app (Next.js 15.x) with TypeScript and Tailwind CSS
- **Pattern Reuse**: Reuse proven security patterns from Auto-Invoice codebase (crypto.ts, security-middleware.ts, blob-storage.ts, Mongoose plugins)
- **Tech Stack**: Next.js 15.x, TypeScript strict mode, Tailwind CSS + Shadcn/ui, Zustand 4.x, Zod 3.x, Mongoose 7.4.4+
- **State Management**: Zustand with verb-first action naming (set/update/clear/toggle)
- **Validation**: Dual validation strategy (Zod at API boundary, Mongoose at database)
- **Real-Time Updates**: 10-second polling for audit progress (NOT WebSockets on Vercel)
- **API Response Format**: Standardized `{ success: true, data: {...} }` or `{ success: false, error: "ERROR_TYPE", message: "..." }`
- **Docker Service**: Local Docker Compose for scraping service (Python + Selenium)
- **CI/CD**: GitLab CI/CD with lint, type-check, test, coverage pipeline
- **Rate Limiting**: Upstash Redis for production-ready rate limiting
- **File Naming**: camelCase everywhere except components (PascalCase), utilities (kebab-case), constants (SCREAMING_SNAKE_CASE)
- **Error Handling**: Centralized error handler with standardized error codes
- **Database**: MongoDB with field-level encryption for sensitive data
- **PDF Storage**: Vercel Blob Storage (NOT filesystem)

**From UX Design Document:**
- **Design Inspiration**: Dreelio, Almond, Base44 aesthetic (clean minimalism, soft backgrounds, generous spacing)
- **Color Palette**: Soft neutrals with vibrant accent (Blue #3B82F6, Green #10B981, Red #EF4444, Orange #F59E0B)
- **Typography**: Inter font family (modern, professional, excellent readability)
- **Component Library**: Shadcn/ui for consistent, accessible components
- **Responsive Design**: Mobile-first approach with breakpoints (sm: 640px, md: 768px, lg: 1024px, xl: 1280px)
- **Dashboard Layout**: Sidebar navigation + content area (inspired by Dreelio)
- **GEO Score**: Large circular progress indicator with color coding
- **Charts**: Recharts library for visualizations
- **Loading States**: Skeleton screens for better perceived performance
- **Empty States**: Friendly illustrations with clear CTAs

### FR Coverage Map

**Epic 1: Project Foundation & Infrastructure**
- Architecture requirements (Next.js 15.x setup, TypeScript strict, Shadcn/ui, Docker, GitLab CI/CD)

**Epic 2: User Authentication & Account Management**
- FR1: Email/password account creation
- FR2: Google OAuth authentication
- FR3: Password reset via email
- FR4: Profile viewing and editing
- FR5: Language selection (English/French)
- FR6: Account deletion with data removal
- FR7: Secure session management (30 days)

**Epic 3: Subscription & Payment System**
- FR54: One-time audit purchase (€300)
- FR55: Basic tier subscription (1 project, €50/month)
- FR56: Pro tier subscription (5 projects, €150/month)
- FR57: Premium tier subscription (10+ projects, €300/month)
- FR58: Subscription upgrade/downgrade
- FR59: Subscription cancellation
- FR60: Stripe Customer Portal access
- FR61: Stripe webhook event processing
- FR62: Feature restrictions by tier

**Epic 4: Project Management**
- FR8: Project creation (brand name, primary URL)
- FR9: Sub-URL addition (e.g., /blog, /shop)
- FR10: Competitor URL addition (up to 5)
- FR11: Project list viewing
- FR12: Project detail editing
- FR13: Project deletion with audit history
- FR14: Multiple project management by tier

**Epic 5: Audit Engine Core**
- FR15: GEO audit initiation
- FR16: 100 AI prompt testing (all tiers)
- FR17: Parallel AI engine querying (ChatGPT, Claude, Perplexity, DeepSeek)
- FR18: GEO Health Score calculation (0-100%)
- FR19: Competitor visibility comparison
- FR20: Prompt category strength/weakness identification
- FR21: Audit history tracking over time
- FR22: Detailed prompt test result viewing

**Epic 6: HTML Scanner & Technical Analysis**
- FR23: Website HTML structure scanning
- FR24: Schema.org markup detection
- FR25: Meta tag analysis (title, description, Open Graph, Twitter Cards)
- FR26: Heading structure evaluation (H1-H6)
- FR27: Image alt text audit
- FR28: Top 30 keyword extraction (TF-IDF scoring)
- FR29: Missing schema markup identification
- FR30: AI-friendliness assessment

**Epic 7: AI-Powered Recommendations**
- FR31: FAQ generation (10 Q&As based on business category)
- FR32: Schema.org code snippets (JSON-LD, copy-paste ready)
- FR33: Optimized alt text suggestions
- FR34: Additional keyword recommendations
- FR35: Priority recommendation system (🔴 Critical / 🟠 Important / 🟢 Nice-to-have)
- FR36: Plain-language explanations (Grade 8 reading level)
- FR37: Implementation instructions with code locations

**Epic 8: Dashboard & Visualizations**
- FR38: GEO Health Score display (color-coded)
- FR39: Prompt Gap Analysis visualization
- FR40: Competitor comparison charts
- FR41: Top 3-5 priority issues display
- FR42: Detailed audit result drill-down
- FR43: Audit history timeline viewing
- FR44: Multi-audit comparison for trend tracking
- FR45: Dashboard language switching (English/French)

**Epic 9: Report Generation & Distribution**
- FR46: Professional PDF report generation
- FR47: Executive summary inclusion (1 page, visual)
- FR48: Technical details inclusion (5-10 pages, code snippets)
- FR49: Report localization (English/French)
- FR50: PDF report download from dashboard
- FR51: Secure PDF storage (MongoDB GridFS)
- FR52: Email notification when report ready
- FR53: Report download link sharing

**Epic 10: Email Notifications**
- FR63: Welcome email on account creation
- FR64: Audit completion notification with download link
- FR65: Subscription confirmation emails
- FR66: Payment receipt emails

**Epic 11: Admin Interface & Operations**
- FR78: Admin dashboard access (protected route)
- FR79: All-user audit list with filters
- FR80: Detailed audit information viewing
- FR81: User dashboard viewing for any audit
- FR82: Manual audit data editing with audit trail
- FR83: Manual PDF report regeneration
- FR84: Platform-wide statistics viewing
- FR85: Audit search and filtering by multiple criteria
- FR86: Error log and debug information viewing
- FR87: Manual audit retry triggering
- FR88: Raw AI API response viewing for debugging

**Epic 12: Data Management & Compliance**
- FR72: Sensitive data encryption at rest (MongoDB Atlas)
- FR73: User data export (GDPR-compliant, machine-readable)
- FR74: Permanent user data deletion on account closure
- FR75: robots.txt compliance when scraping
- FR76: Web scraping rate limiting
- FR77: Descriptive user-agent string for web requests

**Epic 13: Google Integrations (Conditional MVP)**
- FR67: Google Search Console connection (OAuth)
- FR68: Traditional SEO metrics retrieval
- FR69: Google Analytics connection (OAuth)
- FR70: Traffic and user behavior data retrieval
- FR71: GEO vs SEO/traffic correlation display

## Epic List

### Epic 1: Project Foundation & Infrastructure
**Goal:** Set up complete development environment, CI/CD pipeline, Docker services, and foundational tech stack to enable all future development.

**User Outcome:** Development team has a fully configured Next.js 15.x project with TypeScript strict mode, Shadcn/ui components, GitLab CI/CD pipeline, local Docker services for scraping, and all architectural patterns in place.

**FRs Covered:** Architecture requirements (Next.js 15.x, TypeScript strict, Tailwind + Shadcn/ui, Zustand 4.x, Zod 3.x, Mongoose 7.4.4+, Docker Compose, GitLab CI/CD, Upstash Redis, standardized patterns)

**Dependencies:** None (foundational epic)

---

### Epic 2: User Authentication & Account Management
**Goal:** Users can register, authenticate, manage their profiles, and delete their accounts securely.

**User Outcome:** Users can create accounts via email/password or Google OAuth, reset passwords, edit profiles, select language preferences (English/French), and delete accounts with complete data removal.

**FRs Covered:** FR1, FR2, FR3, FR4, FR5, FR6, FR7

**Dependencies:** Epic 1 (requires Next.js setup, NextAuth, MongoDB models)

---

### Epic 3: Subscription & Payment System
**Goal:** Users can purchase one-time audits or subscribe to recurring plans, manage subscriptions, and process payments securely.

**User Outcome:** Users can purchase €300 one-time audits or subscribe to Basic (€50/month), Pro (€150/month), or Premium (€300/month) tiers, upgrade/downgrade subscriptions, cancel subscriptions, and manage payment methods via Stripe Customer Portal.

**FRs Covered:** FR54, FR55, FR56, FR57, FR58, FR59, FR60, FR61, FR62

**Dependencies:** Epic 2 (requires user accounts)

---

### Epic 4: Project Management
**Goal:** Users can create, edit, delete, and manage multiple projects (websites to audit) with competitor tracking.

**User Outcome:** Users can create projects with brand name and primary URL, add sub-URLs (e.g., /blog, /shop), add up to 5 competitor URLs, view project lists, edit project details, delete projects with audit history, and manage multiple projects based on subscription tier limits.

**FRs Covered:** FR8, FR9, FR10, FR11, FR12, FR13, FR14

**Dependencies:** Epic 2 (requires user accounts), Epic 3 (tier-based project limits)

---

### Epic 5: Audit Engine Core
**Goal:** Users can launch comprehensive GEO audits that test 100 AI prompts across 4 engines, calculate health scores, and compare against competitors.

**User Outcome:** Users can initiate GEO audits for any project, system tests visibility across 100 AI prompts on ChatGPT/Claude/Perplexity/DeepSeek in parallel, calculates GEO Health Score (0-100%), compares against competitors, identifies prompt category strengths/weaknesses, tracks audit history, and displays detailed prompt test results.

**FRs Covered:** FR15, FR16, FR17, FR18, FR19, FR20, FR21, FR22

**Dependencies:** Epic 4 (requires projects to audit)

---

### Epic 6: HTML Scanner & Technical Analysis
**Goal:** System scans website HTML structure, detects schema markup, analyzes meta tags, headings, images, and extracts keywords.

**User Outcome:** System automatically scans website HTML (homepage + key pages), detects existing schema.org markup, analyzes meta tags (title, description, Open Graph, Twitter Cards), evaluates heading structure (H1-H6), audits image alt text, extracts top 30 keywords with TF-IDF scoring, identifies missing schema opportunities, and assesses AI-friendliness.

**FRs Covered:** FR23, FR24, FR25, FR26, FR27, FR28, FR29, FR30

**Dependencies:** Epic 5 (runs as part of audit process)

---

### Epic 7: AI-Powered Recommendations
**Goal:** System generates actionable, copy-paste ready recommendations to improve GEO visibility.

**User Outcome:** System generates 10 FAQ Q&As based on business category, provides copy-paste ready schema.org JSON-LD snippets, suggests optimized alt text for images, recommends additional keywords, prioritizes recommendations with 3-level system (🔴 Critical / 🟠 Important / 🟢 Nice-to-have), provides Grade 8 reading level explanations, and specifies exact code implementation locations.

**FRs Covered:** FR31, FR32, FR33, FR34, FR35, FR36, FR37

**Dependencies:** Epic 5 (audit results), Epic 6 (HTML analysis data)

---

### Epic 8: Dashboard & Visualizations
**Goal:** Users view comprehensive GEO audit results through professional, agency-grade dashboard with visualizations and insights.

**User Outcome:** Users see GEO Health Score prominently displayed with color-coding (red/orange/green), view Prompt Gap Analysis visualizations, see competitor comparison charts, view top 3-5 priority issues with plain-language descriptions, drill down into detailed audit results, view audit history timeline, compare multiple audits for trend tracking, and switch dashboard language between English and French.

**FRs Covered:** FR38, FR39, FR40, FR41, FR42, FR43, FR44, FR45

**Dependencies:** Epic 5 (audit data), Epic 7 (recommendations), UX Design specifications (Dreelio-inspired layout)

---

### Epic 9: Report Generation & Distribution
**Goal:** Users receive professional PDF reports with executive summaries and technical details for client presentations.

**User Outcome:** System generates professional PDF reports with brand logo header, includes 1-page visual executive summary for business owners, includes 5-10 page technical details with code snippets for developers, localizes reports in user's preferred language (English/French), users can download PDFs from dashboard, system stores PDFs securely in MongoDB GridFS, users receive email notification when report ready, and users can share report download links with team/clients.

**FRs Covered:** FR46, FR47, FR48, FR49, FR50, FR51, FR52, FR53

**Dependencies:** Epic 5 (audit data), Epic 7 (recommendations), Epic 8 (dashboard for download)

---

### Epic 10: Email Notifications
**Goal:** Users receive timely email notifications for key account and audit events.

**User Outcome:** Users receive welcome email upon account creation, audit completion notification with download link, subscription confirmation emails, and payment receipt emails via Resend.

**FRs Covered:** FR63, FR64, FR65, FR66

**Dependencies:** Epic 2 (user accounts), Epic 3 (subscriptions), Epic 9 (report ready notifications)

---

### Epic 11: Admin Interface & Operations
**Goal:** Admins can monitor platform operations, debug issues, view statistics, and manage audits across all users.

**User Outcome:** Admins access dedicated admin dashboard (protected route), view list of all audits across all users with filters (status, date, user, business name), view detailed audit information (user details, business details, status, GEO score, prompt results, recommendations, logs), view complete user dashboard for any audit, manually edit audit data with audit trail logging, manually regenerate PDF reports, view platform-wide statistics (total audits, success rate, processing time, subscription distribution, revenue metrics), search/filter audits by email/business/date/status/score, view error logs and debug information for failed audits, manually trigger audit retry, and view raw AI API responses for debugging.

**FRs Covered:** FR78, FR79, FR80, FR81, FR82, FR83, FR84, FR85, FR86, FR87, FR88

**Dependencies:** Epic 5 (audit data to monitor), Epic 8 (dashboard to view)

---

### Epic 12: Data Management & Compliance
**Goal:** Platform ensures data security, GDPR compliance, and ethical web scraping practices.

**User Outcome:** All sensitive user data encrypted at rest using MongoDB Atlas encryption, users can export all their data in machine-readable format (GDPR compliance), users can permanently delete all their data upon account closure, system respects robots.txt when scraping websites, system rate-limits web scraping requests to avoid overwhelming target servers, and system identifies itself with descriptive user-agent string "AISEO-Bot/1.0 (+https://aiseo.com/bot)" when making web requests.

**FRs Covered:** FR72, FR73, FR74, FR75, FR76, FR77

**Dependencies:** Epic 1 (MongoDB encryption setup), Epic 2 (user accounts), Epic 6 (web scraping)

---

### Epic 13: Google Integrations (Conditional MVP)
**Goal:** Users can connect Google Search Console and Analytics to view correlation between GEO visibility and traditional SEO/traffic metrics.

**User Outcome:** Users connect Google Search Console account via OAuth, system retrieves traditional SEO performance metrics from Search Console, users connect Google Analytics account via OAuth, system retrieves traffic and user behavior data from Analytics, and dashboard displays correlation between GEO visibility and traditional SEO/traffic metrics.

**FRs Covered:** FR67, FR68, FR69, FR70, FR71

**Dependencies:** Epic 8 (dashboard for display), Epic 5 (GEO data for correlation)

**Note:** Conditional MVP feature - only implement if free and easy to integrate (OAuth setup, API costs, complexity evaluation needed)

---

## Epic 1: Project Foundation & Infrastructure

### Story 1.1: Clean Auto-Invoice Codebase and Upgrade to Next.js 15.x with TypeScript Strict Mode

As a developer,
I want to remove all Auto-Invoice specific code and upgrade to Next.js 15.x with TypeScript strict mode,
So that I have a clean foundation ready for AISEO development with no legacy invoice code interfering.

**Acceptance Criteria:**

**Part A: Upgrade Next.js and Enable TypeScript Strict Mode**

**Given** the Auto-Invoice codebase exists (Next.js 13.5.11, TypeScript strict: false)
**When** I upgrade the project
**Then** Next.js is upgraded from 13.5.11 to 15.x
**And** React is upgraded to the latest compatible version (18.x or 19.x)
**And** TypeScript strict mode is enabled in tsconfig.json (`"strict": true`)
**And** Additional strict checks are added: `noUncheckedIndexedAccess`, `noUnusedLocals`, `noUnusedParameters`
**And** All type errors are resolved across the codebase (~100+ expected)
**And** The project compiles without errors
**And** `npm run dev` starts successfully
**And** `npm run build` completes without errors

**Part B: Delete Auto-Invoice Database Models**

**Given** the models/ directory exists
**When** I clean up the models
**Then** The following 6 models are DELETED:
- `models/Client.ts`
- `models/Enterprise.ts`
- `models/Invoice.ts`
- `models/Payment.ts`
- `models/RecurringInvoice.ts`
- `models/Subscription.ts`

**And** The following files are KEPT:
- `models/User.ts` (MODIFIED: remove subscription field, keep auth logic)
- `models/plugins/fieldEncryption.ts` (encryption plugin - reusable)
- `models/plugins/toJSON.ts` (JSON plugin - reusable)

**And** User.ts is modified to remove the subscription nested object

**Part C: Delete Auto-Invoice API Routes**

**Given** the pages/api/ directory exists
**When** I clean up API routes
**Then** The following directories are DELETED entirely:
- `pages/api/invoices/` (12 files)
- `pages/api/clients/` (5 files)
- `pages/api/enterprise/` (2 files)
- `pages/api/payments/` (2 files)
- `pages/api/checkout/` (1 file)
- `pages/api/stripe/` (1 file)
- `pages/api/dashboard/` (2 files)
- `pages/api/emails/` (2 files)
- `pages/api/cron/` (1 file)
- `pages/api/dev/` (1 file)

**And** The following files are DELETED:
- `pages/api/test-invoice-numbering.ts`
- `pages/api/trigger-n8n.ts`
- `pages/api/submit-email.ts`
- `pages/api/secure-example.ts`
- `pages/api/user/subscription.ts`
- `pages/api/user/subscription-status.ts`
- `pages/api/user/check-subscription.ts`
- `pages/api/webhook/stripe.ts`
- `pages/api/webhook/mailgun.ts`

**And** The following auth routes are KEPT and MODIFIED:
- `pages/api/auth/[...nextauth].ts` (MODIFY: remove subscription validation)
- `pages/api/auth/signup.ts` (MODIFY: adjust for AISEO)
- `pages/api/auth/refresh-session.ts` (KEEP as-is)
- `pages/api/auth/session-redirect.ts` (KEEP as-is)
- `pages/api/auth/signout-redirect.ts` (KEEP as-is)

**And** The following user routes are KEPT and MODIFIED:
- `pages/api/user/data.ts` (MODIFY: adjust for AISEO needs)
- `pages/api/user/company.ts` (EVALUATE: may keep for AISEO business info)

**Part D: Delete Auto-Invoice Frontend Pages**

**Given** the pages/ directory exists
**When** I clean up pages
**Then** The following directories are DELETED entirely:
- `pages/dashboard-view/` (entire directory with agenda, clients, invoices, reminders, settings)

**And** The following pages are DELETED:
- `pages/subscription-plans.tsx`
- `pages/payment-success.tsx`

**And** The following pages are KEPT for modification:
- `pages/index.tsx` (landing page - will be replaced with AISEO content)
- `pages/login.tsx` (rebrand for AISEO)
- `pages/signup.tsx` (rebrand for AISEO)
- `pages/dashboard.tsx` (will be replaced with AISEO dashboard)
- `pages/privacy-policy.tsx` (update content)
- `pages/tos.tsx` (update content)
- `pages/404.tsx` (keep as-is)
- `pages/500.tsx` (keep as-is)
- `pages/_app.tsx` (keep structure)
- `pages/_document.tsx` (keep as-is)

**Part E: Modify Security Middleware and Authentication**

**Given** security files exist with subscription checks
**When** I update security logic
**Then** `lib/security-middleware.ts` is modified to:
- KEEP: `withSecurity()`, `sanitizeInput()`, `withRateLimit()`, `withResourceOwnership()`
- REMOVE: All subscription validation logic
- KEEP: Authentication and ownership validation

**And** `pages/api/auth/[...nextauth].ts` is modified to:
- KEEP: Google OAuth + Credentials provider
- KEEP: Password comparison with bcrypt
- KEEP: MongoDB adapter
- REMOVE: Subscription validation in callbacks

**Part F: Update Configuration Files**

**Given** configuration files exist
**When** I update configs
**Then** `next.config.js` is updated:
- KEEP: Security headers (X-Frame-Options, etc.)
- REMOVE: autoinvoice.pro from image domains
- UPDATE: For Next.js 15 compatibility

**And** `vercel.json` is updated or deleted:
- REMOVE: Cron job for check-overdue
- REMOVE: Function configs for invoice routes
- KEEP: Only if AISEO-specific configs needed

**And** `next-sitemap.config.js` is updated for AISEO domain and routes

**Part G: Validation and Testing**

**Given** all cleanup is complete
**When** I validate the cleanup
**Then** `npm install` completes successfully
**And** `npm run dev` starts without errors
**And** `npm run build` completes successfully
**And** No import errors related to deleted files
**And** Authentication still works (login/signup/logout)
**And** Basic page navigation works (/, /login, /signup, /dashboard)
**And** TypeScript compilation shows 0 errors
**And** All deleted files are confirmed removed from git

### Story 1.2: Remove Auto-Invoice UI Components, Clean Dependencies, and Rebrand for AISEO

As a developer,
I want to remove all Auto-Invoice UI components, clean up unnecessary dependencies, remove DaisyUI, and rebrand the application for AISEO,
So that the application is fully cleaned of legacy UI code and ready for AISEO development.

**Acceptance Criteria:**

**Part A: Verify Shadcn/ui Installation (Already Done)**

**Given** Shadcn/ui components exist in the codebase
**When** I verify the installation
**Then** The following components exist in `components/ui/`:
- button.tsx, input.tsx, label.tsx, tooltip.tsx
- DatePicker.tsx, ConfirmationModal.tsx, OptionsMenu.tsx
- circle-dollar-sign.tsx, file-check.tsx, rotate-cw.tsx

**And** `components.json` configuration exists
**And** All Shadcn/ui components render correctly
**And** No additional Shadcn installation is needed

**Part B: Remove DaisyUI from Configuration**

**Given** DaisyUI is referenced in config files
**When** I remove DaisyUI
**Then** `tailwind.config.js` is updated:
- REMOVE: `require("daisyui")` from plugins array
- KEEP: `require("tailwindcss-animate")`
- REMOVE: daisyui theme configuration (lines 119-125)

**And** `config.ts` is updated:
- REMOVE: `import themes from "daisyui/src/theming/themes.js";`
- REPLACE: `main: themes[\`[data-theme=light]\`]["primary"]` with hardcoded color value
- UPDATE: All AutoInvoice branding removed

**And** No DaisyUI references remain in the codebase
**And** The project compiles without DaisyUI-related errors

**Part C: Delete Auto-Invoice UI Components**

**Given** the components/ directory exists
**When** I clean up components
**Then** The following directories are DELETED entirely:
- `components/invoices/` (7 step components)
- `components/clients/` (ClientModal.tsx)
- `components/emails/` (EmailPreviewModal.tsx)

**And** The following components are DELETED:
- `components/AutomationShowcase.tsx`
- `components/DemoVideo.tsx`
- `components/FAQ.tsx` (or MODIFY for AISEO)
- `components/Features.tsx` (or MODIFY for AISEO)
- `components/FinalCta.tsx` (or MODIFY for AISEO)
- `components/Footer.tsx` (or MODIFY for AISEO)
- `components/Header.tsx` (or MODIFY for AISEO)
- `components/Hero.tsx` (or MODIFY for AISEO)
- `components/MultipleTestimonials.tsx`
- `components/Pricing.tsx`
- `components/Roadmap.tsx`
- `components/SingleTestimonial.tsx`
- `components/TestimonialSmall.tsx`

**And** The following dashboard components are EVALUATED:
- `components/dashboard/DashboardLayout.tsx` (MODIFY: remove invoice logic, keep structure)
- `components/dashboard/Sidebar.tsx` (MODIFY: update for AISEO navigation)
- `components/dashboard/StatsCard.tsx` (KEEP: generic component)
- DELETE: InvoicePreview, RecentInvoices, RevenueChart, UpcomingPayments

**And** The following utility components are KEPT:
- All components in `components/ui/` (Shadcn)
- `components/magicui/` (1 component)
- `BetterIcon.tsx`, `ButtonGradient.tsx`, `ButtonPopover.tsx`
- `ErrorBoundary.tsx`, `Layout.tsx`, `Modal.tsx`, `Modals.tsx`
- `NotificationSystem.tsx`, `TagSEO.tsx`, `TagSchema.tsx`
- `LanguageContext.tsx` (will be updated with AISEO translations)
- `EmailPopup.tsx` (if needed)
- `TestButton.tsx` (dev only)

**Part D: Clean Up package.json Dependencies**

**Given** package.json contains Auto-Invoice dependencies
**When** I remove unnecessary packages
**Then** The following PDF generation packages are REMOVED:
- `@sparticuz/chromium`
- `puppeteer-core`
- `playwright-core`
- `@react-pdf/renderer`
- `html2pdf.js`

**And** Stripe is removed (if no payment in MVP):
- `stripe`

**And** Email services are evaluated:
- REMOVE: `mailgun.js` (if using Resend)
- REMOVE: `nodemailer` (if using Resend)
- KEEP: `resend` (if using for emails)
- KEEP: `@react-email/components` and `@react-email/render` (if using)

**And** Vercel Blob is removed (if not storing files):
- REMOVE: `@vercel/blob` (if no file storage needed)

**And** 3D/Animation libraries are evaluated:
- EVALUATE: `@react-three/drei`, `@react-three/fiber`, `three`, `three-globe`, `cobe`
- EVALUATE: `@tsparticles/engine`, `@tsparticles/react`, `@tsparticles/slim`
- DECISION: Remove if not needed for AISEO landing page

**And** Other dependencies evaluated:
- EVALUATE: `react-dropzone` (file upload - might need)
- EVALUATE: `recharts` (charts - might need for AISEO dashboards)
- EVALUATE: `crisp-sdk-web` (chat - needs rebrand if kept)

**And** Core dependencies are KEPT:
- All `@radix-ui/*` packages (Shadcn base)
- `next-auth`, `@next-auth/mongodb-adapter`
- `mongodb`, `mongoose`
- `bcrypt`, `zod`, `date-fns`, `framer-motion`
- `react-hot-toast`, `react-i18next`
- `tailwindcss`, `tailwindcss-animate`, `lucide-react`
- `class-variance-authority`, `clsx`, `tailwind-merge`

**And** `npm install` runs successfully after cleanup

**Part E: Delete Auto-Invoice Library Files**

**Given** libs/ and lib/ directories exist
**When** I clean up libraries
**Then** The following files are DELETED from `libs/`:
- `InvoicePdfDocument.tsx`
- `invoice-generator.ts`
- `gpt.ts` (if not needed for AISEO)
- `mailgun.ts` (if not using Mailgun)
- `stripe.ts` (if no payment)

**And** Core libraries in `libs/` are KEPT:
- `api.ts`, `mongo.ts`, `mongoose.ts`

**And** The following files are DELETED from `lib/`:
- `blob-storage.ts` (if not needed)
- `invoice-automation.ts`
- `invoice-service.ts`
- `pdf-generator.ts`
- `file-storage.ts`
- `stripe.ts`

**And** Core utilities in `lib/` are KEPT:
- `crypto.ts` (AES-256-GCM encryption)
- `error-handler.ts`
- `security-middleware.ts`
- `utils.ts` (cn helper)

**Part F: Replace Assets and Rebrand for AISEO**

**Given** public/ directory contains AutoInvoice assets
**When** I rebrand for AISEO
**Then** The following assets are REPLACED:
- `AutoLogo.png` → AISEO logo
- `logo.png` → AISEO logo
- `logoAndName.png` → AISEO logo
- `favicon.ico` → AISEO favicon
- `favicon-16x16.png`, `favicon-32x32.png` → AISEO favicons
- `apple-touch-icon.png` → AISEO icon
- `android-chrome-192x192.png`, `android-chrome-512x512.png` → AISEO icons
- `safari-pinned-tab.svg` → AISEO icon
- `mstile-150x150.png` → AISEO icon

**And** The following config files are UPDATED:
- `site.webmanifest` (update name, short_name, description for AISEO)
- `browserconfig.xml` (update tile color)
- `robots.txt` (update domain to AISEO)

**And** Old sitemap files are REMOVED (will regenerate after development):
- DELETE: `sitemap.xml`, `sitemap-0.xml`

**And** `config.ts` is fully updated:
- `appName: "AISEO"`
- `domainName: "your-aiseo-domain.com"` (placeholder)
- `appDescription:` Updated for AISEO
- Color theme updated (remove DaisyUI reference)
- Contact info updated

**Part G: Update Translations in LanguageContext**

**Given** `components/LanguageContext.tsx` contains AutoInvoice translations
**When** I update translations
**Then** All translation strings are rewritten for AISEO:
- Remove: All invoice-related translations (facturation, paiement, clients, etc.)
- Add: Placeholder translations for AISEO features (audits, GEO score, recommendations, etc.)
- Keep: Common UI strings (login, signup, dashboard, settings, profile, logout)
- Keep: Form validation messages
- Keep: Error messages structure

**And** Translation keys are organized for AISEO feature areas
**And** Both English and French translations are updated

**Part H: Clean Up Documentation and Scripts**

**Given** documentation and scripts exist
**When** I clean up documentation
**Then** The following docs are DELETED:
- `CHROMIUM_SETUP.md`
- `VERCEL_BLOB_SETUP.md`
- `CRON_SETUP.md`
- `MIGRATION_CLEANUP_SUMMARY.md`
- `TESTING_COMPLETE_GUIDE.md` (or update for AISEO)

**And** The following docs are KEPT and UPDATED:
- `README.md` (rewrite for AISEO)
- `ENV_SETUP.md` (update environment variables)
- `SECURITY_AUDIT.md` (keep security practices)
- `DEPLOYMENT_GUIDE.md` (update for AISEO)
- `CLAUDE.md` (replace with AISEO architecture)

**And** The following scripts are DELETED from `scripts/`:
- `verify-subscription.js`
- `check-config.js` (or update for AISEO)
- `verify-blob-config.js`
- `clean-recurring-duplicates.js`
- `test-subscription-flow.md`
- `MANUAL_TEST_GUIDE.md`
- `QUICK_TEST_REFERENCE.md`
- `README_TESTING.md`
- `TEST_SUMMARY.md`

**And** The following misc files are DELETED:
- `security-fixes.js`
- `security-tests.js`
- `security-report.json`
- `cookies.txt`
- `.kiro/` (entire directory)

**Part I: Update Environment Variables Documentation**

**Given** `.env.example` or ENV_SETUP.md exists
**When** I update environment variable documentation
**Then** The following variables are REMOVED from documentation:
- Stripe variables (if no payment): `STRIPE_*`
- Vercel Blob: `BLOB_READ_WRITE_TOKEN` (if not storing files)
- Mailgun: `MAILGUN_*` (if using Resend)
- Cron: `CRON_SECRET`
- Google OAuth: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` (if not using)

**And** The following variables are KEPT:
- MongoDB: `MONGODB_URI`, `MONGODB_ENCRYPTION_KEY`
- NextAuth: `NEXTAUTH_URL`, `NEXTAUTH_SECRET`
- Email: `RESEND_API_KEY`, `RESEND_FROM_EMAIL` (if using Resend)

**And** Placeholders are added for AISEO-specific variables:
- `OPENAI_API_KEY` (placeholder - for AI analysis)
- `ANTHROPIC_API_KEY` (placeholder - for AI analysis)
- `PERPLEXITY_API_KEY` (placeholder)
- `DEEPSEEK_API_KEY` (placeholder)
- Other AISEO-specific keys as needed

**And** `.env.example` is updated with the new variable list

**Part J: Validation and Final Testing**

**Given** all cleanup and rebrand is complete
**When** I validate the final state
**Then** The project structure is clean:
- No invoice/client/enterprise code remains
- No DaisyUI references remain
- All AutoInvoice branding is removed
- AISEO branding is in place (even if placeholder)

**And** The application builds and runs:
- `npm install` completes successfully
- `npm run dev` starts without errors
- `npm run build` completes successfully
- `npm run lint` passes (or shows only expected warnings)

**And** Basic functionality works:
- Landing page loads (with AISEO branding)
- Login page loads and works
- Signup page loads and works
- Dashboard page loads (even if empty)
- Logout works
- 404 and 500 pages load

**And** No console errors related to deleted components
**And** All Git changes are committed with clear commit message
**And** Package.json shows reduced dependency count
**And** Documentation is updated and accurate

### Story 1.3: Setup Zustand State Management and Zod Validation

As a developer,
I want Zustand 4.x for state management and Zod 3.x for validation,
So that I have predictable state and runtime type validation.

**Acceptance Criteria:**

**Given** Project dependencies are installed
**When** I configure Zustand and Zod
**Then** Zustand 4.x is installed and a sample store is created with verb-first naming (set/update/clear)
**And** Zod 3.x is installed and validation schemas are set up for common types
**And** Dual validation pattern (Zod at API, Mongoose at DB) is documented in project-context.md

### Story 1.4: Configure Docker Compose for Local Scraping Service

As a developer,
I want a Docker Compose configuration for the scraping service,
So that I can run the Python + Selenium scraping service locally without AWS complexity.

**Acceptance Criteria:**

**Given** Docker is installed on the development machine
**When** I run docker-compose up
**Then** A Python + Selenium container starts successfully
**And** The container exposes a REST API on localhost:5000
**And** Bearer token authentication (PROCESSING_SERVICE_API_KEY) is configured
**And** docker-compose.yml includes environment variables for API keys

### Story 1.5: Setup GitLab CI/CD Pipeline

As a developer,
I want a GitLab CI/CD pipeline configured,
So that code quality is automatically validated on every commit.

**Acceptance Criteria:**

**Given** The project is pushed to GitLab
**When** I commit code to any branch
**Then** GitLab CI runs lint, type-check, and test stages
**And** .gitlab-ci.yml is configured with Node 20 image
**And** Pipeline fails if any stage fails
**And** Coverage threshold is set to 80%
**And** Pipeline status badge is added to README.md

### Story 1.6: Create Environment Configuration and .env.example

As a developer,
I want a comprehensive .env.example file,
So that all required environment variables are documented for team members.

**Acceptance Criteria:**

**Given** All architectural decisions are finalized
**When** I create .env.example
**Then** All 38 required environment variables are documented with descriptions
**And** Variables are grouped by category (MongoDB, NextAuth, Stripe, AI APIs, etc.)
**And** Sample values are provided where appropriate
**And** .env is added to .gitignore
**And** README.md includes setup instructions referencing .env.example

### Story 1.7: Setup Upstash Redis for Rate Limiting

As a developer,
I want Upstash Redis configured for production-ready rate limiting,
So that API endpoints are protected from abuse.

**Acceptance Criteria:**

**Given** Upstash Redis account is created
**When** I configure rate limiting
**Then** @upstash/redis and @upstash/ratelimit are installed
**And** UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are configured
**And** A rate-limit middleware is created for API routes
**And** Rate limits are set to reasonable defaults (e.g., 100 requests per 15 minutes)

---

## Epic 2: User Authentication & Account Management

### Story 2.1: Implement Email/Password User Registration

As a user,
I want to create an account using my email and password,
So that I can access the AISEO platform.

**Acceptance Criteria:**

**Given** I am on the registration page
**When** I enter my email, password (min 8 chars), and confirm password
**Then** My account is created with bcrypt password hashing (10 rounds)
**And** User document is saved to MongoDB with encrypted sensitive fields
**And** I receive a welcome email via Resend
**And** I am redirected to the dashboard
**And** Validation errors are displayed for invalid inputs (weak password, email already exists)

### Story 2.2: Implement Google OAuth Authentication

As a user,
I want to sign up and log in using my Google account,
So that I can access AISEO without creating a new password.

**Acceptance Criteria:**

**Given** I am on the login/registration page
**When** I click "Sign in with Google"
**Then** I am redirected to Google OAuth consent screen
**And** After approving, my account is created or I am logged in
**And** My Google profile information (email, name, avatar) is saved to User document
**And** I am redirected to the dashboard
**And** Session is maintained with JWT token

### Story 2.3: Implement Password Reset Flow

As a user,
I want to reset my password via email,
So that I can regain access to my account if I forget my password.

**Acceptance Criteria:**

**Given** I am on the "Forgot Password" page
**When** I enter my email address
**Then** A password reset email is sent with a time-limited token (1 hour expiry)
**And** Clicking the link opens a password reset form
**And** After entering new password (validated for strength), my password is updated with bcrypt
**And** I receive a confirmation email that my password was changed
**And** I can log in with the new password

### Story 2.4: Implement Profile Management

As a user,
I want to view and edit my profile information,
So that I can keep my account details up to date.

**Acceptance Criteria:**

**Given** I am logged in
**When** I navigate to my profile page
**Then** I see my current email, name, and language preference
**And** I can edit my name and language preference (English or French)
**And** I can change my password by providing current password and new password
**And** Changes are saved to MongoDB
**And** UI language updates immediately when I change language preference
**And** Success/error messages are displayed

### Story 2.5: Implement Account Deletion with GDPR Compliance

As a user,
I want to delete my account and all associated data,
So that I can exercise my GDPR right to erasure.

**Acceptance Criteria:**

**Given** I am logged in
**When** I navigate to account settings and request account deletion
**Then** I am prompted to confirm deletion with my password
**And** All my data is permanently deleted (User, Projects, Audits, Subscriptions, Reports)
**And** I receive a confirmation email that my account was deleted
**And** I am logged out and redirected to the homepage
**And** I cannot log in with the deleted account credentials

---

## Epic 3: Subscription & Payment System

### Story 3.1: Implement Stripe Checkout for One-Time Audits

As a user,
I want to purchase a one-time audit for €300,
So that I can test AISEO without a recurring subscription.

**Acceptance Criteria:**

**Given** I am logged in
**When** I click "Purchase One-Time Audit"
**Then** I am redirected to Stripe Checkout with €300 price
**And** After successful payment, I am redirected back to the dashboard
**And** My account is credited with 1 audit credit
**And** I receive a payment receipt email via Resend
**And** Stripe webhook updates User document with credit

### Story 3.2: Implement Subscription Tier Selection and Checkout

As a user,
I want to subscribe to Basic (€50), Pro (€150), or Premium (€300) tiers,
So that I can access recurring project limits and audits.

**Acceptance Criteria:**

**Given** I am on the subscription plans page
**When** I select a tier (Basic/Pro/Premium) and click "Subscribe"
**Then** I am redirected to Stripe Checkout with the correct price
**And** After successful payment, Stripe webhook creates Subscription document
**And** User document is updated with active subscription status and tier
**And** I am redirected to the dashboard with tier-appropriate project limits
**And** I receive a subscription confirmation email

### Story 3.3: Implement Subscription Upgrade/Downgrade

As a user,
I want to upgrade or downgrade my subscription tier,
So that I can adjust my plan based on my needs.

**Acceptance Criteria:**

**Given** I have an active subscription
**When** I navigate to subscription management and select a different tier
**Then** I am redirected to Stripe Checkout for the new tier
**And** Stripe handles proration calculations automatically
**And** After payment, my subscription tier is updated via webhook
**And** Project limits are updated immediately to match new tier
**And** I receive an email confirming the plan change

### Story 3.4: Implement Subscription Cancellation

As a user,
I want to cancel my subscription,
So that I am not charged for future billing periods.

**Acceptance Criteria:**

**Given** I have an active subscription
**When** I navigate to subscription management and click "Cancel Subscription"
**Then** I am prompted to confirm cancellation
**And** Stripe webhook marks subscription as "canceled" at period end
**And** I retain access until the current billing period ends
**And** After the period ends, my subscription status is updated to "inactive"
**And** I receive a cancellation confirmation email

### Story 3.5: Implement Stripe Customer Portal Integration

As a user,
I want to manage my payment methods and billing history,
So that I can update my card or view past invoices.

**Acceptance Criteria:**

**Given** I have an active subscription
**When** I click "Manage Billing" in subscription settings
**Then** I am redirected to Stripe Customer Portal
**And** I can add, update, or remove payment methods
**And** I can view billing history and download invoices
**And** Changes in Stripe Customer Portal are synced to my account via webhooks

### Story 3.6: Implement Stripe Webhook Handler

As a developer,
I want to process Stripe webhook events reliably,
So that subscription lifecycle events update the database correctly.

**Acceptance Criteria:**

**Given** Stripe sends webhook events
**When** Events like checkout.session.completed, customer.subscription.updated, or invoice.payment_failed are received
**Then** Webhook signature is validated with STRIPE_WEBHOOK_SECRET
**And** Events are processed idempotently (duplicate events are ignored)
**And** User and Subscription documents are updated accordingly
**And** Errors are logged to Sentry with webhook payload
**And** Failed webhooks return 200 OK but log errors for manual review

---

## Epic 4: Project Management

### Story 4.1: Implement Project Creation

As a user,
I want to create a new project by providing brand name and primary URL,
So that I can audit a website for GEO visibility.

**Acceptance Criteria:**

**Given** I am logged in with an active subscription
**When** I navigate to "Create Project" and enter brand name and primary URL
**Then** A new Project document is created in MongoDB
**And** URL is validated (must be valid HTTP/HTTPS URL)
**And** Project is associated with my user account
**And** I am redirected to the project details page
**And** Project count is checked against my subscription tier limit (Basic=1, Pro=5, Premium=10+)
**And** Error is shown if I exceed my tier limit

### Story 4.2: Implement Sub-URL and Competitor URL Addition

As a user,
I want to add optional sub-URLs and up to 5 competitor URLs to my project,
So that I can audit specific pages and compare against competitors.

**Acceptance Criteria:**

**Given** I have created a project
**When** I navigate to project details and click "Add Sub-URL" or "Add Competitor"
**Then** I can add multiple sub-URLs (e.g., /blog, /shop, /about)
**And** I can add up to 5 competitor URLs with validation
**And** Each URL is validated for correct format
**And** Sub-URLs and competitors are saved to Project document
**And** I cannot add more than 5 competitors (UI disables button)

### Story 4.3: Implement Project List View

As a user,
I want to view a list of all my projects,
So that I can navigate to any project's audits and details.

**Acceptance Criteria:**

**Given** I am logged in
**When** I navigate to the projects page
**Then** I see a list of all my projects with brand name, primary URL, and last audit date
**And** Projects are sorted by creation date (newest first)
**And** Each project card shows subscription tier badge (Basic/Pro/Premium)
**And** I can click on a project to view details
**And** Empty state is shown if I have no projects with CTA to create first project

### Story 4.4: Implement Project Editing

As a user,
I want to edit my project details,
So that I can update brand name, URLs, or competitors.

**Acceptance Criteria:**

**Given** I am viewing a project's details
**When** I click "Edit Project"
**Then** I see a form pre-filled with current brand name, primary URL, sub-URLs, and competitors
**And** I can update any field
**And** Changes are saved to MongoDB after validation
**And** I see a success message
**And** Updated data is reflected immediately in the UI

### Story 4.5: Implement Project Deletion

As a user,
I want to delete a project and all its audit history,
So that I can remove projects I no longer need.

**Acceptance Criteria:**

**Given** I am viewing a project's details
**When** I click "Delete Project"
**Then** I am prompted to confirm deletion with project name
**And** Project document, all associated Audit documents, and all PDF reports are permanently deleted
**And** I am redirected to the projects list
**And** Success message is displayed
**And** My project count for tier limits is decremented

---

## Epic 5: Audit Engine Core

### Story 5.1: Implement Audit Initiation and Queue Management

As a user,
I want to initiate a GEO audit for my project,
So that I can start analyzing my website's AI visibility.

**Acceptance Criteria:**

**Given** I have a project with primary URL
**When** I click "Run Audit"
**Then** An Audit document is created with status "pending"
**And** Audit is queued for processing
**And** I see a loading state with "Audit in progress" message
**And** 10-second polling starts to check audit status
**And** I cannot start another audit for the same project while one is in progress

### Story 5.2: Implement 100 AI Prompt Testing Across 4 Engines

As a developer,
I want the scraping service to test 100 AI prompts across ChatGPT, Claude, Perplexity, and DeepSeek in parallel,
So that audits complete in 5-8 minutes instead of 20+ minutes.

**Acceptance Criteria:**

**Given** An audit is queued
**When** The Docker scraping service processes the audit
**Then** 100 prompts are tested across 4 AI engines in parallel
**And** Each prompt includes the business/brand name and relevant context
**And** Responses are scraped and analyzed for business mentions
**And** Results are stored in Audit document with prompt-level details
**And** AI API rate limits are respected with exponential backoff (1s → 2s → 4s → 8s)
**And** Audit times out after 10 minutes if not completed

### Story 5.3: Implement GEO Health Score Calculation

As a user,
I want to see a GEO Health Score (0-100%) for my audit,
So that I can quickly understand my overall AI visibility.

**Acceptance Criteria:**

**Given** An audit has completed prompt testing
**When** The system calculates the GEO Health Score
**Then** Score is calculated as (mentions / total prompts) × 100
**And** Score is color-coded (0-40% = red, 41-70% = orange, 71-100% = green)
**And** Score is saved to Audit document
**And** Score is displayed prominently on the dashboard
**And** Historical score trends are trackable over multiple audits

### Story 5.4: Implement Competitor Visibility Comparison

As a user,
I want to see how my visibility compares to my competitors,
So that I can identify where I'm losing ground.

**Acceptance Criteria:**

**Given** My project has competitor URLs configured
**When** An audit is run
**Then** The same 100 prompts are tested for each competitor URL
**And** Competitor GEO Health Scores are calculated
**And** Dashboard displays a comparison chart (my score vs competitors)
**And** I can see which prompts competitors were mentioned in but I wasn't
**And** Competitor data is stored in Audit document for historical comparison

### Story 5.5: Implement Prompt Category Analysis

As a user,
I want to identify which prompt categories show strongest/weakest visibility,
So that I can focus optimization efforts on weak areas.

**Acceptance Criteria:**

**Given** An audit is completed
**When** I view audit results
**Then** Prompts are categorized by type (e.g., "Local search", "Product recommendations", "Service providers", "Expert advice")
**And** Visibility percentage is calculated per category
**And** Dashboard displays category breakdown with strengths and weaknesses highlighted
**And** I can drill down into specific prompts within each category

### Story 5.6: Implement Audit History and Trend Tracking

As a user,
I want to view my audit history over time,
So that I can track improvements after implementing recommendations.

**Acceptance Criteria:**

**Given** I have run multiple audits for a project
**When** I navigate to audit history
**Then** I see a timeline of all audits with dates and GEO Health Scores
**And** I can view trend charts showing score changes over time
**And** I can compare any two audits to see which prompts changed
**And** I can see which recommendations I implemented between audits
**And** Historical audit data is queryable for up to 12 months

---

## Epic 6: HTML Scanner & Technical Analysis

### Story 6.1: Implement Website HTML Structure Scanning

As a user,
I want the system to automatically scan my website's HTML structure,
So that technical issues affecting AI visibility are identified.

**Acceptance Criteria:**

**Given** An audit is in progress
**When** The scraping service scans the website
**Then** Homepage and key sub-URLs are fetched and parsed
**And** HTML structure is analyzed (DOM tree depth, element counts)
**And** Scan respects robots.txt directives
**And** User-agent string is set to "AISEO-Bot/1.0 (+https://aiseo.com/bot)"
**And** Rate limiting prevents overwhelming target server (max 5 requests per second)

### Story 6.2: Implement Schema.org Markup Detection

As a user,
I want to know which schema.org markup is already present on my site,
So that I don't duplicate existing structured data.

**Acceptance Criteria:**

**Given** HTML scanning is complete
**When** The system analyzes schema markup
**Then** All schema.org types are detected (Organization, Person, Product, FAQPage, LocalBusiness, etc.)
**And** JSON-LD, Microdata, and RDFa formats are all recognized
**And** Detected schemas are listed in audit results with page URLs
**And** Missing schema opportunities are flagged
**And** Invalid or malformed schema is reported with fix suggestions

### Story 6.3: Implement Meta Tag Analysis

As a user,
I want meta tag analysis (title, description, Open Graph, Twitter Cards),
So that I can optimize tags for AI engine crawlers.

**Acceptance Criteria:**

**Given** HTML scanning is complete
**When** The system analyzes meta tags
**Then** Title tag length is checked (optimal: 50-60 chars)
**And** Meta description length is checked (optimal: 150-160 chars)
**And** Open Graph tags (og:title, og:description, og:image, og:url) are detected
**And** Twitter Card tags (twitter:card, twitter:title, twitter:description) are detected
**And** Missing or suboptimal meta tags are flagged with priority levels
**And** Recommendations include optimal lengths and examples

### Story 6.4: Implement Heading Structure Evaluation

As a user,
I want heading structure (H1-H6) evaluated,
So that content hierarchy is optimized for AI understanding.

**Acceptance Criteria:**

**Given** HTML scanning is complete
**When** The system evaluates headings
**Then** Heading hierarchy is analyzed (H1 → H2 → H3 logical flow)
**And** Multiple H1 tags on the same page are flagged
**And** Missing headings or skipped heading levels (H1 → H3) are detected
**And** Keyword presence in headings is analyzed
**And** Recommendations prioritize fixing hierarchy issues (🔴 Critical)

### Story 6.5: Implement Image Alt Text Audit

As a user,
I want all images audited for alt text presence and quality,
So that visual content is accessible to AI engines.

**Acceptance Criteria:**

**Given** HTML scanning is complete
**When** The system audits images
**Then** All <img> tags are identified
**And** Images missing alt text are flagged (count and specific URLs)
**And** Alt text quality is scored (empty, generic like "image.jpg", or descriptive)
**And** Recommendations include specific images with suggested alt text
**And** Decorative images (can have empty alt) are distinguished from content images

### Story 6.6: Implement Keyword Extraction with TF-IDF Scoring

As a user,
I want the top 30 keywords extracted from my content,
So that I know what topics AI engines associate with my site.

**Acceptance Criteria:**

**Given** HTML scanning is complete
**When** The system extracts keywords
**Then** Text content from all scanned pages is aggregated
**And** TF-IDF (Term Frequency-Inverse Document Frequency) scoring ranks keywords
**And** Top 30 keywords are extracted with relevance scores
**And** Common stop words are filtered out
**And** Keywords are displayed in audit results with frequency and pages where they appear
**And** Recommendations include suggested keywords missing from content

---

## Epic 7: AI-Powered Recommendations

### Story 7.1: Implement FAQ Generation Based on Business Category

As a user,
I want 10 FAQ questions and answers generated based on my business category,
So that I can add structured FAQ content optimized for AI engines.

**Acceptance Criteria:**

**Given** An audit is in progress
**When** The AI recommendation engine runs
**Then** User's business category (selected during audit setup) is used as context
**And** 10 relevant FAQ questions are generated using AI (OpenAI or Claude API)
**And** Each question has a detailed, natural-language answer (100-200 words)
**And** FAQs are stored in Audit document
**And** FAQs are copy-paste ready for website implementation
**And** FAQs are localized in user's preferred language (English or French)

### Story 7.2: Implement Schema.org JSON-LD Code Snippet Generation

As a user,
I want copy-paste ready schema.org JSON-LD code snippets,
So that I can implement structured data without technical knowledge.

**Acceptance Criteria:**

**Given** Schema opportunities are identified
**When** The system generates recommendations
**Then** JSON-LD snippets are generated for missing schema types (Organization, FAQPage, Product, LocalBusiness)
**And** Snippets are pre-filled with data extracted from the website
**And** Each snippet includes implementation instructions ("Add to <head> section")
**And** Snippets are validated against schema.org standards
**And** User can click "Copy Code" to copy to clipboard
**And** Priority is set to 🔴 Critical if schema is missing entirely

### Story 7.3: Implement Alt Text Suggestions for Images

As a user,
I want optimized alt text suggestions for images without descriptions,
So that I can improve accessibility and AI understanding.

**Acceptance Criteria:**

**Given** Image audit identified images without alt text
**When** The AI recommendation engine runs
**Then** AI analyzes image context (surrounding text, page topic) to suggest alt text
**And** Alt text suggestions are descriptive and keyword-rich (50-100 chars)
**And** Suggestions are stored per image URL
**And** User can review and copy suggested alt text
**And** Priority is 🟠 Important if alt text is missing on multiple images

### Story 7.4: Implement Additional Keyword Recommendations

As a user,
I want keyword recommendations to improve AI visibility,
So that I can expand content to cover more relevant topics.

**Acceptance Criteria:**

**Given** Keyword extraction is complete
**When** The system generates keyword recommendations
**Then** AI identifies related keywords missing from current content
**And** Keywords are ranked by relevance and search intent
**And** Recommendations include where to add keywords (specific pages or sections)
**And** Keyword density targets are provided (e.g., "Mention 'GEO optimization' 3-5 times on homepage")
**And** Priority is 🟢 Nice-to-have (lower urgency than technical fixes)

### Story 7.5: Implement Recommendation Prioritization System

As a user,
I want recommendations prioritized with 🔴 Critical / 🟠 Important / 🟢 Nice-to-have levels,
So that I focus on high-impact fixes first.

**Acceptance Criteria:**

**Given** All recommendations are generated
**When** The system prioritizes them
**Then** Priority is calculated based on impact (blocks AI visibility) and effort (< 1 hour = high priority)
**And** 🔴 Critical: Missing schema, broken H1 tags, no meta description (high impact, low effort)
**And** 🟠 Important: Suboptimal alt text, missing FAQs (moderate impact, moderate effort)
**And** 🟢 Nice-to-have: Additional keywords, minor optimizations (low impact or high effort)
**And** Recommendations are sorted by priority in audit results
**And** Dashboard displays priority counts (e.g., "5 Critical, 8 Important, 12 Nice-to-have")

### Story 7.6: Implement Plain-Language Explanations and Implementation Instructions

As a user,
I want every recommendation to have a plain-language explanation and specific implementation instructions,
So that non-technical users can understand and act on recommendations.

**Acceptance Criteria:**

**Given** Recommendations are generated
**When** User views recommendations
**Then** Each recommendation includes a Grade 8 reading level explanation (no technical jargon)
**And** Implementation instructions specify exact code locations ("Add this to <head>", "Update line 42 in index.html")
**And** Code snippets are syntax-highlighted and copy-paste ready
**And** Before/after examples are provided where applicable
**And** Estimated implementation time is displayed (e.g., "5 minutes", "30 minutes")

---

## Epic 8: Dashboard & Visualizations

### Story 8.1: Implement GEO Health Score Display with Color Coding

As a user,
I want to see my GEO Health Score prominently displayed with color coding,
So that I can quickly understand my overall AI visibility status.

**Acceptance Criteria:**

**Given** An audit is completed
**When** I view the dashboard
**Then** GEO Health Score is displayed as a large circular progress indicator
**And** Score is color-coded (0-40% = red, 41-70% = orange, 71-100% = green)
**And** Score includes a trend indicator (up/down arrow vs previous audit)
**And** Hover tooltip explains what the score means
**And** Dashboard layout follows Dreelio-inspired design (clean, generous spacing)

### Story 8.2: Implement Prompt Gap Analysis Visualization

As a user,
I want to view Prompt Gap Analysis showing percentage visibility across categories,
So that I can identify weak areas.

**Acceptance Criteria:**

**Given** An audit is completed
**When** I view the dashboard
**Then** A bar chart displays visibility % by prompt category (Local search, Product recommendations, etc.)
**And** Chart uses Recharts library with smooth animations
**And** Categories with < 30% visibility are highlighted in red
**And** I can click on a category to drill down into specific prompts
**And** Chart is responsive and adapts to mobile/tablet/desktop

### Story 8.3: Implement Competitor Comparison Charts

As a user,
I want to see competitor comparison charts,
So that I can benchmark my performance against 3-5 competitors.

**Acceptance Criteria:**

**Given** Competitor data is available
**When** I view the dashboard
**Then** A horizontal bar chart compares my GEO Health Score vs competitors
**And** My score is highlighted with distinct color
**And** Competitors are labeled with domain names
**And** Chart shows where I rank (1st, 2nd, 3rd, etc.)
**And** I can click on a competitor to see detailed prompt-by-prompt comparison

### Story 8.4: Implement Top Priority Issues Display

As a user,
I want to see the top 3-5 priority issues with plain-language descriptions,
So that I know what to fix first.

**Acceptance Criteria:**

**Given** Recommendations are prioritized
**When** I view the dashboard
**Then** Top 3-5 🔴 Critical issues are displayed prominently at the top
**And** Each issue includes a plain-language description (no technical jargon)
**And** Quick action buttons are available ("Copy Code", "View Details")
**And** Issues are displayed as cards with priority badges
**And** If no critical issues exist, top 🟠 Important issues are shown

### Story 8.5: Implement Audit History Timeline

As a user,
I want to view my audit history timeline,
So that I can track improvements over time.

**Acceptance Criteria:**

**Given** Multiple audits have been run
**When** I navigate to audit history
**Then** A timeline displays all audits with dates and GEO Health Scores
**And** Timeline is sortable by date (newest/oldest first)
**And** Each audit entry is clickable to view full results
**And** Trend line chart shows score changes over time
**And** I can filter by date range (last 7 days, 30 days, 90 days, all time)

### Story 8.6: Implement Multi-Audit Comparison for Trend Tracking

As a user,
I want to compare multiple audits to track improvement trends,
So that I can see the impact of my optimizations.

**Acceptance Criteria:**

**Given** I have 2+ audits for a project
**When** I select "Compare Audits"
**Then** I can select up to 3 audits to compare side-by-side
**And** Comparison shows score changes, new prompts where I'm mentioned, and fixed issues
**And** Differences are highlighted with green (improved) or red (worsened) indicators
**And** I can export comparison as PDF or CSV

### Story 8.7: Implement Dashboard Language Switching

As a user,
I want to switch dashboard language between English and French without page reload,
So that I can use AISEO in my preferred language.

**Acceptance Criteria:**

**Given** I am on the dashboard
**When** I click the language switcher (EN/FR)
**Then** All dashboard text updates instantly without page reload
**And** Language preference is saved to User document in MongoDB
**And** Preference persists across sessions
**And** All UI elements (buttons, labels, tooltips) are translated
**And** Date/time formats adapt to language (EN: MM/DD/YYYY, FR: DD/MM/YYYY)

---

## Epic 9: Report Generation & Distribution

### Story 9.1: Implement Professional PDF Report Generation

As a user,
I want to generate a professional PDF report from my audit results,
So that I can present findings to clients or team members.

**Acceptance Criteria:**

**Given** An audit is completed
**When** PDF generation is triggered (automatically after audit or manually)
**Then** A PDF is generated with brand logo header and clean typography (Inter font)
**And** PDF includes GEO Health Score, charts, recommendations, and technical details
**And** PDF generation completes within 2 minutes (async processing)
**And** PDF is stored in Vercel Blob Storage with secure URL
**And** PDF URL is saved to Audit document

### Story 9.2: Implement Executive Summary Section in Reports

As a user,
I want a 1-page visual executive summary in my report,
So that business owners can quickly understand key findings without technical details.

**Acceptance Criteria:**

**Given** PDF report is being generated
**When** Executive summary section is created
**Then** Summary is limited to 1 page with large visuals
**And** Summary includes GEO Health Score, top 3 issues, and quick wins
**And** Language is non-technical and action-oriented
**And** Visuals use color-coding (red/orange/green) for quick understanding
**And** Summary is the first section of the PDF after the cover page

### Story 9.3: Implement Technical Details Section with Code Snippets

As a developer user,
I want 5-10 pages of technical details with code snippets in my report,
So that I can implement recommendations accurately.

**Acceptance Criteria:**

**Given** PDF report is being generated
**When** Technical details section is created
**Then** Section includes all recommendations with priority levels
**And** Code snippets are syntax-highlighted and formatted for readability
**And** Implementation instructions specify exact code locations
**And** Before/after examples are provided for key changes
**And** Section includes schema.org snippets, FAQ content, and meta tag recommendations

### Story 9.4: Implement Report Localization (English/French)

As a user,
I want PDF reports generated in my preferred language,
So that I can present reports to French-speaking clients.

**Acceptance Criteria:**

**Given** User has selected a language preference (English or French)
**When** PDF report is generated
**Then** All report sections are translated to the selected language
**And** Chart labels, headings, and body text are localized
**And** Number formats adapt to language (EN: 1,000.50, FR: 1 000,50)
**And** Date formats adapt to language (EN: Jan 15, 2025, FR: 15 janv. 2025)
**And** Code snippets remain in English (universal programming language)

### Story 9.5: Implement PDF Download from Dashboard

As a user,
I want to download PDF reports directly from the dashboard,
So that I can access reports anytime.

**Acceptance Criteria:**

**Given** A report PDF is generated and stored
**When** I view audit results on the dashboard
**Then** A "Download Report" button is prominently displayed
**And** Clicking the button downloads the PDF from Vercel Blob Storage
**And** Download is authenticated (only the report owner can download)
**And** Download link is time-limited and expires after 7 days (regenerate if needed)
**And** Download button shows loading state while fetching PDF

### Story 9.6: Implement Email Notification When Report is Ready

As a user,
I want to receive an email notification when my report PDF is ready,
So that I know when to check the dashboard.

**Acceptance Criteria:**

**Given** PDF report generation is triggered
**When** PDF generation completes successfully
**Then** An email is sent to the user via Resend
**And** Email includes audit summary (GEO Health Score, project name, date)
**And** Email includes a direct link to view the report on the dashboard
**And** Email is localized in user's preferred language (English or French)
**And** Email has 95%+ deliverability (SPF/DKIM configured)

### Story 9.7: Implement Report Download Link Sharing

As a user,
I want to share report download links with team members or clients,
So that they can access reports without logging in.

**Acceptance Criteria:**

**Given** A PDF report exists
**When** I click "Share Report"
**Then** A shareable link is generated with time-limited access (7 days)
**And** Link can be copied to clipboard
**And** Link opens a public page with download button (no login required)
**And** Link expires after 7 days and displays "Link expired" message
**And** I can regenerate expired links from the dashboard

---

## Epic 10: Email Notifications

### Story 10.1: Implement Welcome Email on Account Creation

As a user,
I want to receive a welcome email when I create my account,
So that I feel acknowledged and know next steps.

**Acceptance Criteria:**

**Given** I successfully create an account
**When** Registration is complete
**Then** A welcome email is sent via Resend within 1 minute
**And** Email includes my name and a brief introduction to AISEO
**And** Email includes CTA to create my first project
**And** Email is localized in my selected language preference
**And** Email has 95%+ deliverability

### Story 10.2: Implement Audit Completion Notification

As a user,
I want to receive an email when my audit is complete,
So that I can immediately review results.

**Acceptance Criteria:**

**Given** My audit completes successfully
**When** Audit status changes to "completed"
**Then** An email is sent via Resend with audit summary
**And** Email includes GEO Health Score and project name
**And** Email includes a direct link to view results on the dashboard
**And** Email is sent within 1 minute of audit completion
**And** Email is localized in my preferred language

### Story 10.3: Implement Subscription Confirmation Email

As a user,
I want to receive a confirmation email when I subscribe,
So that I have a record of my subscription details.

**Acceptance Criteria:**

**Given** I successfully subscribe to a tier (Basic/Pro/Premium)
**When** Stripe webhook confirms subscription
**Then** A subscription confirmation email is sent via Resend
**And** Email includes subscription tier, price, billing date, and features
**And** Email includes a link to manage subscription (Stripe Customer Portal)
**And** Email is localized in my preferred language

### Story 10.4: Implement Payment Receipt Email

As a user,
I want to receive payment receipts via email,
So that I have records for accounting purposes.

**Acceptance Criteria:**

**Given** A payment is successfully processed (one-time or subscription)
**When** Stripe webhook confirms payment
**Then** A payment receipt email is sent via Resend
**And** Email includes invoice number, amount, date, and payment method (last 4 card digits)
**And** Email includes a link to download invoice from Stripe
**And** Email is localized in my preferred language
**And** Email complies with EU invoicing requirements (VAT, company details if applicable)

---

## Epic 11: Admin Interface & Operations

### Story 11.1: Implement Admin Dashboard Access with Authentication

As an admin,
I want to access a dedicated admin dashboard protected by authentication,
So that I can monitor platform operations securely.

**Acceptance Criteria:**

**Given** I am an admin user
**When** I navigate to /admin
**Then** I am prompted for admin credentials (separate from user auth)
**And** After authentication, I can access the admin dashboard
**And** Admin actions are logged with timestamp and admin user ID
**And** Non-admin users are denied access with 403 Forbidden error

### Story 11.2: Implement All-User Audit List with Filters

As an admin,
I want to view a list of all audits across all users with filters,
So that I can monitor platform usage and debug issues.

**Acceptance Criteria:**

**Given** I am logged into the admin dashboard
**When** I navigate to the audits page
**Then** I see a table of all audits with columns: User Email, Business Name, Status, GEO Score, Date
**And** Table is paginated (50 audits per page)
**And** I can filter by status (pending, processing, completed, failed)
**And** I can filter by date range
**And** I can search by user email or business name
**And** Table is sortable by any column

### Story 11.3: Implement Detailed Audit Information View

As an admin,
I want to view detailed information for any audit,
So that I can debug issues and verify quality.

**Acceptance Criteria:**

**Given** I click on an audit in the admin list
**When** The audit details page loads
**Then** I see all audit data: user details, business details, status, GEO score, prompt results, recommendations, PDF URL, processing logs
**And** I can view raw API responses from AI engines (ChatGPT, Claude, Perplexity, DeepSeek)
**And** I can see timestamps for each processing stage
**And** I can see error logs if the audit failed
**And** I can click "View as User" to see the exact dashboard the user sees

### Story 11.4: Implement Manual Audit Data Editing with Audit Trail

As an admin,
I want to manually edit audit data if corrections are needed,
So that I can fix data issues without database access.

**Acceptance Criteria:**

**Given** I am viewing an audit's details
**When** I click "Edit Audit"
**Then** I can edit fields like GEO score, recommendations, or status
**And** Changes are saved to MongoDB
**And** All edits are logged to an audit trail with admin user ID, timestamp, and changed fields
**And** I cannot edit audit data without providing a reason for the change
**And** Audit trail is visible on the audit details page

### Story 11.5: Implement Manual PDF Report Regeneration

As an admin,
I want to manually regenerate PDF reports for any audit,
So that I can fix report generation errors or update report formats.

**Acceptance Criteria:**

**Given** I am viewing an audit's details
**When** I click "Regenerate Report"
**Then** PDF generation is triggered manually
**And** Old PDF is replaced with new PDF in Vercel Blob Storage
**And** User is notified via email that a new report is available
**And** Regeneration is logged to admin audit trail

### Story 11.6: Implement Platform-Wide Statistics Dashboard

As an admin,
I want to view platform-wide statistics,
So that I can monitor business health and growth.

**Acceptance Criteria:**

**Given** I am on the admin dashboard homepage
**When** The page loads
**Then** I see key metrics: Total audits (daily, weekly, monthly), Success rate (completed / total), Average processing time, User count by subscription tier (Basic/Pro/Premium), MRR (Monthly Recurring Revenue), Churn rate
**And** Metrics are displayed with trend indicators (up/down vs previous period)
**And** Charts show historical trends (last 30 days)
**And** I can filter metrics by date range

### Story 11.7: Implement Audit Search and Filtering

As an admin,
I want to search and filter audits by multiple criteria,
So that I can quickly find specific audits.

**Acceptance Criteria:**

**Given** I am on the audits page
**When** I use the search/filter interface
**Then** I can search by user email, business name, or audit ID
**And** I can filter by audit status (pending, processing, completed, failed)
**And** I can filter by date range
**And** I can filter by GEO score range (e.g., 0-40%, 41-70%, 71-100%)
**And** Multiple filters can be combined (e.g., "Failed audits in last 7 days")

### Story 11.8: Implement Error Log Viewing for Failed Audits

As an admin,
I want to view error logs and debug information for failed audits,
So that I can identify and fix issues.

**Acceptance Criteria:**

**Given** An audit has failed
**When** I view the audit details
**Then** I see a detailed error log with stack traces
**And** I see which processing stage failed (prompt testing, HTML scanning, PDF generation, etc.)
**And** I see which AI APIs failed (if applicable)
**And** Logs are formatted for readability with syntax highlighting
**And** I can copy logs to clipboard for sharing with developers

### Story 11.9: Implement Manual Audit Retry Trigger

As an admin,
I want to manually trigger audit retry for failed audits,
So that users don't lose their audit credits.

**Acceptance Criteria:**

**Given** An audit has failed
**When** I click "Retry Audit"
**Then** Audit status is reset to "pending"
**And** Audit is re-queued for processing
**And** User is notified via email that their audit is being retried
**And** Retry is logged to admin audit trail
**And** I cannot retry an already completed audit

### Story 11.10: Implement Raw AI API Response Viewer

As an admin,
I want to view raw API responses from AI engines,
So that I can debug prompt testing issues.

**Acceptance Criteria:**

**Given** I am viewing an audit's details
**When** I navigate to "AI API Responses"
**Then** I see raw JSON responses from ChatGPT, Claude, Perplexity, and DeepSeek
**And** Responses are grouped by AI engine
**And** I can filter by prompt ID to see specific responses
**And** JSON is formatted and syntax-highlighted for readability
**And** I can copy raw JSON to clipboard

---

## Epic 12: Data Management & Compliance

### Story 12.1: Enable MongoDB Atlas Encryption for Sensitive Data

As a developer,
I want all sensitive user data encrypted at rest using MongoDB Atlas,
So that data breaches are mitigated and GDPR compliance is maintained.

**Acceptance Criteria:**

**Given** MongoDB Atlas cluster is configured
**When** Encryption is enabled
**Then** MongoDB Atlas encryption-at-rest is enabled for the cluster
**And** MONGODB_ENCRYPTION_KEY environment variable is set
**And** Sensitive fields (email, password hashes, payment info, API keys, business details) are encrypted
**And** Encryption is verified by checking MongoDB Atlas dashboard
**And** README.md documents encryption configuration

### Story 12.2: Implement GDPR-Compliant User Data Export

As a user,
I want to export all my data in machine-readable format,
So that I can exercise my GDPR right to data portability.

**Acceptance Criteria:**

**Given** I am logged in
**When** I navigate to account settings and request data export
**Then** All my data is exported as JSON (User, Projects, Audits, Subscriptions, Reports)
**And** Export includes audit history, recommendations, and PDF URLs
**And** Export is downloadable within 1 minute
**And** Export is available for 7 days then automatically deleted
**And** I receive an email when export is ready

### Story 12.3: Implement Permanent User Data Deletion on Account Closure

As a user,
I want all my data permanently deleted when I close my account,
So that my GDPR right to erasure is respected.

**Acceptance Criteria:**

**Given** I request account deletion
**When** Deletion is confirmed
**Then** All my data is permanently deleted from MongoDB (User, Projects, Audits, Subscriptions)
**And** All PDF reports in Vercel Blob Storage are deleted
**And** Stripe subscription is canceled via webhook
**And** Deletion is irreversible (no soft delete)
**And** I receive a confirmation email that my data was deleted
**And** Deletion is logged for compliance auditing

### Story 12.4: Implement robots.txt Compliance for Web Scraping

As a developer,
I want the scraping service to respect robots.txt,
So that AISEO follows ethical web scraping practices.

**Acceptance Criteria:**

**Given** A website is being scanned
**When** The scraping service fetches robots.txt
**Then** Disallowed paths in robots.txt are not scraped
**And** User-agent "AISEO-Bot" is used to identify the scraper
**And** If robots.txt blocks AISEO-Bot, scanning is skipped with a warning to the user
**And** Compliance is logged for auditing

### Story 12.5: Implement Web Scraping Rate Limiting

As a developer,
I want web scraping rate-limited to avoid overwhelming target servers,
So that AISEO is a good web citizen.

**Acceptance Criteria:**

**Given** A website is being scanned
**When** The scraping service makes requests
**Then** Requests are rate-limited to max 5 per second
**And** Delays are added between requests (200ms minimum)
**And** Concurrent requests to the same domain are limited to 2
**And** If a 429 (Too Many Requests) response is received, scraping backs off exponentially (1s → 2s → 4s → 8s)

### Story 12.6: Implement Descriptive User-Agent String for Web Requests

As a developer,
I want a descriptive user-agent string used for all web requests,
So that website owners can identify and whitelist AISEO-Bot.

**Acceptance Criteria:**

**Given** The scraping service makes HTTP requests
**When** Requests are sent
**Then** User-agent header is set to "AISEO-Bot/1.0 (+https://aiseo.com/bot)"
**And** User-agent includes a URL where website owners can learn more about the bot
**And** User-agent is compliant with RFC 7231 standards
**And** Requests include a contact email in case of issues

---

## Epic 13: Google Integrations (Conditional MVP)

### Story 13.1: Implement Google Search Console OAuth Connection

As a user,
I want to connect my Google Search Console account,
So that I can view traditional SEO metrics alongside GEO visibility.

**Acceptance Criteria:**

**Given** I am on the integrations page
**When** I click "Connect Google Search Console"
**Then** I am redirected to Google OAuth consent screen
**And** After approving, my Search Console account is connected
**And** OAuth tokens are securely stored in User document (encrypted)
**And** Connection status is displayed on the dashboard
**And** I can disconnect at any time

### Story 13.2: Implement Traditional SEO Metrics Retrieval from Search Console

As a user,
I want traditional SEO performance metrics retrieved from Search Console,
So that I can compare GEO visibility with traditional search performance.

**Acceptance Criteria:**

**Given** Google Search Console is connected
**When** An audit is run
**Then** SEO metrics are fetched for the project URL (impressions, clicks, CTR, average position)
**And** Metrics are fetched for the last 30 days
**And** If Search Console API fails, audit continues with a warning ("SEO data unavailable")
**And** Metrics are displayed on the dashboard in a separate "SEO Metrics" section

### Story 13.3: Implement Google Analytics OAuth Connection

As a user,
I want to connect my Google Analytics account,
So that I can view traffic and user behavior data alongside GEO visibility.

**Acceptance Criteria:**

**Given** I am on the integrations page
**When** I click "Connect Google Analytics"
**Then** I am redirected to Google OAuth consent screen
**And** After approving, my Google Analytics account is connected
**And** OAuth tokens are securely stored in User document (encrypted)
**And** Connection status is displayed on the dashboard
**And** I can disconnect at any time

### Story 13.4: Implement Traffic and User Behavior Data Retrieval from Analytics

As a user,
I want traffic and user behavior data retrieved from Google Analytics,
So that I can correlate GEO improvements with traffic changes.

**Acceptance Criteria:**

**Given** Google Analytics is connected
**When** An audit is run
**Then** Traffic data is fetched for the project URL (sessions, users, page views, bounce rate)
**And** Data is fetched for the last 30 days
**And** If Google Analytics API fails, audit continues with a warning ("Traffic data unavailable")
**And** Metrics are displayed on the dashboard in a "Traffic Metrics" section

### Story 13.5: Implement GEO vs SEO/Traffic Correlation Display

As a user,
I want to see correlation between GEO visibility and traditional SEO/traffic metrics,
So that I can validate the business impact of GEO improvements.

**Acceptance Criteria:**

**Given** Google Search Console and Analytics are connected
**When** Multiple audits have been run over time
**Then** Dashboard displays a correlation chart (GEO Health Score vs Organic Traffic over time)
**And** Chart shows if GEO improvements correlate with traffic increases
**And** I can filter chart by date range (last 30 days, 90 days, 12 months)
**And** If no correlation is found, insights suggest possible reasons ("Traffic lag: 2-4 weeks typical")

