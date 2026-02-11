import type { NextApiRequest, NextApiResponse } from 'next';
import { buffer } from 'micro';
import Stripe from 'stripe';
import mongoose from 'mongoose';
import User from '@/models/User';
import Subscription from '@/models/Subscription';
import { sendSubscriptionConfirmationEmail } from '@/lib/email';
import appConfig from '@/config';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-08-16',
});

// Disable body parser for webhook signature verification
export const config = {
  api: {
    bodyParser: false,
  },
};

// Connect to MongoDB
const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) return;
  await mongoose.connect(process.env.MONGODB_URI!);
};

// Map price IDs to tiers
const getTierFromPriceId = (priceId: string): 'basic' | 'pro' | 'premium' => {
  if (priceId === appConfig.stripe.basic.priceId) return 'basic';
  if (priceId === appConfig.stripe.pro.priceId) return 'pro';
  if (priceId === appConfig.stripe.premium.priceId) return 'premium';
  return 'basic'; // Default fallback
};

// Get amount from tier (in cents)
const getAmountFromTier = (tier: string): number => {
  switch (tier) {
    case 'basic': return appConfig.stripe.basic.price * 100;
    case 'pro': return appConfig.stripe.pro.price * 100;
    case 'premium': return appConfig.stripe.premium.price * 100;
    default: return 0;
  }
};

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  await connectDB();

  const userId = session.metadata?.userId;
  const tier = session.metadata?.tier || 'basic';
  const customerId = session.customer as string;

  if (!userId) {
    console.error('[Stripe Webhook] No userId in session metadata');
    return;
  }

  const user = await User.findById(userId);
  if (!user) {
    console.error('[Stripe Webhook] User not found:', userId);
    return;
  }

  // Handle one-shot purchase (Basic or Pro)
  if (session.mode === 'payment') {
    const purchaseTier = (tier as 'basic' | 'pro') || 'basic';

    // Add audit credit and update subscription tier
    user.auditCredits = (user.auditCredits || 0) + 1;
    user.stripeCustomerId = customerId;
    user.subscriptionTier = purchaseTier;
    user.subscriptionStatus = 'active';
    await user.save();

    // Create purchase record for one-shot audit
    await Subscription.create({
      userId: user._id,
      stripeSubscriptionId: session.payment_intent as string,
      stripeCustomerId: customerId,
      stripePriceId: purchaseTier === 'pro' ? appConfig.stripe.pro.priceId : appConfig.stripe.basic.priceId,
      tier: purchaseTier,
      status: 'active',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year validity
      amount: getAmountFromTier(purchaseTier),
      currency: 'eur',
    });

    // Send confirmation email
    await sendSubscriptionConfirmationEmail(
      user.email,
      user.name,
      purchaseTier,
      getAmountFromTier(purchaseTier),
      'eur',
      user.language || 'en'
    );

    console.log('[Stripe Webhook] One-shot purchase completed for user:', userId, 'tier:', purchaseTier);
    return;
  }

  // Handle subscription
  const subscriptionId = session.subscription as string;
  if (!subscriptionId) {
    console.error('[Stripe Webhook] No subscription ID in session');
    return;
  }

  // Get subscription details from Stripe
  const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId);
  const priceId = stripeSubscription.items.data[0]?.price.id;
  const subscriptionTier = priceId ? getTierFromPriceId(priceId) : tier;

  // Update user
  user.stripeCustomerId = customerId;
  user.subscriptionId = subscriptionId;
  user.subscriptionTier = subscriptionTier as 'none' | 'basic' | 'pro' | 'premium';
  user.subscriptionStatus = 'active';
  user.subscriptionEndDate = new Date(stripeSubscription.current_period_end * 1000);
  await user.save();

  // Create or update subscription record
  await Subscription.findOneAndUpdate(
    { stripeSubscriptionId: subscriptionId },
    {
      userId: user._id,
      stripeSubscriptionId: subscriptionId,
      stripeCustomerId: customerId,
      stripePriceId: priceId,
      tier: subscriptionTier,
      status: 'active',
      currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
      currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
      amount: stripeSubscription.items.data[0]?.price.unit_amount || 0,
      currency: stripeSubscription.currency,
    },
    { upsert: true, new: true }
  );

  // Send confirmation email
  await sendSubscriptionConfirmationEmail(
    user.email,
    user.name,
    subscriptionTier,
    stripeSubscription.items.data[0]?.price.unit_amount || 0,
    stripeSubscription.currency,
    user.language || 'en'
  );

  console.log('[Stripe Webhook] Subscription created for user:', userId, 'tier:', subscriptionTier);
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  await connectDB();

  const customerId = subscription.customer as string;
  const user = await User.findOne({ stripeCustomerId: customerId });

  if (!user) {
    console.error('[Stripe Webhook] User not found for customer:', customerId);
    return;
  }

  const priceId = subscription.items.data[0]?.price.id;
  const tier = priceId ? getTierFromPriceId(priceId) : 'basic';

  // Map Stripe status to our status
  const statusMap: Record<string, 'active' | 'cancelled' | 'past_due' | 'trialing' | 'inactive'> = {
    active: 'active',
    canceled: 'cancelled',
    past_due: 'past_due',
    trialing: 'trialing',
    incomplete: 'inactive',
    incomplete_expired: 'inactive',
    unpaid: 'past_due',
    paused: 'inactive',
  };

  const status = statusMap[subscription.status] || 'inactive';

  // Update user
  user.subscriptionTier = tier as 'none' | 'basic' | 'pro' | 'premium';
  user.subscriptionStatus = status;
  user.subscriptionEndDate = new Date(subscription.current_period_end * 1000);
  await user.save();

  // Update subscription record
  await Subscription.findOneAndUpdate(
    { stripeSubscriptionId: subscription.id },
    {
      tier,
      status: subscription.status === 'canceled' ? 'cancelled' : subscription.status,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      cancelledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : undefined,
    }
  );

  console.log('[Stripe Webhook] Subscription updated for user:', user._id, 'status:', status);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  await connectDB();

  const customerId = subscription.customer as string;
  const user = await User.findOne({ stripeCustomerId: customerId });

  if (!user) {
    console.error('[Stripe Webhook] User not found for customer:', customerId);
    return;
  }

  // Update user
  user.subscriptionStatus = 'cancelled';
  user.subscriptionTier = 'none';
  await user.save();

  // Update subscription record
  await Subscription.findOneAndUpdate(
    { stripeSubscriptionId: subscription.id },
    {
      status: 'cancelled',
      cancelledAt: new Date(),
    }
  );

  console.log('[Stripe Webhook] Subscription deleted for user:', user._id);
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  await connectDB();

  const customerId = invoice.customer as string;
  const user = await User.findOne({ stripeCustomerId: customerId });

  if (!user) {
    console.error('[Stripe Webhook] User not found for customer:', customerId);
    return;
  }

  // Update user status to past_due
  user.subscriptionStatus = 'past_due';
  await user.save();

  console.log('[Stripe Webhook] Payment failed for user:', user._id);
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('[Stripe Webhook] STRIPE_WEBHOOK_SECRET not configured');
    return res.status(500).json({ error: 'Webhook secret not configured' });
  }

  try {
    // Get raw body for signature verification
    const buf = await buffer(req);
    const sig = req.headers['stripe-signature'];

    if (!sig) {
      console.error('[Stripe Webhook] No signature found');
      return res.status(400).json({ error: 'No signature found' });
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('[Stripe Webhook] Signature verification failed:', errorMessage);
      return res.status(400).json({ error: `Webhook signature verification failed: ${errorMessage}` });
    }

    // Handle events
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.payment_succeeded':
        // Log successful payment (receipt is sent by Stripe)
        console.log('[Stripe Webhook] Invoice payment succeeded:', (event.data.object as Stripe.Invoice).id);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        console.log('[Stripe Webhook] Unhandled event type:', event.type);
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Stripe Webhook] Error:', errorMessage);
    return res.status(500).json({ error: errorMessage });
  }
}
