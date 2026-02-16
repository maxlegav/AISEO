---
project_name: "ShowYourBrand"
user_name: "Maxlemoinegavoille"
date: "2026-01-13"
last_updated: "2026-01-21"
status: "complete"
sections_completed:
  [
    "technology_stack",
    "architecture",
    "security_patterns",
    "data_patterns",
    "code_organization",
    "improvements",
    "architectural_decisions",
    "implementation_patterns",
    "anti_patterns",
  ]
source_analysis: "Auto-Invoice codebase (Next.js SaaS) + Architecture Document (2026-01-21)"
reuse_strategy: "Keep technical plumbing, replace business logic"
architecture_document: "/Users/maxlemoinegavoille/Desktop/Projets/ShowYourBrand/_bmad-output/planning-artifacts/architecture.md"
optimized_for_llm: true
rule_count: 100+
---

# Project Context for AI Agents - ShowYourBrand

_This document defines critical rules, patterns, and technical decisions that all AI agents MUST follow when implementing code for the ShowYourBrand project. This project reuses the technical infrastructure from Auto-Invoice while replacing all business logic for SEO/GEO auditing._

---

## 🎯 Project Overview

**ShowYourBrand** is a SaaS platform for auditing business visibility in AI engines (ChatGPT, Claude, Perplexity, DeepSeek) and traditional search engines. Target audience: non-technical business owners. Distribution: white-label via marketing agencies.

**Architecture Philosophy:**

- **Frontend + Backend**: Next.js (Pages Router) handles both UI and business logic
- **Scraping Service**: Separate Node.js containerized service for heavy processing (scraping, AI requests)
- **Separation**: Next.js = auth, database, payments, UI | Service = scraping, AI analysis
- **MVP-First**: Simple, beautiful, accessible - NOT a complex "Ahrefs clone"

---

## 📦 Technology Stack

### Core Framework

- **Next.js**: 15.x (Pages Router, NOT App Router)
  - API Routes: `/pages/api/*`
  - Compatibility verified with React 18.2.0+
- **React**: 18.2.0+
- **TypeScript**: 5.8.3+
  - **CRITICAL**: Use `strict: true` in tsconfig.json
  - Enable all strict checks: `noImplicitAny`, `strictNullChecks`, `strictFunctionTypes`, etc.

### Database & Auth

- **MongoDB**: 5.9.2+ (Cloud Atlas)
- **Mongoose**: 7.4.4+ (ODM, tested with MongoDB 5.9.2+)
- **NextAuth**: 4.24.11+
  - Providers: Google OAuth + Credentials (email/password)
  - Session: JWT strategy (30-day maxAge)
  - MongoDB adapter: Custom (not NextAuth's adapter)

### Payments & Subscriptions

- **Stripe**: 13.2.0+ (latest API version)
  - Webhooks: Required for subscription lifecycle

### Storage & Email

- **Vercel Blob Storage**: PDF and file uploads
  - Environment: `BLOB_READ_WRITE_TOKEN`
  - Access: Public with auth checks in API routes
- **Resend**: Email service provider
  - Environment: `RESEND_API_KEY`, `RESEND_FROM_EMAIL`

### UI Framework ✅ CONFIRMED

- **Tailwind CSS + Shadcn/ui** (DECISION FINALIZED 2026-01-21)
  - Install: `npx shadcn-ui@latest init`
  - Components: button, card, dialog, dropdown-menu, tabs, table, tooltip, badge
  - **NEVER mix multiple UI frameworks** (Auto-Invoice had 3 - this was a mistake)

### State Management ✅ NEW

- **Zustand**: 4.x
  - For global state: auditStore, userStore, dashboardStore
  - TypeScript-first, 1.2kb footprint
  - Action naming: Verb-first pattern (set/update/clear/toggle)
  - Compatibility verified with React 18.2.0+

### Validation ✅ NEW

- **Zod**: 3.x
  - API boundary validation (before Mongoose)
  - TypeScript type inference
  - **Dual Validation Strategy**: Zod at API layer, Mongoose at database layer
  - Compatibility verified with TypeScript 5.8.3+ strict mode

### Rate Limiting ✅ PRODUCTION-READY

- **Upstash Redis**: For production rate limiting
  - **NEVER use in-memory Map** (Auto-Invoice anti-pattern)
  - Libraries: `@upstash/ratelimit` + `@upstash/redis`
  - Environment: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`

### DevOps & Deployment

- **Hosting**: Vercel (Next.js frontend/backend)
- **Containerization**: Docker (scraping service, local only for MVP)
- **CI/CD**: GitLab CI/CD (NOT GitHub Actions)
  - Pipeline: `.gitlab-ci.yml` in project root
  - Stages: lint → type-check → test → coverage
  - Vercel auto-deploy on merge to main
- **Environment**: Vercel dashboard for production env vars

---

## 🏗️ Architecture Decisions

### 1. Two-Entity Architecture

```
┌─────────────────────────────────────────┐
│   Next.js Application (Vercel)          │
│   - API Routes (/pages/api)             │
│   - Authentication (NextAuth)            │
│   - Database (MongoDB/Mongoose)          │
│   - Payments (Stripe)                    │
│   - Dashboard UI                         │
│   - Business Logic                       │
└──────────────┬──────────────────────────┘
               │ HTTP Requests
               ▼
┌─────────────────────────────────────────┐
│   Scraping Service (Docker)              │
│   - Node.js + Puppeteer                  │
│   - AI API integrations                  │
│   - Website scraping                     │
│   - Content analysis                     │
│   - Heavy processing                     │
└─────────────────────────────────────────┘
```

**CRITICAL RULES:**

- Next.js IS the backend (NOT just frontend)
- Scraping service is ONLY for heavy processing (no database access)
- Next.js communicates with service via authenticated HTTP endpoints
- Service runs locally in dev, AWS Lambda/EC2 in production

### 2. File Structure (Pages Router)

```
/pages/
  /api/                    → Backend API routes
    /auth/                 → NextAuth endpoints
    /audits/               → Audit CRUD operations
    /businesses/           → Business management
    /webhook/              → Stripe, service webhooks
  /dashboard/              → Protected dashboard pages
  /index.tsx               → Landing page
/models/                   → Mongoose schemas
  /plugins/                → Reusable schema plugins
/lib/                      → Modern utilities (USE THIS, not libs/)
  security-middleware.ts   → Auth/security HOCs
  error-handler.ts         → Centralized error handling
  crypto.ts                → Field encryption
  blob-storage.ts          → Vercel Blob operations
/components/               → React components
  /ui/                     → Primitive UI components
  /{domain}/               → Domain-specific components
/config.ts                 → Centralized app configuration
/types/                    → TypeScript type definitions
```

**NAMING CONVENTIONS:**

- Components: `PascalCase.tsx` (e.g., `AuditCard.tsx`)
- UI Primitives: `kebab-case.tsx` (e.g., `button.tsx`)
- API Routes: `kebab-case.ts` or `camelCase.ts`
- Models: `PascalCase.ts` (e.g., `Audit.ts`, `Business.ts`)
- Utils: `kebab-case.ts` (e.g., `error-handler.ts`)

**PATH ALIAS:**

```typescript
// tsconfig.json
"paths": {
  "@/*": ["./*"]
}

// Usage everywhere:
import { Audit } from "@/models/Audit";
import config from "@/config";
```

---

## 🔐 Security Patterns (MUST FOLLOW)

### 1. Field-Level Encryption (AES-256-GCM)

**Pattern from Auto-Invoice** (Keep this!)

```typescript
// lib/crypto.ts
const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 96-bit nonce

Format: "ENC::<b64(iv)>:<b64(ciphertext)>:<b64(tag)>"
Key: 32-byte base64 from MONGODB_ENCRYPTION_KEY

// ⚠️ IMPROVEMENT: Fail-closed instead of fail-open
// Auto-Invoice returns original value on decrypt error
// NEW PROJECT: Throw error on decrypt failure
export function decryptString(serialized: string): string {
  if (!serialized.startsWith("ENC::")) return serialized;
  try {
    // ... decryption logic
    return plaintext.toString("utf8");
  } catch (error) {
    // 🚨 OLD: return serialized (fail-open)
    // ✅ NEW: throw new Error("Decryption failed") (fail-closed)
    throw new Error("Failed to decrypt sensitive data");
  }
}
```

**When to Encrypt:**

- Business sensitive data (SIRET, VAT numbers, bank details)
- Audit snapshots (business info at time of audit)
- API keys stored in database
- Any PII (Personally Identifiable Information)

**Plugin Usage:**

```typescript
// models/Audit.ts
AuditSchema.plugin(fieldEncryptionPlugin, {
  fields: [
    "businessSnapshot.taxId",
    "businessSnapshot.apiKeys",
    "businessSnapshot.contactEmail",
  ],
});
```

### 2. API Route Security Pattern (MANDATORY)

**Every API route MUST follow this pattern:**

```typescript
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import {
  sanitizeInput,
  handleApiError,
  requireAuth,
  secureLog,
} from "@/lib/security-middleware";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    // 1. ALWAYS sanitize input first
    if (req.body) {
      req.body = sanitizeInput(req.body);
    }

    // 2. Get session
    const session = await getServerSession(req, res, authOptions);

    // 3. Require authentication
    requireAuth(session);

    const userId = session.user.id;

    // 4. Method check
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    // 5. Business logic here
    secureLog.info("Processing audit request", { userId });

    // ... your code

    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    return handleApiError(error, res);
  }
}
```

### 3. Security Middleware HOCs

**Use these HOCs for common patterns:**

```typescript
// lib/security-middleware.ts

// Basic auth + context
withSecurity(handler);

// Auth + requires active subscription
withSubscriptionRequired(handler);

// Auth + verify resource ownership
withResourceOwnership(
  (req) => req.query.auditId as string,
  AuditModel,
  "userId",
)(handler);

// Rate limiting
withRateLimit(maxRequests, windowMs)(handler);
```

### 4. Input Sanitization (IMPROVED)

**Auto-Invoice pattern** (good but can be better):

```typescript
export function sanitizeInput(input: any): any {
  if (typeof input === "string") {
    return input
      .replace(/[<>]/g, "") // XSS basic
      .replace(/\$[\w\d]+/g, "") // MongoDB operators
      .trim();
  }

  if (input && typeof input === "object") {
    // 🚨 Block dangerous MongoDB operators
    const dangerousKeys = [
      "$where",
      "$regex",
      "$ne",
      "$gt",
      "$lt",
      "$in",
      "$nin",
    ];

    // ⚠️ IMPROVEMENT: Add more operators
    // ✅ NEW: Block ALL $ operators by default, whitelist safe ones
    const allKeys = Object.keys(input);
    for (const key of allKeys) {
      if (key.startsWith("$")) {
        delete input[key];
      }
    }

    // Recursively sanitize
    const sanitized: any = {};
    for (const [key, value] of Object.entries(input)) {
      if (typeof key === "string" && !key.startsWith("$")) {
        sanitized[sanitizeInput(key)] = sanitizeInput(value);
      }
    }
    return sanitized;
  }

  return input;
}
```

### 5. Rate Limiting (MUST IMPROVE)

**Auto-Invoice**: In-memory Map (NOT production-ready)

**ShowYourBrand**: Use Redis or Upstash for production

```typescript
// ⚠️ Auto-Invoice uses in-memory store (lost on restart, doesn't scale)
// ✅ For ShowYourBrand: Use Upstash Redis (serverless-friendly) or Vercel KV

// Example with Upstash:
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "10 s"), // 10 requests per 10 seconds
});

export function withRateLimit(handler) {
  return async (req, res) => {
    const identifier = req.headers["x-forwarded-for"] || "anonymous";
    const { success } = await ratelimit.limit(identifier);

    if (!success) {
      return res.status(429).json({ error: "Rate limit exceeded" });
    }

    return handler(req, res);
  };
}
```

### 6. Next.js Security Headers

```javascript
// next.config.js
async headers() {
  return [
    {
      source: '/(.*)',
      headers: [
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-XSS-Protection', value: '1; mode=block' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        // ✅ ADD for ShowYourBrand:
        {
          key: 'Content-Security-Policy',
          value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';"
        },
      ]
    }
  ];
}
```

---

## 📊 Data Patterns (Mongoose)

### 1. Snapshot Pattern (CRITICAL)

**Use Case**: Historical data integrity (audits, invoices, reports)

```typescript
// models/Audit.ts

const AuditSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  businessId: { type: Schema.Types.ObjectId, ref: "Business", required: true },

  // 🎯 SNAPSHOT: Store complete business data at audit time
  businessSnapshot: {
    name: { type: String, required: true },
    website: { type: String, required: true },
    industry: { type: String },
    contactEmail: { type: String },
    // ... complete business data
  },

  auditResults: {
    seoScore: Number,
    geoVisibility: Object,
    // ... audit data
  },

  createdAt: { type: Date, default: Date.now },
});

// ⚠️ RULE: NEVER use populated references for historical data
// Always snapshot the related document at creation time
```

**Why Snapshots?**

- Business info changes over time (name, website, contact)
- Audit must reflect business state at audit time
- Historical accuracy is mandatory for compliance

### 2. Password Hashing (Pre-Save Hook)

```typescript
// models/User.ts
import bcrypt from "bcrypt";

UserSchema.pre("save", async function (next) {
  const user = this;

  // Only hash if password is modified or new
  if (!user.isModified("password") || !user.password) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
    next();
  } catch (error: any) {
    return next(error);
  }
});

UserSchema.methods.comparePassword = async function (
  candidatePassword: string,
): Promise<boolean> {
  if (!this.password) return false;
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    return false;
  }
};
```

**RULES:**

- NEVER store plain text passwords
- ALWAYS use bcrypt (NOT crypto.hash - not designed for passwords)
- Salt rounds: 10 (good balance of security/performance)

### 3. Field Encryption Plugin

**Reusable plugin for automatic encrypt/decrypt:**

```typescript
// models/plugins/fieldEncryption.ts

export const fieldEncryptionPlugin = (
  schema: Schema,
  options: { fields: string[] },
) => {
  const { fields } = options;

  function encryptInDoc(doc: any) {
    for (const field of fields) {
      const value = getNestedValue(doc, field);
      if (value && !isEncrypted(value)) {
        setNestedValue(doc, field, encryptString(value));
      }
    }
  }

  function decryptInDoc(doc: any) {
    for (const field of fields) {
      const value = getNestedValue(doc, field);
      if (value && isEncrypted(value)) {
        setNestedValue(doc, field, decryptString(value));
      }
    }
  }

  // Hooks
  schema.pre("save", function (next) {
    encryptInDoc(this);
    next();
  });

  schema.post("find", function (result: any) {
    if (Array.isArray(result)) {
      result.forEach(decryptInDoc);
    } else if (result) {
      decryptInDoc(result);
    }
    return result;
  });

  schema.post("findOne", function (result: any) {
    if (result) decryptInDoc(result);
    return result;
  });
};
```

**Usage:**

```typescript
AuditSchema.plugin(fieldEncryptionPlugin, {
  fields: [
    "businessSnapshot.taxId",
    "businessSnapshot.apiKeys",
    "apiCredentials.chatgptKey",
  ],
});
```

### 4. Timestamps & Soft Deletes

```typescript
// All models should have timestamps
const AuditSchema = new Schema(
  {
    // ... fields
  },
  {
    timestamps: true, // Adds createdAt, updatedAt automatically
  },
);

// Soft delete pattern (optional)
const BusinessSchema = new Schema({
  // ... fields
  deletedAt: { type: Date, default: null },
});

// Query helper for soft deletes
BusinessSchema.query.active = function () {
  return this.where({ deletedAt: null });
};

// Usage: Business.find().active()
```

### 5. Indexes for Performance

```typescript
// models/Audit.ts

// Single field indexes
AuditSchema.index({ userId: 1 });
AuditSchema.index({ businessId: 1 });
AuditSchema.index({ createdAt: -1 }); // Descending for recent-first

// Compound indexes
AuditSchema.index({ userId: 1, createdAt: -1 });

// Unique constraint
AuditSchema.index({ userId: 1, reportId: 1 }, { unique: true });

// Text search (for search functionality)
BusinessSchema.index({
  name: "text",
  description: "text",
});
```

**RULES:**

- Index fields used in `find()` queries
- Index foreign keys (userId, businessId)
- Compound index for common query patterns
- Don't over-index (slows writes)

---

## 🔄 Error Handling (Centralized)

### 1. Custom Error Class

```typescript
// lib/error-handler.ts

export enum ErrorType {
  AUTHENTICATION = "AUTHENTICATION_ERROR",
  AUTHORIZATION = "AUTHORIZATION_ERROR",
  VALIDATION = "VALIDATION_ERROR",
  NOT_FOUND = "NOT_FOUND",
  CONFLICT = "CONFLICT",
  RATE_LIMIT = "RATE_LIMIT_EXCEEDED",
  INTERNAL = "INTERNAL_SERVER_ERROR",
}

export class ApiError extends Error {
  type: ErrorType;
  statusCode: number;
  isOperational: boolean;

  constructor(type: ErrorType, message?: string, isOperational = true) {
    super(message || ERROR_MESSAGES[type]);
    this.type = type;
    this.statusCode = ERROR_STATUS_CODES[type];
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Usage in code:
throw new ApiError(ErrorType.VALIDATION, "Audit ID is required");
```

### 2. Central Error Handler

```typescript
export function handleApiError(
  error: any,
  res: NextApiResponse,
  customMessage?: string,
) {
  // Custom ApiError
  if (error instanceof ApiError) {
    secureLog.error(error.message, error);
    return res.status(error.statusCode).json({
      success: false,
      error: error.type,
      message: customMessage || error.message,
    });
  }

  // MongoDB ValidationError
  if (error.name === "ValidationError") {
    secureLog.error("Validation error", error);
    return res.status(400).json({
      success: false,
      error: ErrorType.VALIDATION,
      message: customMessage || "Invalid data",
    });
  }

  // MongoDB duplicate key
  if (error.code === 11000) {
    secureLog.error("Duplicate key error", error);
    return res.status(409).json({
      success: false,
      error: ErrorType.CONFLICT,
      message: customMessage || "Resource already exists",
    });
  }

  // Generic error - NEVER expose details in production
  secureLog.error("Unhandled error", error);
  return res.status(500).json({
    success: false,
    error: ErrorType.INTERNAL,
    message: "An error occurred",
  });
}
```

### 3. Secure Logging

```typescript
// lib/error-handler.ts

export const secureLog = {
  error: (message: string, error?: any) => {
    if (process.env.NODE_ENV === "development") {
      console.error(`[ERROR] ${message}`, error);
    } else {
      // Production: Log message only, no sensitive data
      console.error(`[ERROR] ${message}`);
      // TODO: Send to logging service (Sentry, LogRocket, etc.)
    }
  },

  warn: (message: string, data?: any) => {
    if (process.env.NODE_ENV === "development") {
      console.warn(`[WARN] ${message}`, data);
    }
  },

  info: (message: string, data?: any) => {
    if (process.env.NODE_ENV === "development") {
      console.log(`[INFO] ${message}`, data);
    }
  },
};
```

**⚠️ IMPROVEMENT for ShowYourBrand:**

```typescript
// Use structured logging library (pino, winston)
import pino from "pino";

const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  // In production, send to external service
  transport:
    process.env.NODE_ENV === "production"
      ? { target: "pino/file", options: { destination: "/var/log/app.log" } }
      : { target: "pino-pretty", options: { colorize: true } },
});

export const secureLog = {
  error: (message: string, meta?: object) => logger.error({ ...meta }, message),
  warn: (message: string, meta?: object) => logger.warn({ ...meta }, message),
  info: (message: string, meta?: object) => logger.info({ ...meta }, message),
};
```

---

## 🔌 Integration Patterns

### 1. Stripe (Payments)

```typescript
// lib/stripe.ts
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-11-20.acacia", // Use latest stable version
  typescript: true,
});

// Create checkout session
export async function createCheckout({
  user,
  priceId,
  successUrl,
  cancelUrl,
}: CreateCheckoutParams) {
  const session = await stripe.checkout.sessions.create({
    mode: "subscription", // or 'payment' for one-time
    customer: user.stripeCustomerId || undefined,
    customer_creation: user.stripeCustomerId ? undefined : "always",
    customer_email: user.email,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    allow_promotion_codes: true,
  });

  return session.url;
}

// Webhook handler
export async function handleStripeWebhook(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const sig = req.headers["stripe-signature"] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

  let event: Stripe.Event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle events
  switch (event.type) {
    case "checkout.session.completed":
      // Create subscription in DB
      break;
    case "customer.subscription.updated":
      // Update subscription status
      break;
    case "customer.subscription.deleted":
      // Cancel subscription
      break;
    case "invoice.payment_succeeded":
      // Renew subscription
      break;
    case "invoice.payment_failed":
      // Handle failed payment
      break;
  }

  res.json({ received: true });
}
```

**RULES:**

- ALWAYS verify webhook signatures
- Use `customer` if exists, `customer_creation: 'always'` if not
- Store `stripeCustomerId` in User model
- Handle ALL subscription lifecycle events
- Use Stripe test mode in development

### 2. Vercel Blob Storage

```typescript
// lib/blob-storage.ts
import { put, del, list } from "@vercel/blob";

export async function uploadPdfToBlob(
  pdfBuffer: Buffer,
  fileName: string,
  userId: string,
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      throw new Error("BLOB_READ_WRITE_TOKEN not configured");
    }

    const timestamp = Date.now();
    const pathname = `reports/${userId}/${fileName}_${timestamp}.pdf`;

    const blob = await put(pathname, pdfBuffer, {
      access: "public",
      contentType: "application/pdf",
      addRandomSuffix: false,
    });

    return { success: true, url: blob.url };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deletePdfFromBlob(blobUrl: string): Promise<boolean> {
  try {
    await del(blobUrl);
    return true;
  } catch (error) {
    console.error("Blob delete error:", error);
    return false;
  }
}
```

**RULES:**

- Organize by user: `reports/{userId}/filename.pdf`
- Always add timestamp to prevent collisions
- Public access with auth checks in API routes
- Delete old reports when user cancels subscription

### 3. Resend (Email)

```typescript
// lib/email.ts
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail({
  to,
  subject,
  html,
  from = process.env.RESEND_FROM_EMAIL,
}: {
  to: string;
  subject: string;
  html: string;
  from?: string;
}) {
  try {
    const { data, error } = await resend.emails.send({
      from: from!,
      to: [to],
      subject,
      html,
    });

    if (error) {
      throw new Error(error.message);
    }

    return { success: true, id: data?.id };
  } catch (error: any) {
    console.error("Email send error:", error);
    return { success: false, error: error.message };
  }
}

// Example: Audit completion email
export async function sendAuditCompleteEmail(
  userEmail: string,
  auditReport: AuditReport,
) {
  const html = `
    <!DOCTYPE html>
    <html>
      <body>
        <h1>Your SEO/GEO Audit is Ready!</h1>
        <p>Your audit for ${auditReport.businessName} is complete.</p>
        <p><a href="${auditReport.reportUrl}">View Report</a></p>
      </body>
    </html>
  `;

  return sendEmail({
    to: userEmail,
    subject: "Your ShowYourBrand Audit is Ready",
    html,
  });
}
```

**RULES:**

- Use React Email for complex templates (optional but recommended)
- Always handle errors gracefully (don't block operations on email failure)
- Rate limit email sending to avoid spam
- Verify sender domain in Resend dashboard

### 4. NextAuth Configuration

```typescript
// pages/api/auth/[...nextauth].ts
import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { connectDB } from "@/lib/mongoose";
import User from "@/models/User";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        await connectDB();

        const user = await User.findOne({ email: credentials?.email });
        if (!user) return null;

        const isValid = await user.comparePassword(credentials?.password!);
        if (!isValid) return null;

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
        };
      },
    }),
  ],

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
      }

      // Check subscription status on every token refresh
      if (token.id) {
        await connectDB();
        const dbUser = await User.findById(token.id);

        const hasActiveSubscription =
          dbUser.subscription?.status === "active" &&
          (!dbUser.subscription.endDate ||
            new Date(dbUser.subscription.endDate) > new Date());

        token.needsSubscription = !hasActiveSubscription;
      }

      return token;
    },

    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.needsSubscription = token.needsSubscription as boolean;
      }
      return session;
    },
  },

  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
};

export default NextAuth(authOptions);
```

**RULES:**

- ALWAYS check subscription status in JWT callback
- Store user ID in token (NOT entire user object)
- Use long session maxAge for better UX
- Custom sign-in page (don't use NextAuth default)

---

## 🧪 Testing Strategy (CRITICAL - Missing in Auto-Invoice)

**⚠️ Auto-Invoice Problem**: Almost no tests (only manual security tests)

**✅ ShowYourBrand Requirements**: Comprehensive test suite from day 1

### 1. Testing Framework

```json
// package.json
{
  "devDependencies": {
    "vitest": "^1.0.0",
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.1.0",
    "@testing-library/user-event": "^14.5.0"
  },
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage"
  }
}
```

### 2. Test Organization

```
/__tests__/
  /unit/
    /lib/
      crypto.test.ts
      error-handler.test.ts
      security-middleware.test.ts
    /models/
      User.test.ts
      Audit.test.ts
  /integration/
    /api/
      auth.test.ts
      audits.test.ts
      businesses.test.ts
  /e2e/
    audit-flow.test.ts
    subscription-flow.test.ts
```

### 3. Example Tests

```typescript
// __tests__/unit/lib/crypto.test.ts
import { describe, it, expect } from "vitest";
import { encryptString, decryptString, isEncrypted } from "@/lib/crypto";

describe("Crypto Utils", () => {
  it("should encrypt and decrypt strings correctly", () => {
    const plaintext = "sensitive data";
    const encrypted = encryptString(plaintext);

    expect(isEncrypted(encrypted)).toBe(true);
    expect(encrypted).toMatch(/^ENC::/);

    const decrypted = decryptString(encrypted);
    expect(decrypted).toBe(plaintext);
  });

  it("should throw on decryption failure with wrong key", () => {
    const encrypted = "ENC::invalid::data::here";
    expect(() => decryptString(encrypted)).toThrow("Failed to decrypt");
  });
});
```

```typescript
// __tests__/integration/api/audits.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import { createMocks } from "node-mocks-http";
import handler from "@/pages/api/audits/create";
import { getServerSession } from "next-auth/next";

vi.mock("next-auth/next");

describe("POST /api/audits/create", () => {
  beforeEach(() => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: "user123", email: "test@example.com" },
    });
  });

  it("should create audit with valid data", async () => {
    const { req, res } = createMocks({
      method: "POST",
      body: {
        businessId: "business123",
        auditType: "seo",
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(JSON.parse(res._getData())).toMatchObject({
      success: true,
      data: expect.objectContaining({
        businessId: "business123",
      }),
    });
  });

  it("should return 401 without authentication", async () => {
    vi.mocked(getServerSession).mockResolvedValue(null);

    const { req, res } = createMocks({ method: "POST" });
    await handler(req, res);

    expect(res._getStatusCode()).toBe(401);
  });
});
```

**RULES:**

- Write tests BEFORE implementing features (TDD encouraged)
- Aim for 80%+ coverage on critical paths
- Mock external services (Stripe, Resend, etc.)
- Test security middleware thoroughly
- E2E tests for critical user flows

---

## 📝 Configuration Management

### 1. Centralized Config

```typescript
// config.ts
const config = {
  // App identity
  appName: "ShowYourBrand",
  domainName: "ShowYourBrand.app", // Your domain

  // Stripe configuration
  stripe: {
    // One-shot products (single purchase)
    oneShots: {
      basic: {
        priceId: process.env.STRIPE_PRICE_ID_BASIC_ONESHOT!,
        name: "Basic Audit",
        price: 100,
        type: "one_time",
        features: [
          "1 GEO audit",
          "ChatGPT analysis only",
          "1 competitor comparison",
          "Dashboard (resets each purchase)",
          "PDF report with code snippets",
        ],
      },
      pro: {
        priceId: process.env.STRIPE_PRICE_ID_PRO_ONESHOT!,
        name: "Pro Audit",
        price: 200,
        type: "one_time",
        features: [
          "1 GEO audit",
          "All 4 AI engines (ChatGPT, Claude, Perplexity, DeepSeek)",
          "5 competitor comparisons",
          "Persistent dashboard with history",
          "PDF report with code snippets",
          "Audit comparison over time",
        ],
      },
    },
    // Subscription plan
    subscriptions: {
      premium: {
        priceId: process.env.STRIPE_PRICE_ID_PREMIUM!,
        name: "Premium",
        price: 500,
        type: "recurring",
        interval: "month",
        features: [
          "20 audits/month included",
          "All 4 AI engines",
          "Unlimited competitor comparisons",
          "Persistent dashboard with full history",
          "PDF reports with white-label branding",
          "Audit comparison & evolution tracking",
        ],
      },
    },
    // Extra audit pricing for Premium subscribers
    extraAudit: {
      priceId: process.env.STRIPE_PRICE_ID_EXTRA_AUDIT!,
      name: "Extra Audit",
      price: 20,
      type: "one_time",
    },
  },

  // Email configuration
  email: {
    from: process.env.RESEND_FROM_EMAIL!,
    supportEmail: "support@ShowYourBrand.app",
  },

  // Feature flags
  features: {
    whiteLabel: true,
    aiRecommendations: true,
    apiAccess: true,
  },

  // UI theme
  theme: {
    primaryColor: "#3B82F6",
    secondaryColor: "#10B981",
  },

  // Redirects
  callbackUrl: "/dashboard",
};

export default config;
```

### 2. Environment Variables

```bash
# .env.local (development)
# ===== Database =====
MONGODB_URI=mongodb+srv://...
MONGODB_ENCRYPTION_KEY=<32-byte base64 key>

# ===== NextAuth =====
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<generated secret>

# ===== Google OAuth =====
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# ===== Stripe =====
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLIC_KEY=pk_test_...
STRIPE_PRICE_ID_BASIC=price_...
STRIPE_PRICE_ID_PRO=price_...
STRIPE_WEBHOOK_SECRET=whsec_...

# ===== Vercel Blob =====
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...

# ===== Resend =====
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=noreply@ShowYourBrand.app

# ===== Scraping Service =====
SCRAPING_SERVICE_URL=http://localhost:8080
SCRAPING_SERVICE_API_KEY=<secure key>

# ===== AI APIs =====
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# ===== Other =====
NODE_ENV=development
LOG_LEVEL=debug
```

**RULES:**

- NEVER commit `.env.local` (add to `.gitignore`)
- Use Vercel dashboard for production env vars
- Prefix with service name for clarity
- Validate required vars on app start

### 3. Environment Validation

```typescript
// lib/env.ts
import { z } from "zod";

const envSchema = z.object({
  MONGODB_URI: z.string().url(),
  MONGODB_ENCRYPTION_KEY: z.string().length(44), // base64 of 32 bytes
  NEXTAUTH_SECRET: z.string().min(32),
  STRIPE_SECRET_KEY: z.string().startsWith("sk_"),
  RESEND_API_KEY: z.string().startsWith("re_"),
  BLOB_READ_WRITE_TOKEN: z.string(),
});

export function validateEnv() {
  try {
    envSchema.parse(process.env);
  } catch (error) {
    console.error("❌ Invalid environment variables:", error);
    throw new Error("Environment validation failed");
  }
}

// Call in _app.tsx or server startup
validateEnv();
```

---

## 🚀 Performance & Optimization

### 1. Database Queries

```typescript
// ❌ BAD: N+1 query problem
const audits = await Audit.find({ userId });
for (const audit of audits) {
  const business = await Business.findById(audit.businessId);
  // ... use business
}

// ✅ GOOD: Use populate or aggregation
const audits = await Audit.find({ userId }).populate("businessId");

// ✅ BETTER: Select only needed fields
const audits = await Audit.find({ userId })
  .populate("businessId", "name website")
  .select("auditResults createdAt")
  .lean(); // Returns plain JS objects (faster)
```

### 2. API Route Optimization

```typescript
// Cache expensive operations
import { unstable_cache } from "next/cache";

const getCachedAuditStats = unstable_cache(
  async (userId: string) => {
    return Audit.aggregate([
      { $match: { userId: new ObjectId(userId) } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          avgScore: { $avg: "$seoScore" },
        },
      },
    ]);
  },
  ["audit-stats"],
  { revalidate: 3600 }, // Cache for 1 hour
);
```

### 3. Image Optimization

```typescript
// Use Next.js Image component ALWAYS
import Image from 'next/image';

<Image
  src="/logo.png"
  alt="ShowYourBrand Logo"
  width={200}
  height={50}
  priority // For above-the-fold images
/>

// Whitelist external image domains in next.config.js
images: {
  domains: ['vercel-blob.com', 'lh3.googleusercontent.com'],
}
```

---

## ⚠️ Critical Improvements Over Auto-Invoice

### 1. TypeScript Strict Mode

**Auto-Invoice**: `strict: false`
**ShowYourBrand**: `strict: true`

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true, // Enable ALL strict checks
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true
  }
}
```

### 2. Single UI Framework

**Auto-Invoice**: Chakra UI + Tailwind + DaisyUI (3 frameworks!)
**ShowYourBrand**: Choose ONE

**Recommended**: Tailwind CSS + shadcn/ui

- Modern, composable components
- Full control over styling
- TypeScript-first
- No runtime overhead

```bash
npx shadcn-ui@latest init
npx shadcn-ui@latest add button card dialog
```

### 3. Structured Logging

**Auto-Invoice**: `console.log` / `console.error`
**ShowYourBrand**: Structured logging with Pino or Winston

```typescript
import pino from "pino";

export const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  transport: {
    target: "pino-pretty",
    options: { colorize: true },
  },
});

// Usage
logger.info({ userId, auditId }, "Audit created successfully");
logger.error({ error, userId }, "Failed to create audit");
```

### 4. Rate Limiting with Redis

**Auto-Invoice**: In-memory Map (not production-ready)
**ShowYourBrand**: Upstash Redis (serverless-friendly)

```typescript
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "10 s"),
  analytics: true,
});
```

### 5. Comprehensive Testing

**Auto-Invoice**: ~0% test coverage
**ShowYourBrand**: 80%+ coverage target

- Unit tests: All utilities and helpers
- Integration tests: API routes
- E2E tests: Critical user flows
- Run in CI/CD before deployment

### 6. Error Monitoring

**Auto-Invoice**: No error tracking
**ShowYourBrand**: Sentry integration

```typescript
// lib/sentry.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});

// Automatic error capture in API routes
export const withSentry = (handler) => {
  return async (req, res) => {
    try {
      return await handler(req, res);
    } catch (error) {
      Sentry.captureException(error);
      throw error;
    }
  };
};
```

### 7. Encryption Fail-Closed

**Auto-Invoice**: Returns original value on decrypt error (fail-open)
**ShowYourBrand**: Throw error on decrypt failure (fail-closed)

```typescript
export function decryptString(serialized: string): string {
  if (!serialized.startsWith("ENC::")) return serialized;

  try {
    // ... decryption logic
    return plaintext.toString("utf8");
  } catch (error) {
    // 🚨 CRITICAL: Fail-closed for security
    throw new Error("Failed to decrypt sensitive data - possible key mismatch");
  }
}
```

### 8. Unified Utils Folder

**Auto-Invoice**: Both `/libs/` and `/lib/` folders
**ShowYourBrand**: Only `/lib/` (modern, singular)

```
/lib/
  api-client.ts
  blob-storage.ts
  crypto.ts
  email.ts
  error-handler.ts
  mongoose.ts
  security-middleware.ts
  stripe.ts
```

### 9. Subscription Model Simplification

**Auto-Invoice**: Dual system (legacy + new)
**ShowYourBrand**: Single modern system from day 1

```typescript
// models/User.ts
const UserSchema = new Schema({
  // ... other fields

  // Stripe subscription (embedded for simplicity)
  subscription: {
    stripeSubscriptionId: String,
    stripePriceId: String,
    status: {
      type: String,
      enum: ["active", "canceled", "past_due", "trialing", "inactive"],
      default: "inactive",
    },
    currentPeriodEnd: Date,
  },
});
```

### 10. Modern Next.js Version

**Auto-Invoice**: Next.js 13.5.11
**ShowYourBrand**: Next.js 15.x

- Better performance
- Improved dev experience
- Security patches
- Latest features

```json
// package.json
{
  "dependencies": {
    "next": "^15.0.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0"
  }
}
```

---

## 🎯 Final Checklist for AI Agents

When implementing ANY code for ShowYourBrand, verify:

### Security

- [ ] All API routes use `sanitizeInput(req.body)`
- [ ] Authentication checked with `getServerSession` + `requireAuth`
- [ ] Resource ownership verified for user data
- [ ] Sensitive data encrypted with field encryption plugin
- [ ] Errors handled with `handleApiError` (no sensitive info exposed)
- [ ] Rate limiting applied to public endpoints

### Data Patterns

- [ ] Snapshots used for historical data (audits, reports)
- [ ] Indexes added for query fields
- [ ] Timestamps enabled (`timestamps: true`)
- [ ] Soft deletes if data shouldn't be hard deleted
- [ ] Password hashing with bcrypt pre-save hook

### Code Quality

- [ ] TypeScript strict mode (no `any` types)
- [ ] Imports use `@/` path alias
- [ ] Naming conventions followed (PascalCase components, kebab-case utils)
- [ ] Error handling with try-catch blocks
- [ ] Logging with `secureLog` or structured logger

### Testing

- [ ] Unit tests written for utilities
- [ ] Integration tests for API routes
- [ ] Mocked external services (Stripe, Resend, etc.)
- [ ] Tests pass before committing

### Performance

- [ ] Database queries optimized (no N+1)
- [ ] Images use Next.js `Image` component
- [ ] Expensive operations cached
- [ ] API responses include only necessary data

### Configuration

- [ ] Environment variables validated on startup
- [ ] Secrets never committed to git
- [ ] Config centralized in `config.ts`
- [ ] Feature flags used for gradual rollouts

---

## 📚 Additional Resources

- **Next.js Docs**: https://nextjs.org/docs
- **Mongoose Docs**: https://mongoosejs.com/docs/
- **NextAuth Docs**: https://next-auth.js.org/
- **Stripe Docs**: https://stripe.com/docs
- **Resend Docs**: https://resend.com/docs
- **Vercel Blob Docs**: https://vercel.com/docs/storage/vercel-blob

---

## 🚨 CRITICAL REMINDERS

1. **NEVER** expose sensitive data in API responses or logs (production)
2. **ALWAYS** sanitize user input before database queries
3. **NEVER** trust client-side data - validate on server
4. **ALWAYS** verify authentication before accessing user data
5. **NEVER** commit secrets or API keys to git
6. **ALWAYS** use snapshots for historical data (audits, invoices)
7. **NEVER** skip error handling in API routes
8. **ALWAYS** write tests for critical functionality
9. **NEVER** use plain text passwords - always bcrypt
10. **ALWAYS** fail-closed on security decisions (encryption, auth)

---

_Last Updated: 2026-01-13_
_Based on: Auto-Invoice analysis + Security best practices_
_Target: ShowYourBrand SEO/GEO audit platform_

---

## 🎯 Architectural Implementation Patterns (2026-01-21)

_These patterns are from the Architecture Decision Document and MUST be followed by all AI agents._

### 1. Naming Conventions (MANDATORY)

**Database (Mongoose Models):**

- Collections: `PascalCase` singular (`User`, `Audit`, `Business`)
- Fields: `camelCase` (`userId`, `geoScore`, `createdAt`)
- **NEVER use snake_case** in JavaScript/TypeScript

**API Routes:**

- Endpoints: Plural lowercase (`/api/audits`, `/api/businesses`)
- Parameters: `:id` format (`/api/audits/:id`)
- Query params: `camelCase` (`?auditId=123&businessId=456`)
- Headers: `X-Custom-Name` format

**Code Naming:**

- Components: `PascalCase.tsx` (`AuditCard.tsx`, `GeoScoreRing.tsx`)
- UI Primitives: `kebab-case.tsx` (`button.tsx`, `card.tsx`)
- Functions: `camelCase` verbs (`getUserById`, `createAudit`, `fetchAuditResults`)
- Variables: `camelCase` (`auditId`, `businessName`, `competitorUrls`)
- Booleans: `is/has/should` prefix (`isLoading`, `hasError`, `shouldRetry`)
- Hooks: `useCamelCase` (`useAuditPolling`, `useAuth`, `useLanguage`)
- Handlers: `handleCamelCase` (`handleSubmit`, `handleDelete`, `handleRetry`)
- Constants: `SCREAMING_SNAKE_CASE` (`MAX_RETRIES`, `API_TIMEOUT`, `POLL_INTERVAL`)
- Utilities: `kebab-case.ts` (`error-handler.ts`, `blob-storage.ts`, `security-middleware.ts`)

### 2. Dual Validation Pattern (Zod + Mongoose)

**CRITICAL**: Validate data TWICE for defense in depth

```typescript
// Step 1: Zod validation at API boundary (early validation)
import { z } from "zod";

const CreateAuditSchema = z.object({
  businessId: z.string().min(1),
  competitorUrls: z.array(z.string().url()).max(5),
  language: z.enum(["en", "fr"]),
});

// API route pattern
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    req.body = sanitizeInput(req.body);
    const session = await getServerSession(req, res, authOptions);
    requireAuth(session);

    // Zod validation (catches errors before business logic)
    const body = CreateAuditSchema.parse(req.body);

    // Step 2: Mongoose validates again at database layer
    const audit = await Audit.create({
      userId: session.user.id,
      businessId: body.businessId,
      competitorUrls: body.competitorUrls,
      language: body.language,
      status: "pending",
    });

    return res.status(200).json({ success: true, data: audit });
  } catch (error) {
    return handleApiError(error, res);
  }
}
```

**Why Dual Validation**:

- Zod: Early validation, TypeScript type inference, better error messages
- Mongoose: Final safety net, database constraints, schema validation
- Defense in depth: External AI API data needs extra validation

### Concrete Implementation Examples (Story 1.3)

**Import Pattern:**

```typescript
import { LoginSchema, type LoginInput, handleZodError } from "@/lib/validation";
```

**API Route Pattern (safeParse):**

```typescript
import { LoginSchema, handleZodError } from "@/lib/validation";
import { handleApiError } from "@/lib/error-handler";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    // 1. Sanitize input
    req.body = sanitizeInput(req.body);

    // 2. Zod validation with safeParse (doesn't throw)
    const result = LoginSchema.safeParse(req.body);
    if (!result.success) {
      return handleZodError(result.error, res);
    }

    // 3. Use validated data (fully typed)
    const { email, password } = result.data;

    // 4. Mongoose handles DB-level validation
    const user = await User.findOne({ email });
    // ... rest of logic
  } catch (error) {
    return handleApiError(error, res);
  }
}
```

### 3. API Response Format (STANDARDIZED)

**MANDATORY format for ALL API responses:**

```typescript
// ✅ Success response
{
  success: true,
  data: {
    auditId: "123",
    status: "pending",
    estimatedCompletion: "2026-01-21T15:30:00Z"
  }
}

// ❌ Error response
{
  success: false,
  error: "VALIDATION_ERROR", // ERROR_TYPE constant
  message: "Business ID is required",
  details?: {
    field: "businessId",
    reason: "missing"
  }
}
```

**Error Types (from ApiError class)**:

- `AUTHENTICATION_ERROR` - Not logged in
- `AUTHORIZATION_ERROR` - No permission
- `VALIDATION_ERROR` - Invalid input
- `NOT_FOUND` - Resource doesn't exist
- `CONFLICT` - Duplicate or conflicting resource
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `INTERNAL_SERVER_ERROR` - Unexpected error

**NEVER return raw data** - always wrap in success/error envelope

### 4. Zustand Store Patterns

**Store Naming**: `use[Domain]Store` (`useAuditStore`, `useUserStore`, `useDashboardStore`)

**Action Naming**: Verb-first pattern (`set`, `update`, `clear`, `toggle`)

```typescript
// ✅ CORRECT
interface AuditStore {
  currentAudit: Audit | null;
  auditProgress: { current: number; total: number } | null;
  isPolling: boolean;

  setCurrentAudit: (audit: Audit) => void;
  updateProgress: (current: number, total: number) => void;
  setPolling: (isPolling: boolean) => void;
  clearAudit: () => void;
}

// ❌ WRONG - verb not first
interface AuditStore {
  addAudit: (audit: Audit) => void; // Use 'setCurrentAudit' or 'updateAudit'
  auditSet: (audit: Audit) => void; // Verb should be first: 'setAudit'
}
```

**Store Usage in Components**:

```typescript
// ✅ CORRECT - selector for specific state
const currentAudit = useAuditStore((state) => state.currentAudit);
const setCurrentAudit = useAuditStore((state) => state.setCurrentAudit);

// ❌ WRONG - subscribes to entire store (re-renders on any change)
const { currentAudit, setCurrentAudit } = useAuditStore();
```

### 5. Real-Time Updates (Polling Pattern)

**CRITICAL**: NEVER use WebSockets (Vercel serverless limitations)

**ALWAYS use polling** for audit status updates (10-second interval)

```typescript
// hooks/useAuditPolling.ts
export function useAuditPolling(auditId: string | null) {
  const { currentAudit, setCurrentAudit, isPolling, setPolling } =
    useAuditStore();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Stop polling if no auditId or audit not processing
    if (!auditId || currentAudit?.status !== "processing") {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        setPolling(false);
      }
      return;
    }

    setPolling(true);
    intervalRef.current = setInterval(async () => {
      try {
        const response = await fetch(`/api/audits/${auditId}`);
        const { data } = await response.json();
        setCurrentAudit(data);

        // Stop polling when complete
        if (data.status !== "processing") {
          clearInterval(intervalRef.current!);
          setPolling(false);
        }
      } catch (error) {
        console.error("Polling error:", error);
      }
    }, 10000); // 10 seconds (NOT less - optimized for 5-10 minute audits)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        setPolling(false);
      }
    };
  }, [auditId, currentAudit?.status]);
}
```

**Polling Rules**:

- Interval: 10 seconds (NOT less)
- Stop when: Status changes from 'processing' OR auditId becomes null
- Error handling: Log error, continue polling
- Cleanup: Always clear interval on unmount

### 6. Docker Service Communication Pattern

**Pattern**: REST API + Bearer token authentication

**Next.js → Docker Service (Audit Initiation)**:

```typescript
// pages/api/audits/create.ts
const response = await fetch(`${process.env.SCRAPING_SERVICE_URL}/audit`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${process.env.PROCESSING_SERVICE_API_KEY}`,
  },
  body: JSON.stringify({
    auditId: audit._id.toString(),
    businessUrl: business.website,
    prompts: auditPrompts,
    competitorUrls: audit.competitorUrls,
    language: audit.language,
    callbackUrl: `${process.env.NEXTAUTH_URL}/api/webhook/audit-complete`,
  }),
});

if (!response.ok) {
  throw new Error("Failed to initiate audit processing");
}
```

**Docker Service → Next.js (Audit Completion Callback)**:

```typescript
// pages/api/webhook/audit-complete.ts
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    // Validate Bearer token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing authorization" });
    }

    const token = authHeader.split(" ")[1];
    if (token !== process.env.PROCESSING_SERVICE_API_KEY) {
      return res.status(403).json({ error: "Invalid token" });
    }

    const { auditId, status, results } = req.body;

    // Update audit in database
    await Audit.findByIdAndUpdate(auditId, {
      status,
      results,
      completedAt: new Date(),
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    return handleApiError(error, res);
  }
}
```

**Security Rules**:

- Same API key for both directions (`PROCESSING_SERVICE_API_KEY`)
- Validate Bearer token on EVERY request
- NEVER expose service URL or API key client-side

**MVP Deployment**:

- Docker service runs locally (`docker-compose up -d`)
- Service URL: `http://localhost:8080` (development)
- AWS deployment deferred to Month 6+ (when user load increases)

### 7. File Organization Pattern (By Domain, NOT Type)

**CRITICAL**: Organize components by domain/feature, NOT by UI type

```
✅ CORRECT - By domain:
/components/
  /ui/                      # Shadcn primitives only
    button.tsx
    card.tsx
    dialog.tsx
  /audit/                   # Audit domain components
    AuditCard.tsx
    AuditList.tsx
    GeoScoreRing.tsx
    CompetitiveGapChart.tsx
    IssueCard.tsx
  /dashboard/               # Dashboard domain
    DashboardLayout.tsx
    Sidebar.tsx
    Header.tsx
  /admin/                   # Admin domain
    AdminLayout.tsx
    AuditTable.tsx
    UserTable.tsx

❌ WRONG - By type:
/components/
  /cards/                   # Don't organize by UI type
    AuditCard.tsx
    DashboardCard.tsx
    BusinessCard.tsx
  /lists/
    AuditList.tsx
    BusinessList.tsx
  /charts/
    GeoScoreRing.tsx
    CompetitiveGapChart.tsx
```

**Why**: Domain organization keeps related code together, makes features easier to find and maintain

### 8. GitLab CI/CD Pipeline Pattern

**Pipeline File**: `.gitlab-ci.yml` (project root)

```yaml
image: node:20

stages:
  - test

cache:
  paths:
    - node_modules/

before_script:
  - npm ci

lint:
  stage: test
  script:
    - npm run lint

type-check:
  stage: test
  script:
    - npm run type-check

test:
  stage: test
  script:
    - npm run test
  variables:
    NODE_ENV: test

coverage:
  stage: test
  script:
    - npm run test:coverage
  coverage: '/All files[^|]*\|[^|]*\s+([\d\.]+)/'
  variables:
    COVERAGE_THRESHOLD: 80
```

**Deployment Flow**:

1. Developer pushes to GitLab
2. GitLab CI/CD runs: lint → type-check → test → coverage
3. All tests must pass before merge allowed
4. Merge to `main` → Vercel deploys automatically
5. Merge requests get preview deployments (unique URL per MR)

**NEVER use GitHub Actions** - this project uses GitLab CI/CD

### 9. Date Handling Pattern

**CRITICAL**: Consistent date formats across the stack

```typescript
// ✅ CORRECT - ISO 8601 strings in JSON
{
  createdAt: "2026-01-21T15:30:00.000Z",  // ISO string
  dueDate: "2026-02-01T00:00:00.000Z"
}

// ✅ CORRECT - Date objects in MongoDB (Mongoose handles conversion)
const AuditSchema = new Schema({
  createdAt: { type: Date, default: Date.now },
  completedAt: { type: Date },
});

// ❌ WRONG - Timestamp numbers in JSON
{
  createdAt: 1706708400000  // Hard to read, avoid this
}

// ❌ WRONG - Non-ISO strings
{
  createdAt: "2026-01-21"  // Missing time, not ISO format
}
```

### 10. Loading State Pattern

**CRITICAL**: Consistent boolean pattern for loading states

```typescript
// ✅ CORRECT - Boolean with 'is' prefix
const [isLoading, setIsLoading] = useState(false);
const [isSubmitting, setIsSubmitting] = useState(false);
const [isPolling, setIsPolling] = useState(false);

// ❌ WRONG - No prefix
const [loading, setLoading] = useState(false); // Use 'isLoading'
const [submit, setSubmit] = useState(false); // Use 'isSubmitting'

// ❌ WRONG - String-based loading state
const [loadingState, setLoadingState] = useState<
  "idle" | "loading" | "success"
>("idle");
// Use boolean isLoading + separate isSuccess if needed
```

**Usage in components**:

```typescript
if (isLoading) return <LoadingSpinner />;
if (hasError) return <ErrorMessage error={error} />;
return <AuditResults data={data} />;
```

---

## 🚨 Critical Anti-Patterns (NEVER DO THIS)

Based on architecture decisions and Auto-Invoice issues:

### 1. NEVER Mix UI Frameworks

❌ **Auto-Invoice had 3 UI frameworks** (Chakra + Tailwind + DaisyUI)
✅ **ShowYourBrand uses ONE**: Tailwind CSS + Shadcn/ui

### 2. NEVER Use snake_case in TypeScript/JavaScript

❌ `user_id`, `audit_status`, `geo_score`
✅ `userId`, `auditStatus`, `geoScore`

### 3. NEVER Skip Dual Validation

❌ Only Zod validation OR only Mongoose validation
✅ Zod at API boundary, Mongoose at database layer

### 4. NEVER Return Raw Data from API Routes

❌ `return res.json({ auditId: '123' })`
✅ `return res.json({ success: true, data: { auditId: '123' } })`

### 5. NEVER Use WebSockets on Vercel

❌ WebSocket connections (Vercel serverless doesn't support)
✅ 10-second polling with `useAuditPolling` hook

### 6. NEVER Organize by UI Type

❌ `/components/cards/`, `/components/lists/`, `/components/modals/`
✅ `/components/audit/`, `/components/dashboard/`, `/components/admin/`

### 7. NEVER Use In-Memory Rate Limiting

❌ `const rateLimitMap = new Map()` (lost on restart, doesn't scale)
✅ Upstash Redis with `@upstash/ratelimit`

### 8. NEVER Use GitHub Actions

❌ `.github/workflows/test.yml`
✅ `.gitlab-ci.yml` (GitLab CI/CD)

### 9. NEVER Fail-Open on Encryption

❌ `return serialized` when decryption fails (Auto-Invoice anti-pattern)
✅ `throw new Error('Failed to decrypt')` (fail-closed)

### 10. NEVER Skip Input Sanitization

❌ `const body = req.body` directly used in queries
✅ `req.body = sanitizeInput(req.body)` before any processing

---

## 📚 Usage Guidelines

### For AI Agents

**Before implementing ANY code:**

1. ✅ Read this entire document to understand project patterns
2. ✅ Follow ALL naming conventions exactly as specified
3. ✅ Use dual validation (Zod + Mongoose) on every API route
4. ✅ Apply standardized API response format (`{ success, data/error }`)
5. ✅ Organize files by domain (NOT by type)
6. ✅ Use Zustand stores with verb-first actions
7. ✅ Implement polling (NOT WebSockets) for real-time updates
8. ✅ Validate Bearer tokens for Docker service communication
9. ✅ Use GitLab CI/CD (NOT GitHub Actions)
10. ✅ Fail-closed on encryption/security decisions

**When in doubt:**

- Prefer the more restrictive option
- Ask user for clarification rather than guessing
- Reference the Architecture Document for decision rationale
- Update this file if new patterns emerge

**Critical reminders:**

- NEVER use snake_case in TypeScript/JavaScript
- NEVER mix multiple UI frameworks
- NEVER skip input sanitization
- NEVER return raw API data (always wrap in success envelope)
- NEVER use WebSockets on Vercel
- NEVER organize components by type

### For Human Developers

**Maintaining this file:**

- ✅ Keep lean and focused on AI agent needs (remove obvious rules)
- ✅ Update when technology stack changes
- ✅ Update when new patterns emerge from architecture decisions
- ✅ Review quarterly for outdated rules
- ✅ Remove rules that become obvious over time

**When to update:**

- Technology version upgrades
- New architectural decisions made
- New implementation patterns discovered
- Anti-patterns identified from code reviews
- Framework or library changes

**File organization:**

- Technology Stack: Exact versions and compatibility notes
- Architecture: High-level structure and boundaries
- Security Patterns: Authentication, encryption, input sanitization
- Data Patterns: Mongoose, snapshots, encryption
- Implementation Patterns: Naming, validation, API format, state management
- Anti-Patterns: Common mistakes to avoid

**Related documents:**

- Architecture Document: `/Users/maxlemoinegavoille/Desktop/Projets/ShowYourBrand/_bmad-output/planning-artifacts/architecture.md`
- PRD: `/Users/maxlemoinegavoille/Desktop/Projets/ShowYourBrand/_bmad-output/planning-artifacts/prd.md`
- UX Design: `/Users/maxlemoinegavoille/Desktop/Projets/ShowYourBrand/_bmad-output/planning-artifacts/ux-design-specification.md`

---

**Last Updated:** 2026-01-21  
**Status:** Complete and optimized for LLM consumption  
**Source:** Auto-Invoice analysis + Architecture Document (2026-01-21)  
**Target:** ShowYourBrand GEO audit platform
