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
      competitorNames,
      language,
      city,
      country,
      neighborhood,
    } = req.body;

    if (!businessId || !businessName || !businessUrl || !category) {
      throw new ApiError(
        ErrorType.VALIDATION,
        'Missing required fields: businessId, businessName, businessUrl, category'
      );
    }

    if (!mongoose.Types.ObjectId.isValid(businessId)) {
      throw new ApiError(ErrorType.VALIDATION, 'Invalid businessId format');
    }

    await connectDB();

    const audit = await Audit.create({
      userId: new mongoose.Types.ObjectId(session.user.id),
      businessId: new mongoose.Types.ObjectId(businessId),
      businessName,
      status: 'pending',
      schemaVersion: 2,
      geoScore: null,
      error: null,
      results: {},
      createdAt: new Date(),
      completedAt: null,
    });

    const auditId = audit._id.toString();

    // Fire-and-forget: trigger the Python processing server
    const processingUrl = process.env.PROCESSING_SERVICE_URL || 'http://localhost:8080';
    const processingKey = process.env.PROCESSING_SERVICE_API_KEY;

    if (processingKey) {
      const auditRequest = {
        auditId,
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
        competitorNames: competitorNames || [],
        ...(city ? { city } : {}),
        ...(country ? { country } : {}),
        ...(neighborhood ? { neighborhood } : {}),
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
      console.warn(
        '[Audit] PROCESSING_SERVICE_API_KEY not configured — audit created in DB but not triggered'
      );
    }

    return res.status(201).json({
      success: true,
      data: { auditId, status: 'pending' },
    });
  } catch (error) {
    return handleApiError(error, res);
  }
}
