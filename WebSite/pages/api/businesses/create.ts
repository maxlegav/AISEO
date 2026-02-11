import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import mongoose from 'mongoose';
import Business from '@/models/Business';
import { handleApiError, ApiError, ErrorType } from '@/lib/error-handler';
import { CreateBusinessSchema } from '@/lib/validation/business';
import { handleZodError } from '@/lib/validation/helpers';
import { canCreateProject, getCompetitorLimit } from '@/lib/subscription-limits';
import User from '@/models/User';

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
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.id) {
      throw new ApiError(ErrorType.AUTHENTICATION, 'You must be logged in');
    }

    const result = CreateBusinessSchema.safeParse(req.body);
    if (!result.success) {
      return handleZodError(result.error, res);
    }

    await connectDB();

    // Check tier limits
    const check = await canCreateProject(session.user.id);
    if (!check.allowed) {
      throw new ApiError(ErrorType.AUTHORIZATION, check.reason);
    }

    // Check competitor limit
    const user = await User.findById(session.user.id);
    const competitorLimit = getCompetitorLimit(user!.subscriptionTier as any);
    if (result.data.competitorUrls.length > competitorLimit) {
      throw new ApiError(
        ErrorType.VALIDATION,
        `Your plan allows a maximum of ${competitorLimit} competitor URL(s)`
      );
    }

    // Create business (slug auto-generated from name via pre-validate hook)
    const business = new Business({
      ...result.data,
      userId: session.user.id,
    });

    // Handle slug collision by appending a number
    let saved = false;
    let attempt = 0;
    const originalSlug = business.slug;
    while (!saved) {
      try {
        await business.save();
        saved = true;
      } catch (err: any) {
        if (err.code === 11000 && attempt < 10) {
          attempt++;
          business.slug = `${originalSlug}-${attempt}`;
        } else {
          throw err;
        }
      }
    }

    return res.status(201).json({
      success: true,
      data: business,
    });
  } catch (error) {
    return handleApiError(error, res);
  }
}
