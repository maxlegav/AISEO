import type { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';
import mongoose from 'mongoose';
import User from '@/models/User';
import { ResetPasswordSchema } from '@/lib/validation/subscription';
import { handleZodError } from '@/lib/validation/helpers';
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
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'METHOD_NOT_ALLOWED',
      message: 'Only POST method is allowed',
    });
  }

  try {
    // Validate request body
    const validation = ResetPasswordSchema.safeParse(req.body);
    if (!validation.success) {
      return handleZodError(validation.error, res);
    }

    const { token, password } = validation.data;

    await connectDB();

    // Hash the provided token to compare with stored hash
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Find user by token and check expiry
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() },
      deletedAt: null,
    });

    if (!user) {
      throw new ApiError(
        ErrorType.VALIDATION,
        'Invalid or expired reset token. Please request a new password reset.'
      );
    }

    // Update password (pre-save hook will hash it)
    user.password = password;

    // Clear reset token fields
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Password has been reset successfully. You can now log in with your new password.',
    });
  } catch (error) {
    return handleApiError(error, res);
  }
}
