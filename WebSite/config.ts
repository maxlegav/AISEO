/**
 * ShowYourBrand Platform Configuration
 *
 * This file contains application-wide configuration.
 * Values marked with "TODO: Story 1.2" will be filled during the ShowYourBrand rebrand phase.
 */

const config = {
  // Application Info
  appName: "ShowYourBrand",
  appDescription:
    "GEO (Generative Engine Optimization) audit platform - Make businesses visible in AI search engines",

  // Domain (TODO: Story 1.2 - set actual domain)
  domainName: "ShowYourBrand.app",

  // Live site URL — reads from NEXT_PUBLIC_SITE_URL env var (set in Vercel dashboard)
  // Falls back to the current Vercel deployment URL
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "https://showyourbrand.app",

  // Stripe Configuration - ShowYourBrand Pricing
  stripe: {
    // Starter One-Shot: €79 (all 4 engines, 3 competitors, 30-day dashboard)
    starter: {
      priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_STARTER || "",
      name: "Starter",
      price: 79,
      oldPrice: 129,
      currency: "EUR",
      mode: "payment", // one-shot
      features: [
        { name: "1 complete GEO visibility audit" },
        { name: "ChatGPT (GPT-4o) AI citation analysis" },
        { name: "GEO Health Score (0–100) with breakdown" },
        { name: "100 AI prompts tested in your category" },
        { name: "1 competitor benchmark" },
        { name: "Technical HTML & Schema.org audit" },
        { name: "Content gap & missing FAQ identification" },
        { name: "Full PDF report with prioritized fixes" },
        { name: "Email support (48h response)" },
      ],
    },
    // Pro One-Shot: €399 (all 4 AI engines, 5 competitors, with history)
    pro: {
      priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO || "",
      name: "Pro",
      price: 399,
      oldPrice: 599,
      currency: "EUR",
      mode: "payment", // one-shot
      features: [
        { name: "1 complete GEO visibility audit" },
        { name: "4 AI engines: ChatGPT, Claude, Perplexity & DeepSeek" },
        { name: "GEO Health Score + competitor gap analysis" },
        { name: "100 AI prompts tested in your category" },
        { name: "5 competitor benchmarks" },
        { name: "Technical HTML & Schema.org deep scan" },
        { name: "AI-optimized FAQ & content snippets to add" },
        { name: "Priority action plan ranked by ROI impact" },
        { name: "PDF report + executive summary (shareable)" },
        { name: "Dashboard with progress history" },
        { name: "Priority support (24h)" },
      ],
    },
    // Premium Subscription: €799/month (20 audits included, unlimited competitors, white-label)
    premium: {
      priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PREMIUM || "",
      name: "Agency",
      price: 799,
      oldPrice: 1199,
      currency: "EUR",
      interval: "month",
      mode: "subscription",
      auditsIncluded: 20,
      extraAuditPrice: 35,
      features: [
        { name: "20 client GEO audits per month" },
        { name: "All 4 AI engines per audit" },
        { name: "Unlimited competitor benchmarks" },
        { name: "White-label PDF reports with your branding" },
        { name: "Agency dashboard to manage all clients" },
        { name: "Automated client-ready executive reports" },
        { name: "Schema.org & FAQ code snippets to deploy" },
        { name: "Monthly GEO evolution tracking per client" },
        { name: "Resell audits at your own price" },
        { name: "Dedicated account manager" },
        { name: "+€35 per extra audit beyond 20" },
      ],
    },
  },

  // Email Configuration (using Resend)
  email: {
    fromNoReply: process.env.RESEND_FROM_EMAIL || "noreply@ShowYourBrand.com",
    fromSupport: process.env.RESEND_FROM_EMAIL || "support@ShowYourBrand.com",
    supportEmail: "support@ShowYourBrand.com",
  },

  // Theme & Colors (based on UX Design specification)
  colors: {
    primary: "#7C3AED", // Purple (Primary brand color)
    success: "#10B981", // Green (Success)
    error: "#EF4444", // Red (Error)
    warning: "#F59E0B", // Orange (Warning)
    neutral: "#6B7280", // Gray (Neutral)
  },

  // Callback URL after authentication
  callbackUrl: "/dashboard",
};

export default config;
