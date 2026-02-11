import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import Stripe from 'stripe';
import mongoose from 'mongoose';
import User from '@/models/User';
import { handleApiError, ApiError, ErrorType } from '@/lib/error-handler';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-08-16',
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
      throw new ApiError(ErrorType.AUTHENTICATION, 'You must be logged in');
    }

    // Connect to DB and get user
    await connectDB();
    const user = await User.findById(session.user.id);
    if (!user) {
      throw new ApiError(ErrorType.NOT_FOUND, 'User not found');
    }

    // Check if user has a Stripe customer ID
    if (!user.stripeCustomerId) {
      throw new ApiError(ErrorType.VALIDATION, 'No subscription found. Please subscribe first.');
    }

    // Create Stripe Customer Portal session
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${baseUrl}/dashboard`,
    });

    return res.status(200).json({
      success: true,
      data: {
        url: portalSession.url,
      },
    });
  } catch (error) {
    return handleApiError(error, res);
  }
}
