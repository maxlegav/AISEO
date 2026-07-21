/**
 * Server-side helper to load an agency's white-label branding for the `/app`
 * settings page. Only call from `getServerSideProps` (touches Mongo + models).
 */
import mongoose from "mongoose";
import User from "@/models/User";
import { planForTier } from "@/lib/monitoring/plans";
import type { SubscriptionTier } from "@/lib/subscription-limits";

export interface Branding {
  agencyName: string;
  logoUrl: string;
  primaryColor: string;
  customDomain: string;
  brandedPdfEnabled: boolean;
}

export interface BrandingResult {
  branding: Branding;
  /** True when white-label is active on the user's plan (Agence). */
  whiteLabelActive: boolean;
}

const DEFAULT_BRANDING: Branding = {
  agencyName: "",
  logoUrl: "",
  primaryColor: "#7c3aed",
  customDomain: "",
  brandedPdfEnabled: false,
};

/** SYB defaults used when white-label is not active on the report. */
const SYB_REPORT_BRANDING = {
  name: "ShowYourBrand",
  logoUrl: "/syb_logo_transparent.png",
  primaryColor: "#7c3aed",
  domain: "showyourbrand.io",
} as const;

/** Branding actually applied to a client-facing report. */
export interface ReportBranding {
  name: string;
  logoUrl: string;
  primaryColor: string;
  domain: string;
  /** True when the agency white-label replaces the SYB mark. */
  whiteLabel: boolean;
}

/**
 * Decide the branding to render on an exported report. White-label (agency
 * logo/colors replacing the SYB mark) is only applied when the plan allows it
 * (`whiteLabelActive`), the agency enabled branded PDF, and a name is set —
 * otherwise the report falls back to the SYB defaults.
 */
export function resolveReportBranding(
  branding: Branding,
  whiteLabelActive: boolean,
): ReportBranding {
  const whiteLabel =
    whiteLabelActive &&
    branding.brandedPdfEnabled &&
    branding.agencyName.trim().length > 0;

  if (!whiteLabel) {
    return { ...SYB_REPORT_BRANDING, whiteLabel: false };
  }

  return {
    name: branding.agencyName.trim(),
    logoUrl: branding.logoUrl.trim() || SYB_REPORT_BRANDING.logoUrl,
    primaryColor: branding.primaryColor || SYB_REPORT_BRANDING.primaryColor,
    domain: branding.customDomain.trim() || SYB_REPORT_BRANDING.domain,
    whiteLabel: true,
  };
}

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) return;
  await mongoose.connect(process.env.MONGODB_URI!);
};

export async function getUserBranding(userId: string): Promise<BrandingResult> {
  await connectDB();
  const user = await User.findById(userId)
    .select("subscriptionTier branding")
    .lean<{
      subscriptionTier?: SubscriptionTier;
      branding?: Partial<Branding>;
    } | null>();

  const tier = (user?.subscriptionTier as SubscriptionTier) || "none";
  return {
    branding: { ...DEFAULT_BRANDING, ...(user?.branding ?? {}) },
    whiteLabelActive: planForTier(tier).brandedPdf,
  };
}
