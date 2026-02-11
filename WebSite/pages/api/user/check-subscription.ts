import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import mongoose from 'mongoose';
import User from '@/models/User';
import { handleApiError, ApiError, ErrorType } from '@/lib/error-handler';

// Connect to MongoDB
const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) return;
  await mongoose.connect(process.env.MONGODB_URI!);
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow GET
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'METHOD_NOT_ALLOWED',
      message: 'Only GET method is allowed',
    });
  }

  try {
    // Check authentication
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.id) {
      throw new ApiError(ErrorType.AUTHENTICATION, 'You must be logged in');
    }

    await connectDB();

    // Get user
    const user = await User.findById(session.user.id);
    if (!user) {
      throw new ApiError(ErrorType.NOT_FOUND, 'User not found');
    }

    // Check if account is deleted
    if (user.deletedAt) {
      return res.status(200).json({
        success: true,
        hasActiveSubscription: false,
        reason: 'ACCOUNT_DELETED',
      });
    }

    // Check subscription status
    const hasActiveSubscription = user.hasActiveSubscription;

    return res.status(200).json({
      success: true,
      hasActiveSubscription,
      subscriptionTier: user.subscriptionTier,
      subscriptionStatus: user.subscriptionStatus,
      auditCredits: user.auditCredits,
      subscriptionEndDate: user.subscriptionEndDate,
    });
  } catch (error) {
    return handleApiError(error, res);
  }
}
