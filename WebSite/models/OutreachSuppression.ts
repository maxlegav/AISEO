import mongoose from "mongoose";
import { Schema, models, model } from "mongoose";

/**
 * "Ne plus contacter" list, scoped per organization. Any email here is skipped
 * when the outreach agent prepares new targets, and matching targets are
 * dropped. Supports opt-out / GDPR requests in the human-in-the-loop flow.
 */
export interface OutreachSuppressionDocument extends mongoose.Document {
  organizationId: mongoose.Types.ObjectId;
  email: string;
  reason: string;
  createdAt: Date;
}

const OutreachSuppressionSchema = new Schema<OutreachSuppressionDocument>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    email: { type: String, required: true, lowercase: true, trim: true, maxlength: 320 },
    reason: { type: String, default: "", maxlength: 300 },
    createdAt: { type: Date, default: Date.now },
  },
  { collection: "outreachsuppressions" },
);

OutreachSuppressionSchema.index({ organizationId: 1, email: 1 }, { unique: true });

const OutreachSuppression = (models?.OutreachSuppression ||
  model<OutreachSuppressionDocument>(
    "OutreachSuppression",
    OutreachSuppressionSchema,
  )) as mongoose.Model<OutreachSuppressionDocument>;

export default OutreachSuppression;
