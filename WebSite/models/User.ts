import mongoose from "mongoose";
import { Schema, models, model } from "mongoose";
import bcrypt from "bcrypt";

export interface UserDocument extends mongoose.Document {
  name: string;
  displayName?: string;
  username?: string;
  company?: string;
  email: string;
  password?: string;
  image?: string;
  emailVerified?: Date;

  // Stripe Integration
  stripeCustomerId?: string;

  // Subscription Status
  subscriptionTier: 'none' | 'data' | 'starter' | 'solo' | 'pro' | 'agency';
  subscriptionStatus: 'active' | 'cancelled' | 'past_due' | 'trialing' | 'inactive';
  subscriptionId?: string;
  subscriptionEndDate?: Date;

  // One-shot Credits
  auditCredits: number;

  // Language Preference
  language: 'en' | 'fr';

  // Password Reset
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;

  // Onboarding Data
  onboardingDomain?: string;
  onboardingActivity?: string;
  onboardingSeoExperience?: 'beginner' | 'intermediate' | 'expert';
  onboardingReferral?: string;

  // Agency white-label branding (SYB v2). Applied to client-facing reports on
  // the Agence plan. Persisted for any plan, but only *active* on Agence.
  branding?: {
    agencyName?: string;
    logoUrl?: string;
    primaryColor?: string;
    customDomain?: string;
    brandedPdfEnabled?: boolean;
  };

  // Account Deletion (soft delete for GDPR)
  deletedAt?: Date;
  deletionRequestedAt?: Date;

  createdAt: Date;
  updatedAt: Date;

  // Methods
  comparePassword(candidatePassword: string): Promise<boolean>;

  // Virtuals
  hasActiveSubscription: boolean;
}

const UserSchema = new Schema<UserDocument>(
  {
    name: { type: String, required: true },
    displayName: { type: String, trim: true, maxlength: 50 },
    username: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
      match: /^[a-z0-9_-]+$/,
    },
    company: { type: String },
    email: { type: String, required: true, unique: true },
    password: { type: String },
    image: { type: String },
    emailVerified: { type: Date },

    // Stripe Integration
    stripeCustomerId: { type: String, sparse: true },

    // Subscription Status
    subscriptionTier: {
      type: String,
      enum: ['none', 'data', 'starter', 'solo', 'pro', 'agency'],
      default: 'none'
    },
    subscriptionStatus: {
      type: String,
      enum: ['active', 'cancelled', 'past_due', 'trialing', 'inactive'],
      default: 'inactive'
    },
    subscriptionId: { type: String },
    subscriptionEndDate: { type: Date },

    // One-shot Credits
    auditCredits: { type: Number, default: 0 },

    // Language Preference
    language: {
      type: String,
      enum: ['en', 'fr'],
      default: 'en'
    },

    // Password Reset
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },

    // Onboarding Data
    onboardingDomain: { type: String },
    onboardingActivity: { type: String },
    onboardingSeoExperience: {
      type: String,
      enum: ['beginner', 'intermediate', 'expert'],
    },
    onboardingReferral: { type: String },

    // Agency white-label branding (SYB v2)
    branding: {
      agencyName: { type: String, trim: true, maxlength: 80 },
      logoUrl: { type: String, trim: true, maxlength: 500 },
      primaryColor: { type: String, trim: true, maxlength: 9 },
      customDomain: { type: String, trim: true, maxlength: 200 },
      brandedPdfEnabled: { type: Boolean, default: false },
    },

    // Account Deletion (soft delete for GDPR)
    deletedAt: { type: Date, default: null },
    deletionRequestedAt: { type: Date },

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Hash password before saving to database
UserSchema.pre("save", async function (next) {
  const user = this;

  // Only hash the password if it's modified (or new)
  if (!user.isModified("password") || !user.password) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
    next();
  } catch (error: any) {
    return next(error);
  }
});

// Compare password method
UserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  if (!this.password) return false;

  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    return false;
  }
};

// Virtual for hasActiveSubscription
UserSchema.virtual('hasActiveSubscription').get(function (this: UserDocument) {
  // User has audit credits
  if (this.auditCredits > 0) return true;

  // User has no active subscription
  if (this.subscriptionStatus !== 'active') return false;

  // Subscription has expired
  if (this.subscriptionEndDate && new Date() > this.subscriptionEndDate) return false;

  return true;
});

// Ensure virtuals are included in JSON/Object output
UserSchema.set('toJSON', { virtuals: true });
UserSchema.set('toObject', { virtuals: true });

// Indexes
UserSchema.index({ stripeCustomerId: 1 }, { sparse: true });
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ username: 1 }, { unique: true, sparse: true });
UserSchema.index({ resetPasswordToken: 1 }, { sparse: true });

const User = (models?.User || model<UserDocument>("User", UserSchema)) as mongoose.Model<UserDocument>;
export default User;
