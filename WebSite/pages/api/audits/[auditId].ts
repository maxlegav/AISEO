import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import mongoose from 'mongoose';
import Audit from '@/models/Audit';
import { handleApiError, ApiError, ErrorType } from '@/lib/error-handler';

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) return;
  await mongoose.connect(process.env.MONGODB_URI!);
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET' && req.method !== 'DELETE') {
    return res.status(405).json({
      success: false,
      error: 'METHOD_NOT_ALLOWED',
      message: 'Only GET and DELETE methods are allowed',
    });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.id) {
      throw new ApiError(ErrorType.AUTHENTICATION, 'You must be logged in');
    }

    const { auditId } = req.query;
    if (!auditId || typeof auditId !== 'string') {
      throw new ApiError(ErrorType.VALIDATION, 'Missing auditId');
    }

    await connectDB();

    // Mongoose handles invalid ObjectId format gracefully (returns null)
    const audit = await Audit.findById(auditId).lean();

    if (!audit) {
      throw new ApiError(ErrorType.NOT_FOUND, 'Audit not found');
    }

    // Security: userId is ObjectId — compare via .toString()
    if (audit.userId.toString() !== session.user.id) {
      throw new ApiError(ErrorType.AUTHORIZATION, 'Access denied');
    }

    if (req.method === 'DELETE') {
      await Audit.findByIdAndDelete(auditId);
      return res.status(200).json({ success: true, data: { deleted: true } });
    }

    return res.status(200).json({ success: true, data: audit });
  } catch (error) {
    return handleApiError(error, res);
  }
}
