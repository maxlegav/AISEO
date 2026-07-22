import mongoose from "mongoose";
import { Schema, models, model } from "mongoose";
import type { LLMId } from "@/lib/monitoring/types";

/**
 * A prepared outreach request toward a high-authority source that the engines
 * cite on the project's prompts but that never mentions the brand (from the
 * "Sources à conquérir" list). Human-in-the-loop only: the agent prepares a
 * draft; the user reviews, edits and sends it themselves (mailto / copy). No
 * email is ever sent automatically from the app in this version.
 */

export type OutreachStatus = "draft" | "approved" | "rejected" | "sent";

/** How we found the contact email, if any. */
export type ContactSource = "page_contact" | "manual" | null;

export interface OutreachTargetDocument extends mongoose.Document {
  projectId: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  domain: string;
  sampleUrl: string;
  /** Engines that cite this domain on the project's prompts. */
  engines: LLMId[];
  /** How many prompts this source appeared on in the latest run. */
  citations: number;
  /** 0-100 priority heuristic (citations x engines coverage). */
  relevanceScore: number;
  /** Public email found on the site, or null (contact to find manually). */
  contactEmail: string | null;
  contactSource: ContactSource;
  status: OutreachStatus;
  /** Agent-written draft. */
  draftSubject: string;
  draftBody: string;
  /** True when the draft is a deterministic template (no LLM key). */
  mock: boolean;
  provider?: LLMId | null;
  /** User edits, when they changed the draft. */
  editedSubject?: string | null;
  editedBody?: string | null;
  sentAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const OutreachTargetSchema = new Schema<OutreachTargetDocument>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true, index: true },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    domain: { type: String, required: true, trim: true, maxlength: 253 },
    sampleUrl: { type: String, default: "", maxlength: 500 },
    engines: {
      type: [String],
      enum: ["chatgpt", "claude", "perplexity", "gemini"],
      default: [],
    },
    citations: { type: Number, default: 0, min: 0 },
    relevanceScore: { type: Number, default: 0, min: 0, max: 100 },
    contactEmail: { type: String, default: null, maxlength: 320 },
    contactSource: {
      type: String,
      enum: ["page_contact", "manual", null],
      default: null,
    },
    status: {
      type: String,
      enum: ["draft", "approved", "rejected", "sent"],
      default: "draft",
    },
    draftSubject: { type: String, default: "", maxlength: 300 },
    draftBody: { type: String, default: "", maxlength: 5000 },
    mock: { type: Boolean, default: true },
    provider: { type: String, default: null },
    editedSubject: { type: String, default: null, maxlength: 300 },
    editedBody: { type: String, default: null, maxlength: 5000 },
    sentAt: { type: Date, default: null },
  },
  { timestamps: true, collection: "outreachtargets" },
);

// One tracked target per (project, domain).
OutreachTargetSchema.index({ projectId: 1, domain: 1 }, { unique: true });
OutreachTargetSchema.index({ projectId: 1, createdAt: -1 });

const OutreachTarget = (models?.OutreachTarget ||
  model<OutreachTargetDocument>(
    "OutreachTarget",
    OutreachTargetSchema,
  )) as mongoose.Model<OutreachTargetDocument>;

export default OutreachTarget;
