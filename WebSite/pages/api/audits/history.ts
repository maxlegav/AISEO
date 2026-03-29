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
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'METHOD_NOT_ALLOWED' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.id) {
      throw new ApiError(ErrorType.AUTHENTICATION, 'You must be logged in');
    }

    // Pro/Agency only
    const tier = session.user.subscriptionTier;
    if (tier !== 'pro' && tier !== 'agency') {
      return res.status(403).json({
        success: false,
        error: 'FORBIDDEN',
        message: 'Audit history requires a Pro or Agency plan',
      });
    }

    const { businessId } = req.query;
    if (!businessId || typeof businessId !== 'string') {
      throw new ApiError(ErrorType.VALIDATION, 'businessId is required');
    }
    if (!mongoose.Types.ObjectId.isValid(businessId)) {
      throw new ApiError(ErrorType.VALIDATION, 'Invalid businessId format');
    }

    await connectDB();

    const audits = await Audit.find({
      userId: session.user.id,
      businessId: new mongoose.Types.ObjectId(businessId),
      status: 'completed',
    })
      .sort({ createdAt: -1 })
      .limit(12)
      .select('_id geoScore createdAt completedAt results previousAuditId issueChecklist')
      .lean();

    // Strip heavy sub-arrays from results to keep response lean
    const lightweight = audits.map((audit) => {
      const r = audit.results as Record<string, unknown> | null;
      let slim: Record<string, unknown> | null = null;
      if (r) {
        // Keep only summary fields, drop large arrays
        const { promptResults: _pr, htmlScan: _hs, competitorResults: _cr, ...rest } = r;
        slim = rest;
      }
      return {
        _id: audit._id,
        geoScore: audit.geoScore,
        createdAt: audit.createdAt,
        completedAt: audit.completedAt,
        previousAuditId: audit.previousAuditId,
        issueChecklist: audit.issueChecklist ?? [],
        results: slim,
      };
    });

    return res.status(200).json({ success: true, data: lightweight });
  } catch (error) {
    return handleApiError(error, res);
  }
}
