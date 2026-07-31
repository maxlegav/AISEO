import mongoose from "mongoose";
import { Schema, models, model } from "mongoose";
import type { LLMId, MonitoringFrequency } from "@/lib/monitoring/types";

/**
 * A brand the user monitors: its site, competitors and the prompts sent to the
 * LLMs. This replaces the one-shot `Business`/`Audit` pair with a continuously
 * monitored entity (SYB v2).
 */
export interface ProjectDocument extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  /** Tenant that owns this project (SYB v2 multi-tenant). Backfilled from userId. */
  organizationId?: mongoose.Types.ObjectId;
  /** Optional client this project belongs to, within the organization. */
  clientId?: mongoose.Types.ObjectId | null;
  brandName: string;
  websiteUrl: string;
  category?: string;
  competitors: string[];
  prompts: string[];
  llms: LLMId[];
  frequency: MonitoringFrequency;
  active: boolean;
  lastRunAt?: Date | null;
  nextRunAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema = new Schema<ProjectDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      default: null,
      index: true,
    },
    clientId: { type: Schema.Types.ObjectId, ref: "Client", default: null, index: true },
    brandName: { type: String, required: true, trim: true, maxlength: 120 },
    websiteUrl: { type: String, required: true, trim: true, maxlength: 300 },
    category: { type: String, trim: true, maxlength: 160 },
    competitors: { type: [String], default: [] },
    prompts: { type: [String], default: [] },
    llms: {
      type: [String],
      enum: ["chatgpt", "claude", "perplexity", "gemini"],
      default: ["chatgpt", "claude", "perplexity", "gemini"],
    },
    frequency: {
      type: String,
      enum: ["weekly", "daily"],
      default: "weekly",
    },
    active: { type: Boolean, default: true },
    lastRunAt: { type: Date, default: null },
    nextRunAt: { type: Date, default: null },
  },
  { timestamps: true },
);

ProjectSchema.index({ userId: 1, createdAt: -1 });
ProjectSchema.index({ organizationId: 1, createdAt: -1 });
ProjectSchema.index({ active: 1, nextRunAt: 1 });

const Project = (models?.Project ||
  model<ProjectDocument>("Project", ProjectSchema)) as mongoose.Model<ProjectDocument>;

export default Project;
