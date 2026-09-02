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

  // Live site URL: reads from NEXT_PUBLIC_SITE_URL env var (set in Vercel dashboard)
  // Falls back to the current Vercel deployment URL
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "https://showyourbrand.app",

  // Stripe Configuration - ShowYourBrand Pricing
  stripe: {
    // Data One-Shot: €29, raw JSON for developers & technical SEO
    data: {
      priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_DATA || "",
      name: "Data",
      price: 29,
      currency: "EUR",
      mode: "payment",
      outputMode: "data",
      competitors: 3,
      dashboardAccessDays: null,
      auditsIncluded: 1,
      features: [
        { name: "1 GEO audit sur 4 AI engines" },
        { name: "Raw JSON export of all results" },
        { name: "GEO Health Score & category breakdown" },
        { name: "100 prompts tested, 3 competitors" },
        { name: "HTML scanner raw results" },
        { name: "Permanent data access via API" },
      ],
    },
    // Starter One-Shot: €79, test your AI visibility
    starter: {
      priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_STARTER || "",
      name: "Starter",
      price: 79,
      oldPrice: 129,
      currency: "EUR",
      mode: "payment",
      outputMode: "full",
      competitors: 3,
      dashboardAccessDays: 30,
      auditsIncluded: 1,
      features: [
        { name: "1 complete GEO audit" },
        { name: "4 AI engines: ChatGPT, Claude, Perplexity & Gemini" },
        { name: "GEO Health Score (0–100) with breakdown" },
        { name: "100 AI prompts in your category" },
        { name: "3 competitor benchmarks" },
        { name: "Technical HTML & Schema.org audit" },
        { name: "Prioritized action plan" },
        { name: "Dashboard access (30 days)" },
      ],
    },
    // Pro Subscription: €59/month, track monthly progress
    pro: {
      priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO || "",
      name: "Pro",
      price: 59,
      currency: "EUR",
      mode: "subscription",
      interval: "month",
      outputMode: "full",
      competitors: 3,
      dashboardAccessDays: null,
      auditsPerMonth: 1,
      features: [
        { name: "1 automatic audit per month" },
        { name: "4 AI engines + monthly comparison" },
        { name: "Month-over-month score delta" },
        { name: "Fixed vs new issues tracking" },
        { name: "Prompt-level gain / loss tracking" },
        { name: "3 competitor benchmarks" },
        { name: "Permanent dashboard + full history" },
        { name: "Regression alerts by email" },
      ],
    },
    // Agency Subscription: €599/month, multi-client with white-label
    agency: {
      priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_AGENCY || "",
      name: "Agency",
      price: 599,
      currency: "EUR",
      mode: "subscription",
      interval: "month",
      outputMode: "full",
      competitors: 3,
      dashboardAccessDays: null,
      auditsPerMonth: 15,
      features: [
        { name: "15 client audits per month" },
        { name: "All Pro features per client" },
        { name: "Multi-client dashboard" },
        { name: "White-label shareable reports" },
        { name: "3 competitor benchmarks per client" },
        { name: "Resell at your own price" },
        { name: "Dedicated account manager" },
      ],
    },
    // Agency Extra Audit: €50 one-shot, additional audit beyond monthly credits
    agencyExtraAudit: {
      priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_AGENCY_EXTRA || "",
      name: "Extra Audit",
      price: 50,
      currency: "EUR",
      mode: "payment",
      outputMode: "full",
      features: [
        { name: "1 additional GEO audit" },
        { name: "All 4 AI engines included" },
        { name: "Full dashboard + history access" },
        { name: "3 competitor benchmarks" },
      ],
    },
  },

  // SYB v2: recurring GEO *monitoring* plans (Solo / Pro / Agence).
  // These replace the one-shot audit tiers above as we transition to the
  // continuous-monitoring product. Prices are the single source of truth;
  // per-plan limits (projects / engines / frequency) live in
  // `lib/monitoring/plans.ts`, which imports these prices.
  monitoring: {
    currency: "EUR",
    interval: "month",
    solo: {
      priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_MONITORING_SOLO || "",
      name: "Solo",
      price: 29,
    },
    pro: {
      priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_MONITORING_PRO || "",
      name: "Pro",
      price: 79,
    },
    agency: {
      priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_MONITORING_AGENCY || "",
      name: "Agence",
      price: 149,
    },
  },

  // Email Configuration (using Resend)
  email: {
    fromNoReply: process.env.RESEND_FROM_EMAIL || "noreply@ShowYourBrand.com",
    fromSupport: process.env.RESEND_FROM_EMAIL || "support@ShowYourBrand.com",
    supportEmail: "support@ShowYourBrand.com",
  },

  // Theme & Colors. The source of truth for the UI is tailwind.config.ts
  // (`ink` / `paper` / `accent`); these mirror it for anywhere that needs a
  // raw hex — an email, an OG image, a meta theme-color.
  colors: {
    primary: "#141311", // Ink — the primary action colour is near-black
    accent: "#AE3B22", // The single accent, spent sparingly
    paper: "#F7F5F0", // Warm off-white ground
    success: "#15803D",
    error: "#B3311F",
    warning: "#B45309",
    neutral: "#6B665D",
  },

  // Callback URL after authentication
  callbackUrl: "/dashboard",
};

export default config;
