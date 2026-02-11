import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth/[...nextauth]';
import Stripe from 'stripe';
import mongoose from 'mongoose';
import User from '@/models/User';
import { CheckoutSchema } from '@/lib/validation/subscription';
import { handleZodError } from '@/lib/validation/helpers';
import { handleApiError, ApiError, ErrorType } from '@/lib/error-handler';
import config from '@/config';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-08-16',
});

// Connect to MongoDB
const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) return;
  await mongoose.connect(process.env.MONGODB_URI!);
};

// Map price IDs to tiers
const getTierFromPriceId = (priceId: string): string => {
  if (priceId === config.stripe.basic.priceId) return 'basic';
  if (priceId === config.stripe.pro.priceId) return 'pro';
  if (priceId === config.stripe.premium.priceId) return 'premium';
  return 'unknown';
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

    // Get tier from price ID
    const tier = getTierFromPriceId(priceId);

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
