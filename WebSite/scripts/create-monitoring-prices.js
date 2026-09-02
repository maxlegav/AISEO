/* eslint-disable */
/**
 * Create (or reuse) the three recurring Stripe prices for the SYB v2
 * monitoring plans, and print the env lines they need.
 *
 * Without these IDs `config.monitoring.*.priceId` is empty, so every plan
 * button posts an empty price and `/api/checkout` answers "Invalid price ID"
 * (the whitelist in lib/stripe-tiers.ts). This is the one-shot fix.
 *
 * Uses the REST API over `fetch` rather than the `stripe` SDK: the SDK's agent
 * hangs indefinitely behind some proxies, where plain HTTPS answers instantly.
 * Idempotent — products are listed and filtered on their `syb_plan` metadata
 * (never `products/search`, which lags behind writes by up to a minute and
 * duplicated the Pro plan when this script was first run), and prices are
 * matched on amount/currency/interval. Re-running changes nothing.
 *
 * Usage: node scripts/create-monitoring-prices.js
 */
const fs = require("fs");

const env = fs.readFileSync(".env.local", "utf8");
const KEY = (env.match(/^STRIPE_SECRET_KEY=(.*)$/m) || [])[1]?.trim();
if (!KEY) {
  console.error("STRIPE_SECRET_KEY absent de .env.local");
  process.exit(1);
}

const PLANS = [
  { id: "solo", name: "ShowYourBrand Solo", amount: 29,
    env: "NEXT_PUBLIC_STRIPE_PRICE_ID_MONITORING_SOLO",
    description: "Monitoring GEO continu · 2 projets · 3 moteurs IA · analyse hebdomadaire" },
  { id: "pro", name: "ShowYourBrand Pro", amount: 79,
    env: "NEXT_PUBLIC_STRIPE_PRICE_ID_MONITORING_PRO",
    description: "Monitoring GEO continu · 10 projets · 4 moteurs IA · 2 projets en quotidien" },
  { id: "agency", name: "ShowYourBrand Agence", amount: 149,
    env: "NEXT_PUBLIC_STRIPE_PRICE_ID_MONITORING_AGENCY",
    description: "Monitoring GEO continu · projets illimités · 4 moteurs IA · 5 projets en quotidien · marque blanche" },
];

const auth = "Basic " + Buffer.from(`${KEY}:`).toString("base64");

async function stripe(path, { method = "GET", form, query } = {}) {
  const url = new URL(`https://api.stripe.com/v1/${path}`);
  if (query) for (const [k, v] of Object.entries(query)) url.searchParams.set(k, String(v));
  const res = await fetch(url, {
    method,
    headers: {
      authorization: auth,
      ...(form ? { "content-type": "application/x-www-form-urlencoded" } : {}),
    },
    body: form ? new URLSearchParams(form) : undefined,
    signal: AbortSignal.timeout(30_000),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`${path}: ${json.error?.message || res.status}`);
  return json;
}

(async () => {
  const lines = [];
  for (const plan of PLANS) {
    // `products/search` is eventually consistent — it missed a product created
    // thirty seconds earlier and this script duplicated it. Listing and
    // filtering on metadata is strongly consistent, so re-running is safe.
    const all = await stripe("products", { query: { active: "true", limit: 100 } });
    let product = all.data
      .filter((p) => p.metadata?.syb_plan === plan.id)
      .sort((a, b) => a.created - b.created)[0];
    if (product) {
      console.log(`= produit existant  ${plan.name.padEnd(24)} ${product.id}`);
    } else {
      product = await stripe("products", {
        method: "POST",
        form: {
          name: plan.name,
          description: plan.description,
          "metadata[syb_plan]": plan.id,
        },
      });
      console.log(`+ produit créé      ${plan.name.padEnd(24)} ${product.id}`);
    }

    const prices = await stripe("prices", {
      query: { product: product.id, active: "true", limit: 100 },
    });
    let price = prices.data.find(
      (p) =>
        p.currency === "eur" &&
        p.unit_amount === plan.amount * 100 &&
        p.recurring?.interval === "month",
    );
    if (price) {
      console.log(`= prix existant     ${String(plan.amount).padStart(3)} EUR/mois            ${price.id}`);
    } else {
      price = await stripe("prices", {
        method: "POST",
        form: {
          product: product.id,
          currency: "eur",
          unit_amount: String(plan.amount * 100),
          "recurring[interval]": "month",
          "metadata[syb_plan]": plan.id,
        },
      });
      console.log(`+ prix créé         ${String(plan.amount).padStart(3)} EUR/mois            ${price.id}`);
    }
    lines.push(`${plan.env}=${price.id}`);
  }

  console.log("\n--- à mettre dans .env.local et dans Vercel ---");
  console.log(lines.join("\n"));
})().catch((e) => {
  console.error("ERREUR", e.message);
  process.exit(1);
});
