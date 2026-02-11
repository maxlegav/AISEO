---
title: 'User Authentication, Stripe Payments & Email Notifications'
slug: 'epic-2-3-auth-stripe'
created: '2026-02-03'
status: 'ready-for-dev'
epics: [2, 3, 10]
frs_covered: [FR1, FR2, FR3, FR4, FR5, FR6, FR7, FR54, FR55, FR56, FR57, FR58, FR59, FR60, FR61, FR62, FR63, FR65, FR66]
tech_stack:
  - next@16.1.4
  - react@19.x
  - typescript@5.8.3 (strict mode)
  - nextauth@4.24.11
  - stripe@13.2.0
  - mongoose@7.4.4
  - resend@2.x
  - zod@3.22.2
files_to_create:
  - WebSite/models/Subscription.ts
  - WebSite/pages/api/checkout.ts
  - WebSite/pages/api/webhook/stripe.ts
  - WebSite/pages/api/subscription/portal.ts
  - WebSite/pages/api/auth/forgot-password.ts
  - WebSite/pages/api/auth/reset-password.ts
  - WebSite/pages/api/auth/delete-account.ts
  - WebSite/pages/subscription-plans.tsx
  - WebSite/pages/checkout/success.tsx
  - WebSite/pages/checkout/cancel.tsx
  - WebSite/pages/forgot-password.tsx
  - WebSite/pages/reset-password.tsx
  - WebSite/lib/email.ts
  - WebSite/emails/WelcomeEmail.tsx
  - WebSite/emails/PasswordResetEmail.tsx
  - WebSite/emails/SubscriptionConfirmationEmail.tsx
  - WebSite/lib/validation/subscription.ts
files_to_modify:
  - WebSite/models/User.ts
  - WebSite/pages/api/auth/[...nextauth].ts
  - WebSite/pages/api/auth/signup.ts
  - WebSite/pages/dashboard.tsx
  - WebSite/pages/login.tsx
  - WebSite/lib/validation/index.ts
  - WebSite/.env.example
---

# Tech-Spec: User Authentication, Stripe Payments & Email Notifications

**Created:** 2026-02-03
**Epics:** 2 (Auth), 3 (Stripe), 10 (Emails partial)
**Status:** Ready for Development

## Overview

### Problem Statement

AISEO needs a complete authentication system with subscription-based access to the dashboard. Users must be able to:
- Register and login (already working)
- Reset forgotten passwords (missing)
- Delete their accounts (missing)
- Purchase one-time audits or subscribe to plans (missing)
- Access dashboard only with active subscription (missing)

### Solution

Implement the full auth + payment flow:
1. Update User model with subscription fields
2. Create Subscription model for payment history
3. Implement Stripe Checkout + Webhooks
4. Add password reset flow with email tokens
5. Add account deletion with GDPR compliance
6. Gate dashboard access behind subscription check

### Business Logic

**Pricing Model:**
- **Basic One-Shot (€100)**: 1 audit, ChatGPT only, 1 competitor, dashboard resets
- **Pro One-Shot (€200)**: 1 audit, all 4 AI engines, 5 competitors, persistent dashboard with history
- **Premium Subscription (€500/month)**: 20 audits included, all AI engines, unlimited competitors, white-label PDFs, +€20/extra audit

**Access Rules:**
- Dashboard requires at least one purchased audit OR active Premium subscription
- Basic purchases: new dashboard each time, no history
- Pro purchases: persistent dashboard with historical tracking
- Premium subscription: full access, 20 audits/month, extras at €20 each

---

## Implementation Details

### 1. Database Models

#### 1.1 Update User Model

**File:** `WebSite/models/User.ts`

Add these fields to the existing schema:

```typescript
// Add to existing UserSchema
{
  // Stripe Integration
  stripeCustomerId: { type: String, sparse: true },

  // Subscription Status
  subscriptionTier: {
    type: String,
    enum: ['none', 'basic', 'pro', 'premium'],
    default: 'none'
  },
  subscriptionStatus: {
    type: String,
    enum: ['active', 'cancelled', 'past_due', 'trialing', 'inactive'],
    default: 'inactive'
  },
  subscriptionId: { type: String }, // Stripe subscription ID
  subscriptionEndDate: { type: Date },

  // One-shot Credits
  auditCredits: { type: Number, default: 0 },

  // Language Preference (FR5)
  language: {
    type: String,
    enum: ['en', 'fr'],
    default: 'en'
  },

  // Password Reset
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },

  // Account Deletion (soft delete for GDPR)
  deletedAt: { type: Date, default: null },
  deletionRequestedAt: { type: Date }
}
```

Add index for stripeCustomerId:
```typescript
UserSchema.index({ stripeCustomerId: 1 }, { sparse: true });
UserSchema.index({ email: 1 }, { unique: true });
```

Add virtual for hasActiveSubscription:
```typescript
UserSchema.virtual('hasActiveSubscription').get(function() {
  if (this.auditCredits > 0) return true;
  if (this.subscriptionStatus !== 'active') return false;
  if (this.subscriptionEndDate && new Date() > this.subscriptionEndDate) return false;
  return true;
});
```

#### 1.2 Create Subscription Model

**File:** `WebSite/models/Subscription.ts`

```typescript
import mongoose, { Schema, Document } from 'mongoose';

export interface ISubscription extends Document {
  userId: mongoose.Types.ObjectId;
  stripeSubscriptionId: string;
  stripeCustomerId: string;
  stripePriceId: string;
  tier: 'basic' | 'pro' | 'premium' | 'one_shot';
  status: 'active' | 'cancelled' | 'past_due' | 'trialing' | 'incomplete' | 'incomplete_expired';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  cancelledAt?: Date;
  amount: number;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
}

const SubscriptionSchema = new Schema<ISubscription>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  stripeSubscriptionId: {
    type: String,
    required: true,
    unique: true
  },
  stripeCustomerId: { type: String, required: true },
  stripePriceId: { type: String, required: true },
  tier: {
    type: String,
    enum: ['basic', 'pro', 'premium', 'one_shot'],
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'cancelled', 'past_due', 'trialing', 'incomplete', 'incomplete_expired'],
    required: true
  },
  currentPeriodStart: { type: Date, required: true },
  currentPeriodEnd: { type: Date, required: true },
  cancelAtPeriodEnd: { type: Boolean, default: false },
  cancelledAt: { type: Date },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'eur' },
}, {
  timestamps: true
});

// Compound index for user's active subscription
SubscriptionSchema.index({ userId: 1, status: 1 });

export default mongoose.models.Subscription || mongoose.model<ISubscription>('Subscription', SubscriptionSchema);
```

---

### 2. Stripe Integration

#### 2.1 Checkout Endpoint

**File:** `WebSite/pages/api/checkout.ts`

```typescript
// POST /api/checkout
// Body: { priceId: string, mode: 'subscription' | 'payment' }
// Returns: { success: true, data: { sessionId: string, url: string } }

// Flow:
// 1. Validate session (user must be logged in)
// 2. Get or create Stripe customer
// 3. Create Checkout Session
// 4. Return session URL for redirect

// Important:
// - For one-shot (mode: 'payment'), use payment_intent_data
// - For subscriptions (mode: 'subscription'), use subscription_data
// - Always include metadata: { userId, tier }
// - success_url: /checkout/success?session_id={CHECKOUT_SESSION_ID}
// - cancel_url: /checkout/cancel
```

#### 2.2 Webhook Handler

**File:** `WebSite/pages/api/webhook/stripe.ts`

```typescript
// POST /api/webhook/stripe
// Must handle raw body for signature verification
// Configure in next.config.js: api: { bodyParser: false }

// Events to handle:
// 1. checkout.session.completed
//    - For subscriptions: Create Subscription, update User
//    - For one-shot: Add auditCredits to User
// 2. customer.subscription.updated
//    - Update Subscription status, tier, dates
//    - Update User subscriptionStatus
// 3. customer.subscription.deleted
//    - Mark Subscription as cancelled
//    - Update User subscriptionStatus to 'inactive'
// 4. invoice.payment_succeeded
//    - Log payment, send receipt email
// 5. invoice.payment_failed
//    - Update User subscriptionStatus to 'past_due'
//    - Send payment failed email

// CRITICAL: Use idempotency - check if event already processed
// Store event IDs in Subscription or separate ProcessedEvents collection
```

#### 2.3 Customer Portal

**File:** `WebSite/pages/api/subscription/portal.ts`

```typescript
// POST /api/subscription/portal
// Returns: { success: true, data: { url: string } }

// Creates Stripe Customer Portal session
// Allows users to:
// - Update payment method
// - Cancel subscription
// - View invoices
```

---

### 3. Auth Completion

#### 3.1 Forgot Password

**File:** `WebSite/pages/api/auth/forgot-password.ts`

```typescript
// POST /api/auth/forgot-password
// Body: { email: string }
// Returns: { success: true, message: 'If email exists, reset link sent' }

// Flow:
// 1. Find user by email
// 2. Generate secure token (crypto.randomBytes)
// 3. Set resetPasswordToken and resetPasswordExpires (1 hour)
// 4. Send email with reset link
// 5. Always return success (prevent email enumeration)
```

#### 3.2 Reset Password

**File:** `WebSite/pages/api/auth/reset-password.ts`

```typescript
// POST /api/auth/reset-password
// Body: { token: string, password: string }
// Returns: { success: true, message: 'Password updated' }

// Flow:
// 1. Find user by token where expires > now
// 2. Validate new password (Zod schema)
// 3. Update password (pre-save hook will hash)
// 4. Clear resetPasswordToken and resetPasswordExpires
// 5. Send confirmation email
```

#### 3.3 Delete Account

**File:** `WebSite/pages/api/auth/delete-account.ts`

```typescript
// POST /api/auth/delete-account
// Body: { password: string, confirmation: 'DELETE' }
// Returns: { success: true, message: 'Account scheduled for deletion' }

// Flow:
// 1. Verify password
// 2. Verify confirmation string
// 3. Cancel any active Stripe subscription
// 4. Set deletedAt and deletionRequestedAt
// 5. Send confirmation email
// 6. Sign out user

// GDPR: Actually delete data after 30 days grace period
// For MVP: Soft delete is sufficient
```

---

### 4. Frontend Pages

#### 4.1 Subscription Plans Page

**File:** `WebSite/pages/subscription-plans.tsx`

```typescript
// Features:
// - Display 4 plan cards (One-shot, Basic, Pro, Premium)
// - Highlight recommended plan (Pro)
// - Show feature comparison
// - Handle checkout redirect
// - Show current plan if already subscribed

// UI: Use Shadcn/ui Card, Button components
// Style: Match landing page design (Inter font, soft colors)
```

#### 4.2 Checkout Success/Cancel Pages

**Files:**
- `WebSite/pages/checkout/success.tsx`
- `WebSite/pages/checkout/cancel.tsx`

```typescript
// Success page:
// - Verify session_id from URL
// - Show confirmation message
// - Redirect to dashboard after 3 seconds

// Cancel page:
// - Show cancellation message
// - Link back to subscription-plans
```

#### 4.3 Password Reset Pages

**Files:**
- `WebSite/pages/forgot-password.tsx`
- `WebSite/pages/reset-password.tsx`

```typescript
// forgot-password:
// - Email input form
// - Submit to /api/auth/forgot-password
// - Show success message regardless of result

// reset-password:
// - Get token from URL query
// - New password + confirm password form
// - Validate token, submit new password
// - Redirect to login on success
```

#### 4.4 Update Dashboard

**File:** `WebSite/pages/dashboard.tsx`

Update the existing dashboard to:
1. Check subscription status before rendering
2. Redirect to /subscription-plans if no active subscription
3. Show subscription info in sidebar/header
4. Show remaining audit credits for one-shot users

---

### 5. Email System

#### 5.1 Email Service

**File:** `WebSite/lib/email.ts`

```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export async function sendEmail({ to, subject, html, from }: SendEmailParams) {
  try {
    const { data, error } = await resend.emails.send({
      from: from || process.env.RESEND_FROM_EMAIL!,
      to: [to],
      subject,
      html,
    });

    if (error) {
      console.error('Email error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, id: data?.id };
  } catch (error: any) {
    console.error('Email exception:', error);
    return { success: false, error: error.message };
  }
}

// Convenience functions
export async function sendWelcomeEmail(email: string, name: string) { /* ... */ }
export async function sendPasswordResetEmail(email: string, resetUrl: string) { /* ... */ }
export async function sendSubscriptionConfirmationEmail(email: string, tier: string) { /* ... */ }
```

#### 5.2 Email Templates

Create simple HTML templates in `WebSite/emails/`:
- `WelcomeEmail.tsx` - Welcome message, getting started
- `PasswordResetEmail.tsx` - Reset link, 1 hour expiry
- `SubscriptionConfirmationEmail.tsx` - Plan details, receipt

Keep templates simple for MVP - inline styles, no complex React Email setup.

---

### 6. Validation Schemas

**File:** `WebSite/lib/validation/subscription.ts`

```typescript
import { z } from 'zod';

export const CheckoutSchema = z.object({
  priceId: z.string().min(1, 'Price ID is required'),
  mode: z.enum(['subscription', 'payment']),
});

export const ForgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const ResetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z.string()
    .min(12, 'Password must be at least 12 characters')
    .regex(/[A-Z]/, 'Must contain uppercase')
    .regex(/[a-z]/, 'Must contain lowercase')
    .regex(/[0-9]/, 'Must contain digit'),
});

export const DeleteAccountSchema = z.object({
  password: z.string().min(1, 'Password is required'),
  confirmation: z.literal('DELETE', {
    errorMap: () => ({ message: 'Type DELETE to confirm' }),
  }),
});

export type CheckoutInput = z.infer<typeof CheckoutSchema>;
export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;
export type DeleteAccountInput = z.infer<typeof DeleteAccountSchema>;
```

---

### 7. Environment Variables

Update `WebSite/.env.example` - already has all needed vars.

User needs to create `WebSite/.env.local` with:
```bash
# Copy from .env.example and fill in:
MONGODB_URI=mongodb+srv://... # Already have this
MONGODB_ENCRYPTION_KEY=... # Generate: openssl rand -base64 32
NEXTAUTH_SECRET=... # Generate: openssl rand -base64 32
STRIPE_SECRET_KEY=sk_test_... # From Stripe Dashboard
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_test_... # From Stripe Dashboard
STRIPE_PRICE_ID_BASIC=price_... # Create in Stripe
STRIPE_PRICE_ID_PRO=price_... # Create in Stripe
STRIPE_PRICE_ID_PREMIUM=price_... # Create in Stripe
STRIPE_PRICE_ID_ONE_SHOT=price_... # Create in Stripe
STRIPE_WEBHOOK_SECRET=whsec_... # From Stripe Webhooks
RESEND_API_KEY=re_... # From Resend
RESEND_FROM_EMAIL=noreply@yourdomain.com
```

---

## Acceptance Criteria

### Authentication (Epic 2)

- [x] FR1: Email/password registration (already exists)
- [x] FR2: Google OAuth (already exists)
- [ ] FR3: Password reset via email with secure token
- [ ] FR4: Profile editing (language preference)
- [ ] FR5: Language selection persisted to database
- [ ] FR6: Account deletion with Stripe cancellation
- [x] FR7: 30-day sessions (already configured)

### Payments & Subscription (Epic 3)

- [ ] FR54: Basic one-shot purchase (€100, ChatGPT only, 1 competitor)
- [ ] FR55: Pro one-shot purchase (€200, all AI, 5 competitors, history)
- [ ] FR56: Premium subscription (€500/month, 20 audits, unlimited competitors, white-label)
- [ ] FR57: Extra audit purchase for Premium subscribers (+€20/audit beyond 20)
- [ ] FR58: Premium subscription cancellation via Stripe Portal
- [ ] FR59: Stripe Customer Portal access for all users
- [ ] FR60: Webhook handling for payments + subscription events
- [ ] FR61: Feature restrictions based on purchase type (AI engines, competitors, history, white-label)

### Emails (Epic 10 partial)

- [ ] FR63: Welcome email on signup
- [ ] FR65: Subscription confirmation email
- [ ] FR66: Payment receipt email (via Stripe + notification)

---

## Testing Checklist

### Manual Testing

1. **Signup Flow**
   - Register new user → Welcome email received
   - Redirected to /subscription-plans

2. **Subscription Flow**
   - Select plan → Stripe Checkout opens
   - Complete payment (use test card 4242...)
   - Webhook fires → User updated
   - Redirected to dashboard
   - Subscription info visible

3. **One-shot Flow**
   - Purchase one-shot → Payment completes
   - auditCredits = 1
   - Can access dashboard

4. **Password Reset**
   - Click "Forgot password" on login
   - Enter email → Reset email received
   - Click link → Reset form
   - Set new password → Can login

5. **Account Deletion**
   - Go to settings
   - Enter password + DELETE
   - Stripe subscription cancelled
   - Logged out, cannot login

### Stripe Test Cards

- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- Requires Auth: `4000 0025 0000 3155`

---

## Notes for Developer

1. **Stripe Webhook Local Testing**
   ```bash
   # Install Stripe CLI
   brew install stripe/stripe-cli/stripe

   # Forward webhooks to local
   stripe listen --forward-to localhost:3000/api/webhook/stripe
   ```

2. **Create Stripe Products**
   In Stripe Dashboard (Test Mode):
   - Create 4 products: Basic, Pro, Premium, One-shot
   - Set prices in EUR
   - Copy price IDs to .env.local

3. **Next.js Config for Webhook**
   ```javascript
   // next.config.js
   // Already configured, but verify:
   api: {
     bodyParser: {
       sizeLimit: '1mb',
     },
   },
   ```

4. **Security Considerations**
   - Always verify Stripe webhook signature
   - Use HTTPS in production
   - Password reset tokens expire in 1 hour
   - Rate limit forgot-password endpoint

---

## File Checklist

### Create New Files
- [ ] `WebSite/models/Subscription.ts`
- [ ] `WebSite/pages/api/checkout.ts`
- [ ] `WebSite/pages/api/webhook/stripe.ts`
- [ ] `WebSite/pages/api/subscription/portal.ts`
- [ ] `WebSite/pages/api/auth/forgot-password.ts`
- [ ] `WebSite/pages/api/auth/reset-password.ts`
- [ ] `WebSite/pages/api/auth/delete-account.ts`
- [ ] `WebSite/pages/subscription-plans.tsx`
- [ ] `WebSite/pages/checkout/success.tsx`
- [ ] `WebSite/pages/checkout/cancel.tsx`
- [ ] `WebSite/pages/forgot-password.tsx`
- [ ] `WebSite/pages/reset-password.tsx`
- [ ] `WebSite/lib/email.ts`
- [ ] `WebSite/emails/WelcomeEmail.tsx`
- [ ] `WebSite/emails/PasswordResetEmail.tsx`
- [ ] `WebSite/emails/SubscriptionConfirmationEmail.tsx`
- [ ] `WebSite/lib/validation/subscription.ts`

### Modify Existing Files
- [ ] `WebSite/models/User.ts` - Add subscription fields
- [ ] `WebSite/pages/api/auth/[...nextauth].ts` - Add subscription check
- [ ] `WebSite/pages/api/auth/signup.ts` - Send welcome email
- [ ] `WebSite/pages/dashboard.tsx` - Gate access
- [ ] `WebSite/pages/login.tsx` - Add forgot password link
- [ ] `WebSite/lib/validation/index.ts` - Export new schemas
