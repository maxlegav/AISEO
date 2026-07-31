import mongoose from "mongoose";
import { Schema, models, model } from "mongoose";
import type { LLMId } from "@/lib/monitoring/types";

/**
 * A source (URL/domain) an LLM cites on the project's prompts, with whether it
 * mentions the brand. Upserted per (project × llm × url); `citations` counts how
 * many prompts it appeared on in the latest run.
 */
export interface MonitoredSourceDocument extends mongoose.Document {
  projectId: mongoose.Types.ObjectId;
  llm: LLMId;
  url: string;
  domain: string;
  citesBrand: boolean;
  citations: number;
  firstSeenAt: Date;
  lastSeenAt: Date;
}

const MonitoredSourceSchema = new Schema<MonitoredSourceDocument>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true, index: true },
    llm: {
      type: String,
      enum: ["chatgpt", "claude", "perplexity", "gemini", "aio"],
      required: true,
    },
    url: { type: String, required: true },
    domain: { type: String, required: true, index: true },
    citesBrand: { type: Boolean, default: false },
    citations: { type: Number, default: 1 },
    firstSeenAt: { type: Date, default: Date.now },
    lastSeenAt: { type: Date, default: Date.now },
  },
  { timestamps: false, collection: "monitoredsources" },
);

MonitoredSourceSchema.index({ projectId: 1, llm: 1, url: 1 }, { unique: true });

const MonitoredSource = (models?.MonitoredSource ||
  model<MonitoredSourceDocument>(
    "MonitoredSource",
    MonitoredSourceSchema,
  )) as mongoose.Model<MonitoredSourceDocument>;

export default MonitoredSource;
