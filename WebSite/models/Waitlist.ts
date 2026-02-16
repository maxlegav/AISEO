import mongoose from "mongoose";
import { Schema, models, model } from "mongoose";

export interface WaitlistDocument extends mongoose.Document {
  email: string;
  howFound: string;
  hasGeoExperience: string;
  budgetRange: string;
  createdAt: Date;
}

const WaitlistSchema = new Schema<WaitlistDocument>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    howFound: {
      type: String,
      required: true,
    },
    hasGeoExperience: {
      type: String,
      required: true,
    },
    budgetRange: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Waitlist = (models?.Waitlist || model<WaitlistDocument>("Waitlist", WaitlistSchema)) as mongoose.Model<WaitlistDocument>;
export default Waitlist;
