import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth/[...nextauth]';
import Stripe from 'stripe';
import mongoose from 'mongoose';
import User from '@/models/User';
import { CheckoutSchema } from '@/lib/validation/subscription';
import { handleZodError } from '@/lib/validation/helpers';
import { handleApiError, ApiError, ErrorType } from '@/lib/error-handler';
import {
  getTierFromPriceId,
  expectedModeForPriceId,
} from '@/lib/stripe-tiers';

// Initialize Stripe.
// The stripe SDK pins its types to '2023-08-16', but Stripe accounts created
// after the Managed Payments rollout (default-on) reject Checkout Session
// creation on that version: it requires '2025-03-31.basil' or newer. We only
// need the newer version for creating the session here; the webhook keeps
// reading subscriptions with the classic shape (current_period_end, etc.).
const STRIPE_API_VERSION = '2025-03-31.basil' as unknown as Stripe.LatestApiVersion;
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: STRIPE_API_VERSION,
});

// Connect to MongoDB
const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) return;
  await mongoose.connect(process.env.MONGODB_URI!);
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'METHOD_NOT_ALLOWED',
      message: 'Only POST method is allowed',
    });
  }

  try {
    // Check authentication
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.id) {
      throw new ApiError(ErrorType.AUTHENTICATION, 'You must be logged in to checkout');
    }

    // Validate request body
    const validation = CheckoutSchema.safeParse(req.body);
    if (!validation.success) {
      return handleZodError(validation.error, res);
    }

    const { priceId, mode } = validation.data;

    // Whitelist the priceId against our configured tiers (monitoring + legacy)
    // and reject any request whose mode does not match the price's expected
    // billing mode. This prevents an authenticated attacker from substituting a
    // cheaper (or arbitrary) Stripe price and getting a higher tier for the
    // wrong amount. See review finding C2.
    let tier: string;
    try {
      tier = getTierFromPriceId(priceId);
    } catch {
      throw new ApiError(ErrorType.VALIDATION, 'Invalid price ID');
    }
    const expectedMode = expectedModeForPriceId(priceId);
    if (mode !== expectedMode) {
      throw new ApiError(
        ErrorType.VALIDATION,
        `Tier "${tier}" requires mode "${expectedMode}"`
      );
    }

    // Connect to DB and get user
    await connectDB();
    const user = await User.findById(session.user.id);
    if (!user) {
      throw new ApiError(ErrorType.NOT_FOUND, 'User not found');
    }

    // Get or create Stripe customer
    let stripeCustomerId = user.stripeCustomerId;
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: {
          userId: user._id.toString(),
        },
      });
      stripeCustomerId = customer.id;

      // Save Stripe customer ID to user
      user.stripeCustomerId = stripeCustomerId;
      await user.save();
    }

    // Build checkout session parameters
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      customer: stripeCustomerId,
      mode: mode as 'subscription' | 'payment',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/checkout/cancel`,
      metadata: {
        userId: user._id.toString(),
        tier,
      },
      allow_promotion_codes: true,
    };

    // Add subscription-specific data
    if (mode === 'subscription') {
      sessionParams.subscription_data = {
        metadata: {
          userId: user._id.toString(),
          tier,
        },
      };
    } else {
      // For one-time payments
      sessionParams.payment_intent_data = {
        metadata: {
          userId: user._id.toString(),
          tier,
        },
      };
    }

    // Create Stripe Checkout session
    const checkoutSession = await stripe.checkout.sessions.create(sessionParams);

    return res.status(200).json({
      success: true,
      data: {
        sessionId: checkoutSession.id,
        url: checkoutSession.url,
      },
    });
  } catch (error) {
    return handleApiError(error, res);
  }
}
