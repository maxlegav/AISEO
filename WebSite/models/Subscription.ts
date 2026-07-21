import mongoose, { Schema, Document, models, model } from 'mongoose';

export interface ISubscription extends Document {
  userId: mongoose.Types.ObjectId;
  // Set for recurring subscriptions (Pro / Agency).
  stripeSubscriptionId?: string;
  // Set for one-shot purchases (Data / Starter / Agency Extra).
  stripePaymentIntentId?: string;
  stripeCustomerId: string;
  stripePriceId: string;
  tier: 'none' | 'data' | 'starter' | 'solo' | 'pro' | 'agency';
  status: 'active' | 'cancelled' | 'past_due' | 'trialing' | 'incomplete' | 'incomplete_expired';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  cancelledAt?: Date;
  amount: number;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
}

const SubscriptionSchema = new Schema<ISubscription>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    // Recurring-subscription identifier (sub_xxx). Sparse unique so one-shots can omit it.
    stripeSubscriptionId: {
      type: String,
      unique: true,
      sparse: true
    },
    // Payment-intent identifier (pi_xxx) for one-shot purchases. Sparse unique.
    stripePaymentIntentId: {
      type: String,
      unique: true,
      sparse: true
    },
    stripeCustomerId: {
      type: String,
      required: true
    },
    stripePriceId: {
      type: String,
      required: true
    },
    tier: {
      type: String,
      enum: ['none', 'data', 'starter', 'solo', 'pro', 'agency'],
      required: true
    },
    status: {
      type: String,
      enum: ['active', 'cancelled', 'past_due', 'trialing', 'incomplete', 'incomplete_expired'],
      required: true
    },
    currentPeriodStart: {
      type: Date,
      required: true
    },
    currentPeriodEnd: {
      type: Date,
      required: true
    },
    cancelAtPeriodEnd: {
      type: Boolean,
      default: false
    },
    cancelledAt: {
      type: Date
    },
    amount: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      default: 'eur'
    },
  },
  {
    timestamps: true
  }
);

// Compound index for user's active subscription
SubscriptionSchema.index({ userId: 1, status: 1 });

const Subscription = (models?.Subscription || model<ISubscription>('Subscription', SubscriptionSchema)) as mongoose.Model<ISubscription>;
export default Subscription;
