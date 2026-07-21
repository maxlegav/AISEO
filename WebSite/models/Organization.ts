import mongoose from "mongoose";
import { Schema, models, model } from "mongoose";

/**
 * An Organization is the tenant that owns monitoring projects and clients
 * (SYB v2 multi-tenant). Every user gets a personal organization on demand
 * (see `lib/monitoring/workspace.ts`). Agencies invite teammates into their
 * organization via `Membership`, and group projects under `Client`s.
 *
 * Billing stays on the owner `User` (subscriptionTier/status); plan gating and
 * white-label branding are read from the organization owner.
 */
export interface OrganizationDocument extends mongoose.Document {
  name: string;
  ownerId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const OrganizationSchema = new Schema<OrganizationDocument>(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  { timestamps: true },
);

const Organization = (models?.Organization ||
  model<OrganizationDocument>(
    "Organization",
    OrganizationSchema,
  )) as mongoose.Model<OrganizationDocument>;

export default Organization;
