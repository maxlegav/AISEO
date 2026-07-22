import mongoose from "mongoose";
import { Schema, models, model } from "mongoose";

export type MembershipRole = "owner" | "admin" | "member";
export type MembershipStatus = "active" | "invited";

/**
 * Links a user to an Organization with a role (SYB v2 multi-tenant). An invite
 * is a Membership with `status: "invited"` and no `userId` yet: it carries the
 * invited `email` and an `inviteToken`. Accepting the invite attaches `userId`
 * and flips the status to `active`.
 */
export interface MembershipDocument extends mongoose.Document {
  organizationId: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId | null;
  email: string;
  role: MembershipRole;
  status: MembershipStatus;
  inviteToken?: string | null;
  invitedByUserId?: mongoose.Types.ObjectId | null;
  invitedAt?: Date | null;
  acceptedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const MembershipSchema = new Schema<MembershipDocument>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    userId: { type: Schema.Types.ObjectId, ref: "User", default: null, index: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    role: {
      type: String,
      enum: ["owner", "admin", "member"],
      default: "member",
    },
    status: {
      type: String,
      enum: ["active", "invited"],
      default: "invited",
    },
    inviteToken: { type: String, default: null, index: true, sparse: true },
    invitedByUserId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    invitedAt: { type: Date, default: null },
    acceptedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

// One membership per (org, email).
MembershipSchema.index({ organizationId: 1, email: 1 }, { unique: true });

const Membership = (models?.Membership ||
  model<MembershipDocument>(
    "Membership",
    MembershipSchema,
  )) as mongoose.Model<MembershipDocument>;

export default Membership;
