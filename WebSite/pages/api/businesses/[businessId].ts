import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import mongoose from 'mongoose';
import Business from '@/models/Business';
import User from '@/models/User';
import { handleApiError, ApiError, ErrorType } from '@/lib/error-handler';
import { UpdateBusinessSchema } from '@/lib/validation/business';
import { handleZodError } from '@/lib/validation/helpers';
import { getCompetitorLimit } from '@/lib/subscription-limits';

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) return;
  await mongoose.connect(process.env.MONGODB_URI!);
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { businessId } = req.query;

  if (!businessId || typeof businessId !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'VALIDATION_ERROR',
      message: 'Business ID is required',
    });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.id) {
      throw new ApiError(ErrorType.AUTHENTICATION, 'You must be logged in');
    }

    await connectDB();

    // GET - Get business detail
    if (req.method === 'GET') {
      const business = await Business.findOne({
        _id: businessId,
        userId: session.user.id,
        deletedAt: null,
      });

      if (!business) {
        throw new ApiError(ErrorType.NOT_FOUND, 'Project not found');
      }

      return res.status(200).json({
        success: true,
        data: business,
      });
    }

    // PATCH - Update business
    if (req.method === 'PATCH') {
      const result = UpdateBusinessSchema.safeParse(req.body);
      if (!result.success) {
        return handleZodError(result.error, res);
      }

      // Check competitor limit if updating competitors
      if (result.data.competitorUrls) {
        const user = await User.findById(session.user.id);
        const competitorLimit = getCompetitorLimit(user!.subscriptionTier as any);
        if (result.data.competitorUrls.length > competitorLimit) {
          throw new ApiError(
            ErrorType.VALIDATION,
            `Your plan allows a maximum of ${competitorLimit} competitor URL(s)`
          );
        }
      }

      const business = await Business.findOneAndUpdate(
        { _id: businessId, userId: session.user.id, deletedAt: null },
        { $set: result.data },
        { new: true, runValidators: true }
      );

      if (!business) {
        throw new ApiError(ErrorType.NOT_FOUND, 'Project not found');
      }

      return res.status(200).json({
        success: true,
        data: business,
      });
    }

    // DELETE - Soft delete business
    if (req.method === 'DELETE') {
      const business = await Business.findOneAndUpdate(
        { _id: businessId, userId: session.user.id, deletedAt: null },
        { $set: { deletedAt: new Date() } },
        { new: true }
      );

      if (!business) {
        throw new ApiError(ErrorType.NOT_FOUND, 'Project not found');
      }

      return res.status(200).json({
        success: true,
        message: 'Project deleted',
      });
    }

    return res.status(405).json({
      success: false,
      error: 'METHOD_NOT_ALLOWED',
      message: 'Method not allowed',
    });
  } catch (error) {
    return handleApiError(error, res);
  }
}
