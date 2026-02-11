import type { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';
import mongoose from 'mongoose';
import User from '@/models/User';
import { ForgotPasswordSchema } from '@/lib/validation/subscription';
import { handleZodError } from '@/lib/validation/helpers';
import { handleApiError } from '@/lib/error-handler';
import { sendPasswordResetEmail } from '@/lib/email';

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
    const validation = ForgotPasswordSchema.safeParse(req.body);
    if (!validation.success) {
      return handleZodError(validation.error, res);
    }

    const { email } = validation.data;

    await connectDB();

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase(), deletedAt: null });

    // Always return success to prevent email enumeration
    const successResponse = {
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent.',
    };

    if (!user) {
      // Return success even if user not found (security)
      return res.status(200).json(successResponse);
    }

    // Generate secure reset token
    const resetToken = crypto.randomBytes(32).toString('hex');

    // Hash the token for storage (don't store plain token)
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Set token and expiry (1 hour)
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    // Build reset URL with plain token (user receives this)
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;

    // Send email
    const emailResult = await sendPasswordResetEmail(
      user.email,
      user.name,
      resetUrl,
      user.language || 'en'
    );

    if (!emailResult.success) {
      console.error('[Forgot Password] Failed to send email:', emailResult.error);
      // Still return success to prevent enumeration
    }

    return res.status(200).json(successResponse);
  } catch (error) {
    return handleApiError(error, res);
  }
}
