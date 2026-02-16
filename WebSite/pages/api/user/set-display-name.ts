import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import mongoose from 'mongoose';
import User from '@/models/User';
import { handleApiError, ApiError, ErrorType } from '@/lib/error-handler';
import { z } from 'zod';
import { handleZodError } from '@/lib/validation/helpers';

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) return;
  await mongoose.connect(process.env.MONGODB_URI!);
};

const SetDisplayNameSchema = z.object({
  displayName: z.string().trim().min(1).max(50),
});

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

    const result = SetDisplayNameSchema.safeParse(req.body);
    if (!result.success) {
      return handleZodError(result.error, res);
    }

    const { displayName } = result.data;

    await connectDB();

    const user = await User.findByIdAndUpdate(
      session.user.id,
      { displayName },
      { new: true, runValidators: true }
    );

    if (!user) {
      throw new ApiError(ErrorType.NOT_FOUND, 'User not found');
    }

    return res.status(200).json({
      success: true,
      data: { displayName: user.displayName },
    });
  } catch (error) {
    return handleApiError(error, res);
  }
}
