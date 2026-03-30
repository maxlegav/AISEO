import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import mongoose from 'mongoose';
import Audit from '@/models/Audit';
import Business from '@/models/Business';
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

    // Enforce max 3 sub-URLs and 3 competitors
    const MAX_ITEMS = 3;
    if (Array.isArray(subUrls) && subUrls.length > MAX_ITEMS) {
      throw new ApiError(ErrorType.VALIDATION, `Maximum ${MAX_ITEMS} sub-URLs allowed`);
    }
    if (Array.isArray(competitorUrls) && competitorUrls.length > MAX_ITEMS) {
      throw new ApiError(ErrorType.VALIDATION, `Maximum ${MAX_ITEMS} competitors allowed`);
    }

    await connectDB();

    // Verify the user owns this business
    const business = await Business.findOne({
      _id: businessId,
      userId: session.user.id,
      deletedAt: null,
    });
    if (!business) {
      throw new ApiError(ErrorType.AUTHORIZATION, 'Business not found or access denied');
    }

    // Prevent duplicate audits: block if there's already an active audit for this business
    const activeAudit = await Audit.findOne({
      businessId: new mongoose.Types.ObjectId(businessId),
      userId: new mongoose.Types.ObjectId(session.user.id),
      status: { $in: ['pending', 'processing', 'awaiting_prompt_approval', 'questions_review', 'auditing', 'review_pending'] },
    });
    if (activeAudit) {
      throw new ApiError(
        ErrorType.VALIDATION,
        'An audit is already in progress for this project'
      );
    }

    // Limit retries: max 3 total audits per business (1 initial + 2 retries)
    const MAX_AUDITS_PER_BUSINESS = 3;
    const totalAudits = await Audit.countDocuments({
      businessId: new mongoose.Types.ObjectId(businessId),
      userId: new mongoose.Types.ObjectId(session.user.id),
    });
    if (totalAudits >= MAX_AUDITS_PER_BUSINESS) {
      throw new ApiError(
        ErrorType.VALIDATION,
        'Maximum retry limit reached for this project. Please contact support or create a new project.'
      );
    }

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
