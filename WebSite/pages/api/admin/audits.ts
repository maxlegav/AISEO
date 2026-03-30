/**
 * GET /api/admin/audits
 * Lists audits awaiting admin review (review_pending).
 * Admin-only (ADMIN_EMAIL env var).
 */
import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import mongoose from 'mongoose';
import Audit from '@/models/Audit';
import User from '@/models/User';
import { handleApiError, ApiError, ErrorType } from '@/lib/error-handler';

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) return;
  await mongoose.connect(process.env.MONGODB_URI!);
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'METHOD_NOT_ALLOWED' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.email) {
      throw new ApiError(ErrorType.AUTHENTICATION, 'You must be logged in');
    }

    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail || session.user.email !== adminEmail) {
      throw new ApiError(ErrorType.AUTHORIZATION, 'Admin access required');
    }

    await connectDB();

    // Fetch all non-completed, non-failed audits for admin review
    const audits = await Audit.find({
      status: { $in: ['pending', 'processing', 'awaiting_prompt_approval', 'review_pending'] },
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    // Enrich with user info
    const userIds = [...new Set(audits.map((a) => a.userId.toString()))];
    const users = await User.find({ _id: { $in: userIds } })
      .select('_id name email username language')
      .lean();

    const userMap = Object.fromEntries(
      users.map((u) => [u._id.toString(), u])
    );

    const enriched = audits.map((a) => ({
      ...a,
      user: userMap[a.userId.toString()] ?? null,
    }));

    return res.status(200).json({ success: true, data: enriched });
  } catch (error) {
    return handleApiError(error, res);
  }
}
