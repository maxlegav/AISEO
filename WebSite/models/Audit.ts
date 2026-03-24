import mongoose from "mongoose";
import { Schema, models, model } from "mongoose";

export interface AuditDocument extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  businessId: mongoose.Types.ObjectId;
  businessName?: string;
  status:
    | "pending"
    | "processing"
    | "awaiting_prompt_approval"
    | "questions_review"
    | "auditing"
    | "review_pending"
    | "completed"
    | "rejected"
    | "failed";
  geoScore?: number | null;
  results?: mongoose.Schema.Types.Mixed;
  error?: string | null;
  schemaVersion?: number;
  createdAt?: Date;
  completedAt?: Date | null;
  reviewedAt?: Date | null;
  reviewedBy?: string | null;
  questionsEditedAt?: Date | null;
  questionsEditedBy?: string | null;
  // Sharing
  shareToken?: string | null;
  sharedAt?: Date | null;
}

const AuditSchema = new Schema<AuditDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    businessId: { type: Schema.Types.ObjectId, ref: "Business", required: true, index: true },
    businessName: { type: String },

    status: {
      type: String,
      enum: [
        "pending",
        "processing",
        "awaiting_prompt_approval",
        "questions_review",
        "auditing",
        "review_pending",
        "completed",
        "rejected",
        "failed",
      ],
      required: true,
      default: "pending",
    },

    geoScore: { type: Number, min: 0, max: 100, default: null },

    // Dense JSON blob written by the Python server — don't decompose
    results: { type: Schema.Types.Mixed, default: null },

    error: { type: String, default: null },
    schemaVersion: { type: Number },

    createdAt: { type: Date },
    completedAt: { type: Date, default: null },

    // Admin review fields
    reviewedAt: { type: Date, default: null },
    reviewedBy: { type: String, default: null },
    questionsEditedAt: { type: Date, default: null },
    questionsEditedBy: { type: String, default: null },
    // Sharing (raw token stored — 64-char random hex, 256-bit entropy)
    shareToken: { type: String, default: null, index: true, sparse: true },
    sharedAt: { type: Date, default: null },
  },
  {
    timestamps: false,
    collection: "audits",
  }
);

AuditSchema.index({ userId: 1, createdAt: -1 });
AuditSchema.index({ userId: 1, businessId: 1, createdAt: -1 });

const Audit = (
  models?.Audit || model<AuditDocument>("Audit", AuditSchema)
) as mongoose.Model<AuditDocument>;

export default Audit;
