import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { ObjectId } from 'mongodb';
import clientPromise from '@/libs/mongo';
import { handleApiError, ApiError, ErrorType } from '@/lib/error-handler';

const DB_NAME = 'ShowYourBrand';

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

    let oid: ObjectId;
    try {
      oid = new ObjectId(auditId);
    } catch {
      throw new ApiError(ErrorType.VALIDATION, 'Invalid auditId format');
    }

    const client = await clientPromise;
    const db = client.db(DB_NAME);

    const audit = await db.collection('audits').findOne({ _id: oid });

    if (!audit) {
      throw new ApiError(ErrorType.NOT_FOUND, 'Audit not found');
    }

    // Security: ensure the audit belongs to the current user
    if (audit.userId !== session.user.id) {
      throw new ApiError(ErrorType.AUTHORIZATION, 'Access denied');
    }

    if (req.method === 'DELETE') {
      await db.collection('audits').deleteOne({ _id: oid });
      return res.status(200).json({ success: true, data: { deleted: true } });
    }

    return res.status(200).json({ success: true, data: audit });
  } catch (error) {
    return handleApiError(error, res);
  }
}
