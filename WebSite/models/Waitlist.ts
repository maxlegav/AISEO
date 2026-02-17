import mongoose from "mongoose";
import { Schema, models, model } from "mongoose";

export interface WaitlistDocument extends mongoose.Document {
  email: string;
  howFound?: string;
  hasGeoExperience?: string;
  budgetRange?: string;
  completed: boolean;
  emailSent: boolean;
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
    },
    hasGeoExperience: {
      type: String,
    },
    budgetRange: {
      type: String,
    },
    completed: {
      type: Boolean,
      default: false,
    },
    emailSent: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const Waitlist = (models?.Waitlist || model<WaitlistDocument>("Waitlist", WaitlistSchema)) as mongoose.Model<WaitlistDocument>;
export default Waitlist;
