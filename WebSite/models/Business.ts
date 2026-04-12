import mongoose from "mongoose";
import { Schema, models, model } from "mongoose";

export interface BusinessDocument extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  primaryUrl: string;
  subUrls: string[];
  competitorUrls: string[];
  category: string;
  description?: string;
  // Extended business context (used by the Python audit service)
  targetKeywords: string[];
  servicesOrProducts: string[];
  uniqueSellingPoints: string[];
  targetAudience?: string;
  priceRange?: "budget" | "mid" | "premium";
  yearFounded?: number;
  certifications: string[];
  socialMediaUrls: string[];
  // Locality (persisted so re-audits keep the same classification)
  localityTier?: "global" | "national" | "hyper_local";
  city?: string;
  country?: string;
  neighborhood?: string;
  street?: string;
  region?: string;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const BusinessSchema = new Schema<BusinessDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    slug: { type: String, required: true, lowercase: true, trim: true },
    primaryUrl: { type: String, required: true, trim: true },
    subUrls: { type: [String], default: [] },
    competitorUrls: { type: [String], default: [] },
    category: { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, maxlength: 500 },
    // Extended business context
    targetKeywords: { type: [String], default: [] },
    servicesOrProducts: { type: [String], default: [] },
    uniqueSellingPoints: { type: [String], default: [] },
    targetAudience: { type: String, trim: true, maxlength: 200 },
    priceRange: { type: String, enum: ["budget", "mid", "premium"] },
    yearFounded: { type: Number, min: 1800, max: 9999 },
    certifications: { type: [String], default: [] },
    socialMediaUrls: { type: [String], default: [] },
    // Locality
    localityTier: { type: String, enum: ["global", "national", "hyper_local"] },
    city: { type: String, trim: true, maxlength: 100 },
    country: { type: String, trim: true, maxlength: 100 },
    neighborhood: { type: String, trim: true, maxlength: 100 },
    street: { type: String, trim: true, maxlength: 200 },
    region: { type: String, trim: true, maxlength: 100 },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Compound index: unique slug per user
BusinessSchema.index({ userId: 1, slug: 1 }, { unique: true });
BusinessSchema.index({ userId: 1, deletedAt: 1 });

// Auto-generate slug from name before validation
BusinessSchema.pre("validate", function (next) {
  if (this.isModified("name") && !this.isModified("slug")) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .substring(0, 60);
  }
  next();
});

const Business = (models?.Business || model<BusinessDocument>("Business", BusinessSchema)) as mongoose.Model<BusinessDocument>;
export default Business;
