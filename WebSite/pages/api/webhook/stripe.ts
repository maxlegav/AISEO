import type { NextApiRequest, NextApiResponse } from 'next';
import { buffer } from 'micro';
import Stripe from 'stripe';
import mongoose from 'mongoose';
import User from '@/models/User';
import Subscription from '@/models/Subscription';
import WebhookEvent from '@/models/WebhookEvent';
import { sendSubscriptionConfirmationEmail, sendAuditCreditAvailableEmail } from '@/lib/email';
import { getTierFromPriceId, isMonitoringPriceId } from '@/lib/stripe-tiers';
import type { SubscriptionTier } from '@/lib/subscription-limits';
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

// Get amount from tier (in cents)
const getAmountFromTier = (tier: string): number => {
  switch (tier) {
    case 'data': return appConfig.stripe.data.price * 100;
    case 'starter': return appConfig.stripe.starter.price * 100;
    case 'pro': return appConfig.stripe.pro.price * 100;
    case 'agency': return appConfig.stripe.agency.price * 100;
    default: return 0;
  }
};

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  await connectDB();

  const userId = session.metadata?.userId;
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

  // Handle one-shot purchase (Data, Starter, or Agency Extra Audit).
  // Resolve the tier from the *actual* line item price, not from session
  // metadata, so we can never be tricked by a metadata override (C2).
  if (session.mode === 'payment') {
    const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 1 });
    const oneShotPriceId = lineItems.data[0]?.price?.id;
    if (!oneShotPriceId) {
      console.error('[Stripe Webhook] No line item price on one-shot session', session.id);
      return;
    }

    // Agency Extra Audit grants a credit but does not change the user's tier.
    const isAgencyExtra = oneShotPriceId === appConfig.stripe.agencyExtraAudit.priceId;
    const purchaseTier: 'data' | 'starter' | 'agency' = isAgencyExtra
      ? 'agency'
      : getTierFromPriceId(oneShotPriceId) as 'data' | 'starter';

    // Add audit credit and update subscription tier
    user.auditCredits = (user.auditCredits || 0) + 1;
    user.stripeCustomerId = customerId;
    if (!isAgencyExtra) {
      user.subscriptionTier = purchaseTier;
      user.subscriptionStatus = 'active';
    }
    await user.save();

    // Create purchase record for one-shot audit. Note: we store the
    // payment_intent in its own dedicated field, NOT in stripeSubscriptionId
    // (which is reserved for recurring sub_xxx ids; see review C4).
    await Subscription.create({
      userId: user._id,
      stripePaymentIntentId: session.payment_intent as string,
      stripeCustomerId: customerId,
      stripePriceId: oneShotPriceId,
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
  if (!priceId) {
    console.error('[Stripe Webhook] No priceId on subscription', subscriptionId);
    return;
  }
  const subscriptionTier: SubscriptionTier = getTierFromPriceId(priceId);

  // Update user
  user.stripeCustomerId = customerId;
  user.subscriptionId = subscriptionId;
  user.subscriptionTier = subscriptionTier;
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
  if (!priceId) {
    console.error('[Stripe Webhook] No priceId on subscription update', subscription.id);
    return;
  }
  const tier: SubscriptionTier = getTierFromPriceId(priceId);

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
  user.subscriptionTier = tier;
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

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  // Only handle subscription renewals (not initial checkout, which is handled by checkout.session.completed)
  if (invoice.billing_reason !== 'subscription_cycle') return;

  // Audit credits are a *legacy* one-shot-audit perk. Recurring monitoring
  // plans (SYB v2) do not grant audit credits, so skip renewals whose price is
  // a monitoring plan even though it shares the pro/agency tier name.
  const renewedPriceId = invoice.lines.data[0]?.price?.id;
  if (renewedPriceId && isMonitoringPriceId(renewedPriceId)) {
    console.log('[Stripe Webhook] Monitoring renewal: no audit credit granted');
    return;
  }

  await connectDB();

  const customerId = invoice.customer as string;
  const user = await User.findOne({ stripeCustomerId: customerId });
  if (!user) return;

  // Only credit Pro/Agency subscriptions
  const tier = user.subscriptionTier;
  if (tier !== 'pro' && tier !== 'agency') return;

  // Add 1 audit credit on renewal
  const creditsToAdd = tier === 'agency' ? appConfig.stripe.agency.auditsPerMonth : 1;
  user.auditCredits = (user.auditCredits || 0) + creditsToAdd;
  await user.save();

  // Send "your credit is available" email
  sendAuditCreditAvailableEmail({
    email: user.email,
    userName: user.name,
    language: user.language || 'fr',
  }).catch((err: Error) => {
    console.error('[Stripe Webhook] Failed to send credit available email:', err.message);
  });

  console.log(`[Stripe Webhook] Monthly credit added for user ${user._id} (${tier}): +${creditsToAdd}`);
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

    // Idempotency guard (review C3): refuse to process the same event.id twice.
    // Stripe retries deliveries, so handlers MUST be idempotent. We claim the
    // event by inserting a row keyed on event.id; the unique index makes this
    // race-safe. If processing fails we delete the row so the next retry can
    // run again. If processing succeeds we leave the row in place forever.
    await connectDB();
    try {
      await WebhookEvent.create({ eventId: event.id, type: event.type });
    } catch (err: any) {
      if (err && err.code === 11000) {
        console.log('[Stripe Webhook] Duplicate event ignored:', event.id, event.type);
        return res.status(200).json({ received: true, duplicate: true });
      }
      throw err;
    }

    try {
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
          await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
          break;

        case 'invoice.payment_failed':
          await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
          break;

        default:
          console.log('[Stripe Webhook] Unhandled event type:', event.type);
      }
    } catch (handlerError) {
      // Roll back the idempotency claim so Stripe's retry can re-process.
      await WebhookEvent.deleteOne({ eventId: event.id }).catch((delErr) => {
        console.error('[Stripe Webhook] Failed to release idempotency lock for', event.id, delErr);
      });
      throw handlerError;
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Stripe Webhook] Error:', errorMessage);
    return res.status(500).json({ error: errorMessage });
  }
}
