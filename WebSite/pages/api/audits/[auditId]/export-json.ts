import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
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

    const { auditId } = req.query;
    if (!auditId || typeof auditId !== 'string') {
      throw new ApiError(ErrorType.VALIDATION, 'Missing auditId');
    }

    await connectDB();

    const audit = await Audit.findById(auditId)
      .select('userId businessName results geoScore createdAt completedAt status')
      .lean();

    if (!audit) {
      throw new ApiError(ErrorType.NOT_FOUND, 'Audit not found');
    }
    if (audit.userId.toString() !== session.user.id) {
      throw new ApiError(ErrorType.AUTHORIZATION, 'Access denied');
    }
    if (!audit.results || Object.keys(audit.results as object).length === 0) {
      throw new ApiError(ErrorType.NOT_FOUND, 'No data available for this audit yet');
    }

    const filename = `showyourbrand-audit-${audit.businessName?.replace(/\s+/g, '-').toLowerCase() ?? auditId}-${new Date(audit.createdAt ?? Date.now()).toISOString().slice(0, 10)}.json`;

    const payload = {
      auditId,
      businessName: audit.businessName,
      geoScore: audit.geoScore,
      status: audit.status,
      createdAt: audit.createdAt,
      completedAt: audit.completedAt,
      exportedAt: new Date().toISOString(),
      results: audit.results,
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.status(200).send(JSON.stringify(payload, null, 2));
  } catch (error) {
    return handleApiError(error, res);
  }
}
