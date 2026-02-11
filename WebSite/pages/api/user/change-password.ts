import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import mongoose from 'mongoose';
import User from '@/models/User';
import { handleApiError, ApiError, ErrorType } from '@/lib/error-handler';
import { ChangePasswordSchema } from '@/lib/validation/business';
import { handleZodError } from '@/lib/validation/helpers';

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

    const result = ChangePasswordSchema.safeParse(req.body);
    if (!result.success) {
      return handleZodError(result.error, res);
    }

    await connectDB();

    const user = await User.findById(session.user.id);
    if (!user) {
      throw new ApiError(ErrorType.NOT_FOUND, 'User not found');
    }

    // User signed up with Google - no password to change
    if (!user.password) {
      throw new ApiError(
        ErrorType.VALIDATION,
        'Cannot change password for accounts using Google sign-in'
      );
    }

    // Verify current password
    const isValid = await user.comparePassword(result.data.currentPassword);
    if (!isValid) {
      throw new ApiError(ErrorType.VALIDATION, 'Current password is incorrect');
    }

    // Update password (bcrypt hashing handled by pre-save hook)
    user.password = result.data.newPassword;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    return handleApiError(error, res);
  }
}
