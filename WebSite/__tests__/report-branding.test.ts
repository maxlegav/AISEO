import { describe, it, expect } from "vitest";
import {
  resolveReportBranding,
  type Branding,
} from "@/lib/monitoring/branding";

const agencyBranding: Branding = {
  agencyName: "Studio GEO Paris",
  logoUrl: "https://cdn.example.com/logo.png",
  primaryColor: "#16a34a",
  customDomain: "reports.studiogeo.fr",
  brandedPdfEnabled: true,
};

describe("resolveReportBranding", () => {
  it("applies white-label when active, enabled and named", () => {
    const b = resolveReportBranding(agencyBranding, true);
    expect(b.whiteLabel).toBe(true);
    expect(b.name).toBe("Studio GEO Paris");
    expect(b.primaryColor).toBe("#16a34a");
    expect(b.domain).toBe("reports.studiogeo.fr");
    expect(b.logoUrl).toBe("https://cdn.example.com/logo.png");
  });

  it("falls back to SYB defaults when plan does not allow white-label", () => {
    const b = resolveReportBranding(agencyBranding, false);
    expect(b.whiteLabel).toBe(false);
    expect(b.name).toBe("ShowYourBrand");
    expect(b.primaryColor).toBe("#7c3aed");
  });

  it("falls back to SYB when branded PDF is disabled", () => {
    const b = resolveReportBranding(
      { ...agencyBranding, brandedPdfEnabled: false },
      true,
    );
    expect(b.whiteLabel).toBe(false);
    expect(b.name).toBe("ShowYourBrand");
  });

  it("falls back to SYB when the agency name is empty", () => {
    const b = resolveReportBranding(
      { ...agencyBranding, agencyName: "   " },
      true,
    );
    expect(b.whiteLabel).toBe(false);
  });

  it("uses SYB defaults for optional fields left blank under white-label", () => {
    const b = resolveReportBranding(
      { ...agencyBranding, logoUrl: "", customDomain: "" },
      true,
    );
    expect(b.whiteLabel).toBe(true);
    expect(b.logoUrl).toBe("/syb_logo_transparent.png");
    expect(b.domain).toBe("showyourbrand.io");
  });
});
