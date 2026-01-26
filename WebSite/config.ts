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

  // Stripe Configuration (TODO: Story 1.2 - configure actual AISEO pricing)
  stripe: {
    // Basic: 1 project, €50/month
    basic: {
      priceId: process.env.STRIPE_PRICE_ID_BASIC || "",
      name: "Basic",
      price: 50,
      currency: "EUR",
      interval: "month",
      projectLimit: 1,
      features: [
        { name: "1 project (website)" },
        { name: "100 AI prompt testing" },
        { name: "Full GEO audit reports" },
        { name: "AI-powered recommendations" },
        { name: "Email support" },
      ],
    },
    // Pro: 5 projects, €150/month
    pro: {
      priceId: process.env.STRIPE_PRICE_ID_PRO || "",
      name: "Pro",
      price: 150,
      currency: "EUR",
      interval: "month",
      projectLimit: 5,
      features: [
        { name: "5 projects (websites)" },
        { name: "100 AI prompt testing per project" },
        { name: "Full GEO audit reports" },
        { name: "AI-powered recommendations" },
        { name: "Priority email support" },
      ],
    },
    // Premium: 10+ projects, €300/month
    premium: {
      priceId: process.env.STRIPE_PRICE_ID_PREMIUM || "",
      name: "Premium",
      price: 300,
      currency: "EUR",
      interval: "month",
      projectLimit: 10,
      features: [
        { name: "10+ projects (websites)" },
        { name: "100 AI prompt testing per project" },
        { name: "Full GEO audit reports" },
        { name: "AI-powered recommendations" },
        { name: "White-label reports (custom branding)" },
        { name: "Priority support" },
      ],
    },
    // One-shot audit: €300
    oneShot: {
      priceId: process.env.STRIPE_PRICE_ID_ONE_SHOT || "",
      name: "One-Time Audit",
      price: 299,
      currency: "EUR",
      features: [
        { name: "Single comprehensive GEO audit" },
        { name: "100 AI prompt testing" },
        { name: "Full PDF report" },
        { name: "AI-powered recommendations" },
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
