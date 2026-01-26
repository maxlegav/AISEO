# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Structure

This is a monorepo containing two main projects:

- **`WebSite/`**: Next.js application - The main invoice management SaaS (LoopBill/AutoInvoice)
- **`server/`**: Backend service (minimal - most logic is in WebSite)

All development work primarily happens in the `WebSite/` directory.

## Common Commands

### Development
```bash
cd WebSite
npm run dev          # Start development server on localhost:3000
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Testing
```bash
# Manual testing scripts in WebSite/scripts/
node scripts/check-config.js                  # Verify environment configuration
node scripts/verify-subscription.js <email>   # Check user subscription in DB

# See TESTING_COMPLETE_GUIDE.md for complete testing procedures
```

## Architecture Overview

### Core Application Structure

**Framework**: Next.js 13 (Pages Router) with TypeScript, MongoDB (Mongoose), NextAuth, Stripe

**Key Directories**:
- `pages/`: Next.js pages and API routes
- `pages/api/`: Backend API endpoints
- `components/`: React components
- `models/`: Mongoose schemas
- `libs/`: Core utilities and integrations
- `types/`: TypeScript definitions

### Data Models

**User Model** (`models/User.ts`):
- Supports single "pro" plan subscription model
- Subscription embedded directly in User document
- Password hashing with bcrypt pre-save hook

**Invoice Model** (`models/Invoice.ts`):
- Stores **snapshots** of client and enterprise data at creation time (critical for historical accuracy)
- Uses field-level encryption plugin for sensitive enterprise data
- Statuses: `PENDING`, `PAID`, `LATE`, `REMINDED`, `CANCELLED`
- Supports recurring invoices with intervals
- `pdfUrl` points to Vercel Blob Storage

**Subscription Model** (`models/Subscription.ts`):
- Single "pro" plan only (10€/month)
- Compound index ensures one active subscription per user
- Synced with Stripe webhooks

**Other Models**:
- `Client.ts`: Customer/client management
- `Enterprise.ts`: User's company information (with encryption)
- `Payment.ts`: Payment tracking
- `RecurringInvoice.ts`: Recurring invoice templates

### PDF Generation Pipeline

**Critical**: This app uses a specialized setup for serverless PDF generation:

1. **Puppeteer Configuration** (`libs/invoice-generator.ts`):
   - Uses `puppeteer-core` + `@sparticuz/chromium` for Vercel compatibility
   - Environment detection: Chromium in production, local Chrome in development
   - Set `PUPPETEER_EXECUTABLE_PATH` in `.env.local` if Chrome is not in standard location

2. **PDF Storage**:
   - All PDFs stored in **Vercel Blob Storage** (not filesystem)
   - Download endpoint: `/api/invoices/pdf/download`
   - Secured with authentication checks

3. **Vercel Function Configuration** (`vercel.json`):
   - `api/invoices/create.ts`: 30s timeout, 1024MB memory (PDF generation is resource-intensive)
   - `api/invoices/pdf/download.ts`: 10s timeout, 512MB memory

**See**: `CHROMIUM_SETUP.md` and `VERCEL_BLOB_SETUP.md` for details.

### Subscription System

**Single Pro Plan Architecture**:
- The app has been migrated from a multi-plan system to a single "pro" plan at 10€/month
- All features included in this single plan
- Configuration in `config.ts` and environment variable `STRIPE_PRICE_ID_PRO`

**Payment Flow**:
1. User signs up → account created with no subscription
2. Redirected to `/subscription-plans` page
3. Stripe Checkout session created via `/api/checkout`
4. After payment → Stripe webhook (`/api/webhook/stripe`) updates User and creates Subscription document
5. Redirect to `/dashboard` with active subscription

**Important Stripe Webhook Events**:
- `checkout.session.completed`: Initial subscription creation
- `customer.subscription.updated`: Subscription changes
- `customer.subscription.deleted`: Cancellation
- `invoice.payment_succeeded`: Recurring payments
- `invoice.payment_failed`: Payment failures

### Authentication & Security

**NextAuth Configuration** (`pages/api/auth/[...nextauth].ts`):
- Credentials provider (email/password)
- Google OAuth provider
- MongoDB adapter for session storage
- Session strategy: JWT

**Security Measures**:
- Field-level encryption for sensitive data (enterprise info, client data)
- Encryption key: `MONGODB_ENCRYPTION_KEY` environment variable
- Security headers configured in `next.config.js`
- Password hashing with bcrypt (10 rounds)

**See**: `SECURITY_AUDIT.md` for complete security review.

### Automated Reminders System

**Cron Job** (`vercel.json`):
- Runs daily at 00:05 Paris time
- Endpoint: `/api/cron/check-overdue?secret=$CRON_SECRET`

**Reminder Logic**:
1. Check all invoices with status `PENDING` and `dueDate` passed → mark as `LATE`
2. Send first reminder email immediately for newly `LATE` invoices
3. Send second reminder after 7 days (if `reminderCount < 2`)
4. Stop after 2 reminders

**Email Templates**: `emails/ReminderEmail.tsx`

**See**: `CRON_SETUP.md` for configuration details.

## Environment Variables

**Critical Required Variables**:

```bash
# MongoDB
MONGODB_URI=mongodb+srv://...
MONGODB_ENCRYPTION_KEY=<32-byte base64 key>

# NextAuth
NEXTAUTH_URL=http://localhost:3000  # or production URL
NEXTAUTH_SECRET=<generated secret>

# Stripe - Single Pro Plan
STRIPE_PRICE_ID_PRO=price_xxxxx     # The ONLY plan price ID
STRIPE_SECRET_KEY=sk_test_xxx       # or sk_live_xxx for production
STRIPE_PUBLIC_KEY=pk_test_xxx       # or pk_live_xxx for production
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Vercel Blob Storage
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxx  # Auto-generated in production

# Email (Resend)
RESEND_API_KEY=re_xxx
RESEND_FROM_EMAIL=noreply@domain.com

# Cron Security
CRON_SECRET=<secure key>
```

**See**: `ENV_SETUP.md` for complete list and setup instructions.

## Key API Endpoints

### Invoices
- `POST /api/invoices/create` - Create invoice with PDF generation
- `GET /api/invoices` - List user invoices
- `POST /api/invoices/update-status` - Update invoice status (PENDING/PAID/LATE/CANCELLED)
- `GET /api/invoices/pdf/download?invoiceId=xxx` - Download PDF (authenticated)
- `GET /api/invoices/next-number` - Get next invoice number for user

### Subscription
- `POST /api/checkout` - Create Stripe Checkout session
- `POST /api/webhook/stripe` - Stripe webhook handler (validates signature)

### Clients & Enterprise
- `POST /api/clients/save` - Create/update client
- `GET /api/clients/list` - List user's clients
- `POST /api/enterprise` - Update user's company information

### Authentication
- `/api/auth/[...nextauth]` - NextAuth endpoints
- `/api/auth/signup` - User registration

### Cron
- `GET /api/cron/check-overdue?secret=xxx` - Automated reminder job

## Important Implementation Details

### Invoice Number Generation
- Format: Configurable per user/enterprise
- Atomic increment using MongoDB transactions
- Never reuse invoice numbers (unique constraint)

### Client and Enterprise Snapshots
When creating an invoice, the current state of the client and enterprise is **captured and stored** in the invoice document (`clientSnapshot`, `enterpriseSnapshot`). This ensures historical invoices remain accurate even if client/enterprise data changes later.

### Field Encryption Plugin
The `models/plugins/fieldEncryption.ts` plugin encrypts specified fields at rest in MongoDB. Used for:
- Enterprise data (SIRET, VAT number, bank details, etc.)
- Invoice snapshots of enterprise data

Encryption/decryption is automatic on save/load.

### Language Support
The app has extensive i18n via `components/LanguageContext.tsx`:
- French and English supported
- All UI strings should be added to the translation object
- Use `t()` function from context for user-facing text

## Development Guidelines

### When Modifying Invoices
1. Always consider the snapshot architecture
2. PDF regeneration may be needed if template changes
3. Test with Chromium setup (development uses local Chrome)
4. Verify Vercel Blob Storage integration for new PDF fields

### When Modifying Subscriptions
1. Currently single "pro" plan only - do not add multi-plan logic without discussion
2. Always test Stripe webhooks in test mode first
3. Verify both User.subscription and Subscription model are updated consistently
4. Check payment success flow: webhook → DB update → redirect

### When Adding API Routes
1. Always validate authentication using NextAuth `getSession()`
2. Validate user ownership of resources (invoices, clients, etc.)
3. Use try-catch and return appropriate error codes
4. Log errors for debugging but don't expose sensitive data

### When Modifying Models
1. Consider encryption requirements for sensitive fields
2. Update TypeScript interfaces alongside schemas
3. Be cautious with unique indexes (can cause issues in production)
4. Test with existing data migration in mind

## Testing

**Manual Testing Guide**: See `scripts/MANUAL_TEST_GUIDE.md`

**Quick Test Commands**:
```bash
# Test subscription flow with Stripe test card
# Card: 4242 4242 4242 4242, Exp: 12/25, CVC: 123

# Verify configuration
node scripts/check-config.js

# Verify user subscription after payment
node scripts/verify-subscription.js <email>
```

**Test Mode Credentials**:
- Use Stripe test mode keys in development
- Webhook testing: Use Stripe CLI or Stripe Dashboard webhook testing

## Deployment

**Platform**: Vercel

**Pre-deployment Checklist**:
1. Verify all environment variables set on Vercel (use production Stripe keys)
2. Test PDF generation locally first
3. Verify `BLOB_READ_WRITE_TOKEN` is configured
4. Check `vercel.json` function timeouts are sufficient
5. Test webhook endpoint is accessible (no auth required for Stripe webhooks)

**Post-deployment**:
1. Configure Stripe webhook URL: `https://yourdomain.com/api/webhook/stripe`
2. Verify cron job execution in Vercel logs
3. Test complete signup → payment → invoice creation flow

**See**: `DEPLOYMENT_GUIDE.md` for detailed deployment steps.

## Important Files for Reference

- `config.ts` - Main app configuration (pricing, Stripe, branding)
- `TESTING_COMPLETE_GUIDE.md` - Complete testing procedures
- `CHROMIUM_SETUP.md` - Puppeteer/Chromium setup for Vercel
- `VERCEL_BLOB_SETUP.md` - Blob storage configuration
- `ENV_SETUP.md` - Complete environment variable documentation
- `DEPLOYMENT_GUIDE.md` - Deployment procedures
- `CRON_SETUP.md` - Automated reminders configuration
- `SECURITY_AUDIT.md` - Security review and best practices

## Common Issues & Solutions

### PDF Generation Fails on Vercel
- Check `@sparticuz/chromium` is installed
- Verify function timeout is 30s (see `vercel.json`)
- Check memory allocation (1024MB recommended)

### Stripe Webhook Not Working
- Verify `STRIPE_WEBHOOK_SECRET` is set
- Check webhook signature validation
- Ensure endpoint is accessible without authentication
- Test with Stripe CLI: `stripe listen --forward-to localhost:3000/api/webhook/stripe`

### Invoice Not Saved After PDF Generation
- Check MongoDB connection string
- Verify field encryption key is set
- Check for unique constraint violations (invoice number)

### User Subscription Not Updated After Payment
- Check Stripe webhook is firing
- Verify webhook includes `STRIPE_PRICE_ID_PRO` in line items
- Check both User.subscription and Subscription model are updated
- Review webhook handler logs

### Cron Job Not Running
- Verify `CRON_SECRET` is set
- Check Vercel cron configuration in `vercel.json`
- Review function logs in Vercel dashboard
