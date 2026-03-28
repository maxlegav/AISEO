import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import Stripe from 'stripe';
import mongoose from 'mongoose';
import User from '@/models/User';
import { handleApiError, ApiError, ErrorType } from '@/lib/error-handler';
import config from '@/config';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-08-16',
});

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) return;
  await mongoose.connect(process.env.MONGODB_URI!);
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
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
      throw new ApiError(ErrorType.AUTHENTICATION, 'You must be logged in');
    }

    const { priceId } = req.body;
    if (!priceId || typeof priceId !== 'string') {
      throw new ApiError(ErrorType.VALIDATION, 'Price ID is required');
    }

    // Validate priceId is one of our known prices
    const validPriceIds = [
      config.stripe.data.priceId,
      config.stripe.starter.priceId,
      config.stripe.agencyExtraAudit.priceId,
    ];
    if (!validPriceIds.includes(priceId)) {
      throw new ApiError(ErrorType.VALIDATION, 'Invalid price ID');
    }

    // Connect to DB and verify user exists
    await connectDB();
    const user = await User.findById(session.user.id);
    if (!user) {
      throw new ApiError(ErrorType.NOT_FOUND, 'User account not found');
    }

    // Determine tier from priceId
    const tier = priceId === config.stripe.data.priceId
      ? 'data'
      : priceId === config.stripe.agencyExtraAudit.priceId
        ? 'agency'
        : 'starter';

    // Get or create Stripe customer
    let stripeCustomerId = user.stripeCustomerId;
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: { userId: user._id.toString() },
      });
      stripeCustomerId = customer.id;
      user.stripeCustomerId = stripeCustomerId;
      await user.save();
    }

    // Create checkout session with different success URL
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

    const checkoutSession = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: 'payment',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${baseUrl}/checkout/audit-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/settings#subscription`,
      metadata: {
        userId: user._id.toString(),
        tier,
      },
      payment_intent_data: {
        metadata: {
          userId: user._id.toString(),
          tier,
        },
      },
      allow_promotion_codes: true,
    });

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
