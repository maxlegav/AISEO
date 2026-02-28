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
  domainName: "ShowYourBrand.com",

  // Live site URL — reads from NEXT_PUBLIC_SITE_URL env var (set in Vercel dashboard)
  // Falls back to the current Vercel deployment URL
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "https://showyourbrand.vercel.app",

  // Stripe Configuration - ShowYourBrand Pricing
  stripe: {
    // Basic One-Shot: €199 (ChatGPT only, 1 competitor, no history)
    basic: {
      priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_BASIC || "",
      name: "Basic",
      price: 199,
      oldPrice: 299,
      currency: "EUR",
      mode: "payment", // one-shot
      features: [
        { name: "1 complete GEO audit" },
        { name: "ChatGPT analysis (GPT-4o)" },
        { name: "1 competitor comparison" },
        { name: "100 AI prompt testing" },
        { name: "Full PDF report with insights" },
        { name: "HTML & schema.org scan" },
        { name: "Content optimization tips" },
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
        { name: "1 complete GEO audit" },
        { name: "All 4 AI engines (ChatGPT, Claude, Perplexity, DeepSeek)" },
        { name: "5 competitor comparisons" },
        { name: "100 AI prompt testing" },
        { name: "Full PDF report + executive summary" },
        { name: "HTML & schema.org deep scan" },
        { name: "AI-optimized FAQ generation" },
        { name: "Priority action plan (ranked by impact)" },
        { name: "Dashboard with full history" },
        { name: "Priority email support (24h)" },
      ],
    },
    // Premium Subscription: €799/month (20 audits included, unlimited competitors, white-label)
    premium: {
      priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PREMIUM || "",
      name: "Premium",
      price: 799,
      oldPrice: 1199,
      currency: "EUR",
      interval: "month",
      mode: "subscription",
      auditsIncluded: 20,
      extraAuditPrice: 35,
      features: [
        { name: "20 audits per month included" },
        { name: "All 4 AI engines per audit" },
        { name: "Unlimited competitor comparisons" },
        { name: "100 AI prompt testing per audit" },
        { name: "White-label PDF reports (your branding)" },
        { name: "Bulk audit management dashboard" },
        { name: "Client-ready executive summaries" },
        { name: "Schema markup & FAQ auto-generation" },
        { name: "Monthly GEO trend reports" },
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
