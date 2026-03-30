/**
 * POST /api/admin/audits/[auditId]/complete
 *
 * Admin-only endpoint: marks a review_pending audit as completed
 * and sends the client their notification email.
 *
 * Protected by ADMIN_EMAIL env var check (logged-in user must be the admin).
 */
import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]';
import mongoose from 'mongoose';
import Audit from '@/models/Audit';
import User from '@/models/User';
import { handleApiError, ApiError, ErrorType } from '@/lib/error-handler';
import { sendAuditCompletedClientEmail } from '@/lib/email';
import config from '@/config';

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) return;
  await mongoose.connect(process.env.MONGODB_URI!);
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
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

    const { auditId } = req.query;
    if (!auditId || typeof auditId !== 'string') {
      throw new ApiError(ErrorType.VALIDATION, 'Missing auditId');
    }

    await connectDB();

    const audit = await Audit.findById(auditId).lean();
    if (!audit) {
      throw new ApiError(ErrorType.NOT_FOUND, 'Audit not found');
    }

    if (audit.status === 'completed') {
      return res.status(200).json({ success: true, data: { alreadyCompleted: true } });
    }

    if (audit.status !== 'review_pending') {
      throw new ApiError(
        ErrorType.VALIDATION,
        `Audit must be in review_pending state, currently '${audit.status}'`
      );
    }

    // Mark as completed
    await Audit.findByIdAndUpdate(auditId, {
      $set: {
        status: 'completed',
        reviewedAt: new Date(),
        reviewedBy: session.user.email,
      },
    });

    // Fetch the client's info to send notification email
    const user = await User.findById(audit.userId).select('email name username language').lean();
    if (user) {
      const u = user as { name?: string; email: string; username?: string; language?: string };
      const userName = u.name ?? 'there';
      const lang = (u.language === 'en' ? 'en' : 'fr') as 'en' | 'fr';
      const auditUrl = `${config.siteUrl}/${u.username ?? u.email}/audits/${auditId}`;

      sendAuditCompletedClientEmail({
        email: user.email,
        userName,
        businessName: audit.businessName ?? 'your website',
        geoScore: audit.geoScore ?? 0,
        auditUrl,
        language: lang,
      }).catch((err: Error) => {
        console.error('[Admin] Failed to send client completion email:', err.message);
      });
    }

    return res.status(200).json({ success: true, data: { completed: true } });
  } catch (error) {
    return handleApiError(error, res);
  }
}
