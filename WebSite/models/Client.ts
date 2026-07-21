import mongoose from "mongoose";
import { Schema, models, model } from "mongoose";

/**
 * A Client groups an organization's monitoring projects (SYB v2 multi-tenant).
 * Agencies serving 10–20 customers use clients to keep each customer's projects
 * separate and, optionally, to brand that customer's reports differently from
 * the agency default (per-client white-label override).
 */
export interface ClientBranding {
  agencyName?: string;
  logoUrl?: string;
  primaryColor?: string;
  customDomain?: string;
}

export interface ClientDocument extends mongoose.Document {
  organizationId: mongoose.Types.ObjectId;
  name: string;
  websiteUrl?: string;
  contactEmail?: string;
  archived: boolean;
  branding?: ClientBranding;
  createdAt: Date;
  updatedAt: Date;
}

const ClientSchema = new Schema<ClientDocument>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    websiteUrl: { type: String, trim: true, maxlength: 300 },
    contactEmail: { type: String, trim: true, lowercase: true, maxlength: 200 },
    archived: { type: Boolean, default: false },
    branding: {
      agencyName: { type: String, trim: true, maxlength: 80 },
      logoUrl: { type: String, trim: true, maxlength: 500 },
      primaryColor: { type: String, trim: true, maxlength: 9 },
      customDomain: { type: String, trim: true, maxlength: 200 },
    },
  },
  { timestamps: true },
);

ClientSchema.index({ organizationId: 1, createdAt: -1 });

const Client = (models?.Client ||
  model<ClientDocument>("Client", ClientSchema)) as mongoose.Model<ClientDocument>;

export default Client;
