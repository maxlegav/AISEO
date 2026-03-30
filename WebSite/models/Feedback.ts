import mongoose from "mongoose";
import { Schema, models, model } from "mongoose";

export interface FeedbackDocument extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  type: "bug" | "feature" | "improvement" | "other";
  title: string;
  description: string;
  status: "new" | "reviewed" | "planned" | "completed" | "declined";
  createdAt: Date;
  updatedAt: Date;
}

const FeedbackSchema = new Schema<FeedbackDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: {
      type: String,
      enum: ["bug", "feature", "improvement", "other"],
      required: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, required: true, trim: true, maxlength: 2000 },
    status: {
      type: String,
      enum: ["new", "reviewed", "planned", "completed", "declined"],
      default: "new",
    },
  },
  { timestamps: true }
);

FeedbackSchema.index({ userId: 1, createdAt: -1 });

const Feedback =
  (models?.Feedback ||
    model<FeedbackDocument>("Feedback", FeedbackSchema)) as mongoose.Model<FeedbackDocument>;
export default Feedback;
