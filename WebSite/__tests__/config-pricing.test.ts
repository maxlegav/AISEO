import { describe, it, expect } from "vitest";
import config from "@/config";

// config.ts is the single source of truth for pricing. These tests guard against
// accidental drift (a recurring problem: planning docs said €100/€200/€500).
describe("config.stripe pricing (single source of truth)", () => {
  it("keeps the canonical price + mode for every tier", () => {
    const expected = {
      data: { price: 29, mode: "payment" },
      starter: { price: 79, mode: "payment" },
      pro: { price: 59, mode: "subscription" },
      agency: { price: 599, mode: "subscription" },
      agencyExtraAudit: { price: 50, mode: "payment" },
    } as const;

    for (const [key, { price, mode }] of Object.entries(expected)) {
      const tier = config.stripe[key as keyof typeof config.stripe];
      expect(tier, `missing tier ${key}`).toBeTruthy();
      expect(tier.price, `price for ${key}`).toBe(price);
      expect(tier.mode, `mode for ${key}`).toBe(mode);
      expect(tier.currency).toBe("EUR");
    }
  });

  it("prices subscriptions per month and one-shots without an interval", () => {
    expect(config.stripe.pro.interval).toBe("month");
    expect(config.stripe.agency.interval).toBe("month");
    expect("interval" in config.stripe.data).toBe(false);
    expect("interval" in config.stripe.starter).toBe(false);
    expect("interval" in config.stripe.agencyExtraAudit).toBe(false);
  });
});
