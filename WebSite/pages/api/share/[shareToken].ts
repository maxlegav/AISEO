import type { NextApiRequest, NextApiResponse } from 'next';
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
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'METHOD_NOT_ALLOWED',
      message: 'Only GET method is allowed',
    });
  }

  try {
    const { shareToken } = req.query;
    if (!shareToken || typeof shareToken !== 'string') {
      throw new ApiError(ErrorType.VALIDATION, 'Invalid share token');
    }

    await connectDB();

    const audit = await Audit.findOne({ shareToken, status: 'completed' })
      .select('-userId -businessId -reviewedBy -questionsEditedBy')
      .lean();

    if (!audit) {
      throw new ApiError(ErrorType.NOT_FOUND, 'Shared audit not found or no longer available');
    }

    return res.status(200).json({ success: true, data: audit });
  } catch (error) {
    return handleApiError(error, res);
  }
}
