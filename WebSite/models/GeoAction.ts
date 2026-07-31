import mongoose from "mongoose";
import { Schema, models, model } from "mongoose";
import type { LLMId } from "@/lib/monitoring/types";

/**
 * A GEO action the user has taken (published a deliverable, earned a mention,
 * shipped a page...) whose impact we want to measure over time.
 *
 * At creation we snapshot the current scores as a `baseline`. After a later run
 * the user "measures" the action: we snapshot the current scores as `after` and
 * compute per-engine / global deltas. This turns SYB from a static audit into a
 * continuous improvement loop (does an action actually move the score?).
 *
 * Note: the delta is a measured *correlation*, not a proven causation. Other
 * factors move between runs; the UI states this explicitly.
 */

export type GeoActionKind =
  | "answer_page"
  | "forum_reply"
  | "llms_txt"
  | "faq_jsonld"
  | "org_jsonld"
  | "source_outreach"
  | "custom";

export type GeoActionStatus = "published" | "measured";

/** Per-engine presence rate at a point in time. */
export interface EngineRate {
  llm: LLMId;
  presenceRate: number;
}

/** A snapshot of a project's visibility at a given moment. */
export interface ScoreSnapshot {
  week: string;
  globalScore: number;
  engines: EngineRate[];
  /** For a target prompt: how many configured engines cited the brand. */
  promptEnginesCiting?: number | null;
  promptEnginesTotal?: number | null;
  capturedAt: Date;
}

export interface GeoActionDocument extends mongoose.Document {
  projectId: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  kind: GeoActionKind;
  title: string;
  /** Target query this action aims to win, if any. */
  prompt?: string | null;
  /** URL where the deliverable was published, if any. */
  publishedUrl?: string | null;
  status: GeoActionStatus;
  baseline: ScoreSnapshot;
  after?: ScoreSnapshot | null;
  createdAt: Date;
  measuredAt?: Date | null;
  updatedAt: Date;
}

const EngineRateSchema = new Schema<EngineRate>(
  {
    llm: {
      type: String,
      enum: ["chatgpt", "claude", "perplexity", "gemini", "aio"],
      required: true,
    },
    presenceRate: { type: Number, min: 0, max: 100, required: true },
  },
  { _id: false },
);

const SnapshotSchema = new Schema<ScoreSnapshot>(
  {
    week: { type: String, required: true },
    globalScore: { type: Number, min: 0, max: 100, required: true },
    engines: { type: [EngineRateSchema], default: [] },
    promptEnginesCiting: { type: Number, default: null },
    promptEnginesTotal: { type: Number, default: null },
    capturedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const GeoActionSchema = new Schema<GeoActionDocument>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true, index: true },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    kind: {
      type: String,
      enum: [
        "answer_page",
        "forum_reply",
        "llms_txt",
        "faq_jsonld",
        "org_jsonld",
        "source_outreach",
        "custom",
      ],
      required: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    prompt: { type: String, default: null, maxlength: 500 },
    publishedUrl: { type: String, default: null, maxlength: 500 },
    status: {
      type: String,
      enum: ["published", "measured"],
      default: "published",
    },
    baseline: { type: SnapshotSchema, required: true },
    after: { type: SnapshotSchema, default: null },
    measuredAt: { type: Date, default: null },
  },
  { timestamps: true, collection: "geoactions" },
);

GeoActionSchema.index({ projectId: 1, createdAt: -1 });

const GeoAction = (models?.GeoAction ||
  model<GeoActionDocument>("GeoAction", GeoActionSchema)) as mongoose.Model<GeoActionDocument>;

export default GeoAction;
