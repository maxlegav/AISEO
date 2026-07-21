/* One-off (test) helper: create the 3 SYB v2 recurring monitoring products in
 * Stripe and print their price IDs. Reads STRIPE_SECRET_KEY from env. */
const Stripe = require("stripe");

const PLANS = [
  { key: "SOLO", name: "SYB Monitoring — Solo", amount: 2900 },
  { key: "PRO", name: "SYB Monitoring — Pro", amount: 7900 },
  { key: "AGENCY", name: "SYB Monitoring — Agence", amount: 14900 },
];

// Stripe accounts with Managed Payments enabled (default on new accounts)
// require every product to carry an eligible tax code, and Checkout to run on
// the 2025-03-31.basil API version or newer. "SaaS - business use".
const TAX_CODE = "txcd_10103001";

(async () => {
  const s = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2025-03-31.basil",
  });
  // sanity: key valid
  await s.balance.retrieve();

  // archive any pre-existing active products (clean slate on the new account)
  const existing = await s.products.list({ limit: 100, active: true });
  for (const p of existing.data) {
    await s.products.update(p.id, { active: false });
    console.error("archived existing product:", p.id, p.name);
  }

  const out = {};
  for (const plan of PLANS) {
    // Create the product with a tax code first (required by Managed Payments),
    // then attach a recurring EUR price to it.
    const product = await s.products.create({
      name: plan.name,
      tax_code: TAX_CODE,
    });
    const price = await s.prices.create({
      currency: "eur",
      unit_amount: plan.amount,
      recurring: { interval: "month" },
      product: product.id,
    });
    out[plan.key] = price.id;
    console.error(`created ${plan.name}: price=${price.id} product=${price.product}`);
  }
  // machine-readable line for the shell to capture
  console.log(JSON.stringify(out));
})().catch((e) => {
  console.error("ERROR:", e.message);
  process.exit(1);
});
