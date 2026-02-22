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
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'METHOD_NOT_ALLOWED',
      message: 'Only POST method is allowed',
    });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.id) {
      throw new ApiError(ErrorType.AUTHENTICATION, 'You must be logged in');
    }

    const {
      businessId,
      businessName,
      businessUrl,
      businessType,
      category,
      description,
      subUrls,
      competitorUrls,
      language,
    } = req.body;

    if (!businessId || !businessName || !businessUrl || !category) {
      throw new ApiError(ErrorType.VALIDATION, 'Missing required fields: businessId, businessName, businessUrl, category');
    }

    const client = await clientPromise;
    const db = client.db(DB_NAME);

    // Create audit document — userId and businessId stored as strings (matching server convention)
    const auditId = new ObjectId();
    const now = new Date().toISOString();

    await db.collection('audits').insertOne({
      _id: auditId,
      businessId: businessId.toString(),
      userId: session.user.id,
      businessName,
      status: 'pending',
      schemaVersion: 2,
      geoScore: null,
      error: null,
      results: {},
      createdAt: now,
      completedAt: null,
    });

    // Fire-and-forget: trigger the Python processing server
    const processingUrl = process.env.PROCESSING_SERVICE_URL || 'http://localhost:8080';
    const processingKey = process.env.PROCESSING_SERVICE_API_KEY;

    if (processingKey) {
      const auditRequest = {
        auditId: auditId.toString(),
        businessId: businessId.toString(),
        userId: session.user.id,
        businessName,
        businessUrl,
        businessType: businessType || category,
        category,
        description: description || category,
        language: language || 'fr',
        subUrls: subUrls || [],
        competitorUrls: competitorUrls || [],
        competitorNames: [],
      };

      fetch(`${processingUrl}/audit`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${processingKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(auditRequest),
      }).catch((err: Error) => {
        console.error('[Audit] Failed to trigger processing server:', err.message);
      });
    } else {
      console.warn('[Audit] PROCESSING_SERVICE_API_KEY not configured — audit created in DB but not triggered');
    }

    return res.status(201).json({
      success: true,
      data: { auditId: auditId.toString(), status: 'pending' },
    });
  } catch (error) {
    return handleApiError(error, res);
  }
}
