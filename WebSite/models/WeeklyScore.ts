import mongoose from "mongoose";
import { Schema, models, model } from "mongoose";
import type { LLMId } from "@/lib/monitoring/types";

/**
 * Aggregated visibility score for a project, per engine (or "global"), per week.
 * One document per (project × scope × week). Powers the historical chart.
 */
export interface WeeklyScoreDocument extends mongoose.Document {
  projectId: mongoose.Types.ObjectId;
  /** An LLM id, or "global" for the aggregated score across engines. */
  scope: LLMId | "global";
  week: string;
  presenceRate: number;
  avgPosition: number | null;
  deltaVsLastWeek: number;
  createdAt: Date;
  updatedAt: Date;
}

const WeeklyScoreSchema = new Schema<WeeklyScoreDocument>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true, index: true },
    scope: {
      type: String,
      enum: ["chatgpt", "claude", "perplexity", "gemini", "global"],
      required: true,
    },
    week: { type: String, required: true },
    presenceRate: { type: Number, min: 0, max: 100, default: 0 },
    avgPosition: { type: Number, default: null },
    deltaVsLastWeek: { type: Number, default: 0 },
  },
  { timestamps: true, collection: "weeklyscores" },
);

// One score per project/scope/week — upserted on each run.
WeeklyScoreSchema.index({ projectId: 1, scope: 1, week: 1 }, { unique: true });

const WeeklyScore = (models?.WeeklyScore ||
  model<WeeklyScoreDocument>("WeeklyScore", WeeklyScoreSchema)) as mongoose.Model<WeeklyScoreDocument>;

export default WeeklyScore;
