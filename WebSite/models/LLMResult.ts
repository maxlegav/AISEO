import mongoose from "mongoose";
import { Schema, models, model } from "mongoose";
import type { LLMId } from "@/lib/monitoring/types";

/**
 * A single captured LLM answer for a (project × prompt × LLM) during a run.
 * This is the raw evidence the scores and sources are derived from.
 */
export interface LLMResultDocument extends mongoose.Document {
  projectId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  runId: string;
  week: string;
  llm: LLMId;
  prompt: string;
  responseText: string;
  brandMentioned: boolean;
  brandPosition: number | null;
  sourcesCited: string[];
  /** Whether this result came from a real API call or the mock fallback. */
  mock: boolean;
  capturedAt: Date;
}

const LLMResultSchema = new Schema<LLMResultDocument>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    runId: { type: String, required: true, index: true },
    week: { type: String, required: true, index: true },
    llm: {
      type: String,
      enum: ["chatgpt", "claude", "perplexity", "gemini", "aio"],
      required: true,
    },
    prompt: { type: String, required: true },
    responseText: { type: String, default: "" },
    brandMentioned: { type: Boolean, default: false },
    brandPosition: { type: Number, default: null },
    sourcesCited: { type: [String], default: [] },
    mock: { type: Boolean, default: false },
    capturedAt: { type: Date, default: Date.now },
  },
  { timestamps: false, collection: "llmresults" },
);

LLMResultSchema.index({ projectId: 1, week: 1, llm: 1 });
LLMResultSchema.index({ projectId: 1, capturedAt: -1 });

const LLMResult = (models?.LLMResult ||
  model<LLMResultDocument>("LLMResult", LLMResultSchema)) as mongoose.Model<LLMResultDocument>;

export default LLMResult;
