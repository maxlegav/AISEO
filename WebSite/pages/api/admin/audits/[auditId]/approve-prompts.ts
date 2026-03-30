/**
 * POST /api/admin/audits/[auditId]/approve-prompts
 * Admin proxy: forwards the approve-prompts request to the Python processing server.
 * Keeps PROCESSING_SERVICE_API_KEY server-side only.
 */
import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]';
import { handleApiError, ApiError, ErrorType } from '@/lib/error-handler';

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

    const processingUrl = process.env.PROCESSING_SERVICE_URL ?? 'http://localhost:8080';
    const processingKey = process.env.PROCESSING_SERVICE_API_KEY;

    if (!processingKey) {
      throw new ApiError(ErrorType.VALIDATION, 'Processing service not configured');
    }

    const upstream = await fetch(`${processingUrl}/audit/${auditId}/approve-prompts`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${processingKey}` },
    });

    const body = await upstream.json();
    return res.status(upstream.status).json(body);
  } catch (error) {
    return handleApiError(error, res);
  }
}
