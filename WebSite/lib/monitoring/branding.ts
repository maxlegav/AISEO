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

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) return;
  await mongoose.connect(process.env.MONGODB_URI!);
};

/**
 * Load white-label branding for an organization, read from its owner user.
 * (SYB v2 multi-tenant: pass the organization owner id.)
 */
export async function getUserBranding(ownerId: string): Promise<BrandingResult> {
  await connectDB();
  const user = await User.findById(ownerId)
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
