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

interface ChecklistPatch {
  issueId: string;
  done: boolean;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'PATCH' && req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'METHOD_NOT_ALLOWED' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.id) {
      throw new ApiError(ErrorType.AUTHENTICATION, 'You must be logged in');
    }

    // Checklist tracking is Pro/Agency only
    const tier = session.user.subscriptionTier;
    if (tier !== 'pro' && tier !== 'agency') {
      return res.status(403).json({
        success: false,
        error: 'FORBIDDEN',
        message: 'Checklist tracking requires a Pro or Agency plan',
      });
    }

    const { auditId } = req.query;
    if (!auditId || typeof auditId !== 'string') {
      throw new ApiError(ErrorType.VALIDATION, 'Missing auditId');
    }

    await connectDB();

    const audit = await Audit.findById(auditId).select('userId issueChecklist').lean();
    if (!audit) {
      throw new ApiError(ErrorType.NOT_FOUND, 'Audit not found');
    }
    if (audit.userId.toString() !== session.user.id) {
      throw new ApiError(ErrorType.AUTHORIZATION, 'Access denied');
    }

    // GET — return current checklist
    if (req.method === 'GET') {
      return res.status(200).json({ success: true, data: audit.issueChecklist ?? [] });
    }

    // PATCH — update checklist items
    const { items } = req.body as { items: ChecklistPatch[] };
    if (!Array.isArray(items) || items.length === 0) {
      throw new ApiError(ErrorType.VALIDATION, 'items array is required');
    }

    // Build updated checklist: merge with existing
    const existing = (audit.issueChecklist ?? []) as { issueId: string; done: boolean; doneAt?: Date | null }[];
    const existingMap = new Map(existing.map((c) => [c.issueId, c]));

    for (const patch of items) {
      if (typeof patch.issueId !== 'string' || typeof patch.done !== 'boolean') continue;
      existingMap.set(patch.issueId, {
        issueId: patch.issueId,
        done: patch.done,
        doneAt: patch.done ? new Date() : null,
      });
    }

    const updated = Array.from(existingMap.values());

    await Audit.findByIdAndUpdate(auditId, { issueChecklist: updated });

    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    return handleApiError(error, res);
  }
}
