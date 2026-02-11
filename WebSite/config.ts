/**
 * AISEO Platform Configuration
 *
 * This file contains application-wide configuration.
 * Values marked with "TODO: Story 1.2" will be filled during the AISEO rebrand phase.
 */

const config = {
  // Application Info
  appName: "AISEO",
  appDescription: "GEO (Generative Engine Optimization) audit platform - Make businesses visible in AI search engines",

  // Domain (TODO: Story 1.2 - set actual domain)
  domainName: "aiseo.com",

  // Stripe Configuration - AISEO Pricing (per BMAD specs)
  stripe: {
    // Basic One-Shot: €100 (ChatGPT only, 1 competitor, no history)
    basic: {
      priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_BASIC || "",
      name: "Basic",
      price: 100,
      currency: "EUR",
      mode: "payment", // one-shot
      features: [
        { name: "1 complete GEO audit" },
        { name: "ChatGPT analysis only" },
        { name: "1 competitor comparison" },
        { name: "100 AI prompt testing" },
        { name: "Full PDF report" },
        { name: "Email support" },
      ],
    },
    // Pro One-Shot: €200 (all 4 AI engines, 5 competitors, with history)
    pro: {
      priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO || "",
      name: "Pro",
      price: 200,
      currency: "EUR",
      mode: "payment", // one-shot
      features: [
        { name: "1 complete GEO audit" },
        { name: "All 4 AI engines (ChatGPT, Claude, Perplexity, DeepSeek)" },
        { name: "5 competitor comparisons" },
        { name: "100 AI prompt testing" },
        { name: "Full PDF report" },
        { name: "Dashboard with history" },
        { name: "Priority email support" },
      ],
    },
    // Premium Subscription: €500/month (20 audits included, unlimited competitors, white-label)
    premium: {
      priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PREMIUM || "",
      name: "Premium",
      price: 500,
      currency: "EUR",
      interval: "month",
      mode: "subscription",
      auditsIncluded: 20,
      extraAuditPrice: 20,
      features: [
        { name: "20 audits per month included" },
        { name: "All 4 AI engines" },
        { name: "Unlimited competitor comparisons" },
        { name: "100 AI prompt testing per audit" },
        { name: "White-label PDF reports (your branding)" },
        { name: "Full dashboard with history" },
        { name: "Priority support" },
        { name: "+€20 per extra audit beyond 20" },
      ],
    },
  },

  // Email Configuration (using Resend)
  email: {
    fromNoReply: process.env.RESEND_FROM_EMAIL || "noreply@aiseo.com",
    fromSupport: process.env.RESEND_FROM_EMAIL || "support@aiseo.com",
    supportEmail: "support@aiseo.com",
  },

  // Theme & Colors (based on UX Design specification)
  colors: {
    primary: "#3B82F6",    // Blue (Primary)
    success: "#10B981",     // Green (Success)
    error: "#EF4444",       // Red (Error)
    warning: "#F59E0B",     // Orange (Warning)
    neutral: "#6B7280",     // Gray (Neutral)
  },

  // Callback URL after authentication
  callbackUrl: "/dashboard",
};

export default config;
