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
