import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './[...nextauth]';
import Stripe from 'stripe';
import mongoose from 'mongoose';
import User from '@/models/User';
import { DeleteAccountSchema } from '@/lib/validation/subscription';
import { handleZodError } from '@/lib/validation/helpers';
import { handleApiError, ApiError, ErrorType } from '@/lib/error-handler';
import { sendAccountDeletionEmail } from '@/lib/email';

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

    // Validate request body
    const validation = DeleteAccountSchema.safeParse(req.body);
    if (!validation.success) {
      return handleZodError(validation.error, res);
    }

    const { password } = validation.data;

    await connectDB();

    // Get user with password
    const user = await User.findById(session.user.id);
    if (!user) {
      throw new ApiError(ErrorType.NOT_FOUND, 'User not found');
    }

    // Check if account is already deleted
    if (user.deletedAt) {
      throw new ApiError(ErrorType.VALIDATION, 'Account is already scheduled for deletion');
    }

    // Verify password (only for credential users)
    if (user.password) {
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        throw new ApiError(ErrorType.VALIDATION, 'Incorrect password');
      }
    }

    // Cancel any active Stripe subscription
    if (user.stripeCustomerId && user.subscriptionId) {
      try {
        await stripe.subscriptions.cancel(user.subscriptionId);
        console.log('[Delete Account] Cancelled Stripe subscription:', user.subscriptionId);
      } catch (stripeError) {
        console.error('[Delete Account] Failed to cancel subscription:', stripeError);
        // Continue with deletion even if Stripe fails
      }
    }

    // Soft delete: set deletion timestamps
    user.deletedAt = new Date();
    user.deletionRequestedAt = new Date();
    user.subscriptionStatus = 'inactive';
    user.subscriptionTier = 'none';
    await user.save();

    // Send confirmation email
    await sendAccountDeletionEmail(
      user.email,
      user.name,
      user.language || 'en'
    );

    return res.status(200).json({
      success: true,
      message: 'Account has been scheduled for deletion. You will be logged out.',
    });
  } catch (error) {
    return handleApiError(error, res);
  }
}
