import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import mongoose from 'mongoose';
import crypto from 'crypto';
import Audit from '@/models/Audit';
import { handleApiError, ApiError, ErrorType } from '@/lib/error-handler';
import config from '@/config';

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) return;
  await mongoose.connect(process.env.MONGODB_URI!);
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST' && req.method !== 'DELETE') {
    return res.status(405).json({
      success: false,
      error: 'METHOD_NOT_ALLOWED',
      message: 'Only POST and DELETE methods are allowed',
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

    const audit = await Audit.findById(auditId).lean();
    if (!audit) {
      throw new ApiError(ErrorType.NOT_FOUND, 'Audit not found');
    }

    if (audit.userId.toString() !== session.user.id) {
      throw new ApiError(ErrorType.AUTHORIZATION, 'Access denied');
    }

    if (audit.status !== 'completed') {
      throw new ApiError(ErrorType.VALIDATION, 'Only completed audits can be shared');
    }

    if (req.method === 'DELETE') {
      await Audit.findByIdAndUpdate(auditId, {
        $set: { shareToken: null, sharedAt: null },
      });
      return res.status(200).json({ success: true, data: { shared: false } });
    }

    // POST — generate or return existing token
    if (audit.shareToken) {
      const shareUrl = `${config.siteUrl}/share/${audit.shareToken}`;
      return res.status(200).json({
        success: true,
        data: { shareToken: audit.shareToken, shareUrl },
      });
    }

    const token = crypto.randomBytes(32).toString('hex');
    await Audit.findByIdAndUpdate(auditId, {
      $set: { shareToken: token, sharedAt: new Date() },
    });

    const shareUrl = `${config.siteUrl}/share/${token}`;
    return res.status(201).json({
      success: true,
      data: { shareToken: token, shareUrl },
    });
  } catch (error) {
    return handleApiError(error, res);
  }
}
