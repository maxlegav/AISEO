import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import mongoose from 'mongoose';
import User from '@/models/User';
import { handleApiError, ApiError, ErrorType } from '@/lib/error-handler';
import { SetUsernameSchema } from '@/lib/validation/business';
import { handleZodError } from '@/lib/validation/helpers';

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) return;
  await mongoose.connect(process.env.MONGODB_URI!);
};

// Reserved usernames that cannot be taken
const RESERVED_USERNAMES = [
  'admin', 'api', 'auth', 'dashboard', 'settings', 'login', 'signup',
  'logout', 'projects', 'checkout', 'webhook', 'cron', 'static',
  'public', 'assets', 'images', 'css', 'js', 'fonts',
  'username-setup', 'forgot-password', 'reset-password',
  'subscription-plans', 'aiseo', 'support', 'help',
];

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

    const result = SetUsernameSchema.safeParse(req.body);
    if (!result.success) {
      return handleZodError(result.error, res);
    }

    const { username } = result.data;

    // Check reserved usernames
    if (RESERVED_USERNAMES.includes(username)) {
      throw new ApiError(ErrorType.CONFLICT, 'This username is not available');
    }

    await connectDB();

    // Check if username is already taken by another user
    const existingUser = await User.findOne({ username, _id: { $ne: session.user.id } });
    if (existingUser) {
      throw new ApiError(ErrorType.CONFLICT, 'This username is already taken');
    }

    // Update user
    const user = await User.findByIdAndUpdate(
      session.user.id,
      { username },
      { new: true, runValidators: true }
    );

    if (!user) {
      throw new ApiError(ErrorType.NOT_FOUND, 'User not found');
    }

    return res.status(200).json({
      success: true,
      data: { username: user.username },
    });
  } catch (error) {
    return handleApiError(error, res);
  }
}
