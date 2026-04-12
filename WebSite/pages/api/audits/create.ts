import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import mongoose from 'mongoose';
import Audit from '@/models/Audit';
import { handleApiError, ApiError, ErrorType } from '@/lib/error-handler';
import { sendAuditStartedClientEmail, sendAuditStartedAdminEmail, sendAuditLaunchedAdminEmail } from '@/lib/email';
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
      localityTier,
      city,
      country,
      neighborhood,
      street,
      region,
      targetKeywords,
      servicesOrProducts,
      uniqueSellingPoints,
      targetAudience,
      priceRange,
      yearFounded,
      certifications,
      socialMediaUrls,
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

    // Find the most recent completed audit for this business (for history tracking)
    const previousAudit = await Audit.findOne({
      businessId: new mongoose.Types.ObjectId(businessId),
      userId: new mongoose.Types.ObjectId(session.user.id),
      status: 'completed',
    })
      .sort({ createdAt: -1 })
      .select('_id issueChecklist results')
      .lean();

    // Collect issue types the user has already addressed (for AI context)
    const completedIssueTypes: string[] = [];
    if (previousAudit?.issueChecklist && previousAudit.issueChecklist.length > 0) {
      const prevResults = previousAudit.results as { issues?: { id: string; type: string }[] } | null;
      const prevIssues = prevResults?.issues ?? [];
      const doneIds = new Set(
        previousAudit.issueChecklist
          .filter((c) => c.done)
          .map((c) => c.issueId)
      );
      for (const issue of prevIssues) {
        if (doneIds.has(issue.id)) completedIssueTypes.push(issue.type);
      }
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
      previousAuditId: previousAudit ? previousAudit._id : null,
    });

    const auditId = audit._id.toString();

    // Fire-and-forget: trigger the Python processing server
    const processingUrl = process.env.PROCESSING_SERVICE_URL || 'http://localhost:8080';
    const processingKey = process.env.PROCESSING_SERVICE_API_KEY;

    if (processingKey) {
      const hasItems = (v: unknown): v is unknown[] => Array.isArray(v) && v.length > 0;
      const parsedYear = typeof yearFounded === 'number'
        ? yearFounded
        : typeof yearFounded === 'string' && yearFounded.trim()
          ? parseInt(yearFounded, 10)
          : undefined;

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
        ...(localityTier ? { localityTier } : {}),
        ...(city ? { city } : {}),
        ...(country ? { country } : {}),
        ...(neighborhood ? { neighborhood } : {}),
        ...(street ? { street } : {}),
        ...(region ? { region } : {}),
        // Extended business context — forwarded only when non-empty
        ...(hasItems(targetKeywords) ? { targetKeywords } : {}),
        ...(hasItems(servicesOrProducts) ? { servicesOrProducts } : {}),
        ...(hasItems(uniqueSellingPoints) ? { uniqueSellingPoints } : {}),
        ...(targetAudience ? { targetAudience } : {}),
        ...(priceRange ? { priceRange } : {}),
        ...(Number.isFinite(parsedYear) ? { yearFounded: parsedYear } : {}),
        ...(hasItems(certifications) ? { certifications } : {}),
        ...(hasItems(socialMediaUrls) ? { socialMediaUrls } : {}),
        // History context for the processing server
        ...(previousAudit ? { previousAuditId: previousAudit._id.toString() } : {}),
        ...(completedIssueTypes.length > 0 ? { completedIssueTypes } : {}),
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

    // Fire-and-forget: notify client that audit has started
    const userEmail = session.user.email ?? '';
    const userName = session.user.name ?? session.user.email ?? 'Unknown';
    const userLanguage = (session.user as { language?: string }).language === 'en' ? 'en' : 'fr';

    if (userEmail) {
      sendAuditStartedClientEmail({
        email: userEmail,
        userName,
        businessName,
        businessUrl,
        language: userLanguage,
      }).catch((err: Error) => {
        console.error('[Audit] Failed to send client started email:', err.message);
      });
    }

    // Fire-and-forget: notify admin internally that audit was launched
    sendAuditStartedAdminEmail({
      userName,
      userEmail,
      businessName,
      businessUrl,
      category,
      auditId,
      subscriptionTier: (session.user as { subscriptionTier?: string }).subscriptionTier ?? 'none',
      adminUrl: `${config.siteUrl}/admin/audits`,
    }).catch((err: Error) => {
      console.error('[Audit] Failed to send admin started email:', err.message);
    });

    // Fire-and-forget: notify admin
    sendAuditLaunchedAdminEmail({
      businessName,
      businessUrl,
      category,
      userName,
      userEmail,
      auditId,
      adminUrl: `${config.siteUrl}/admin/audits`,
    }).catch((err: Error) => {
      console.error('[Audit] Failed to send admin notification:', err.message);
    });

    return res.status(201).json({
      success: true,
      data: { auditId, status: 'pending' },
    });
  } catch (error) {
    return handleApiError(error, res);
  }
}
