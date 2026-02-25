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
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'METHOD_NOT_ALLOWED',
      message: 'Only GET method is allowed',
    });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.id) {
      throw new ApiError(ErrorType.AUTHENTICATION, 'You must be logged in');
    }

    await connectDB();

    // Mongoose auto-casts string → ObjectId for ObjectId-typed fields
    const filter: Record<string, unknown> = {
      userId: session.user.id,
    };

    const { businessId } = req.query;
    if (businessId && typeof businessId === 'string') {
      if (!mongoose.Types.ObjectId.isValid(businessId)) {
        throw new ApiError(ErrorType.VALIDATION, 'Invalid businessId format');
      }
      filter.businessId = businessId;
    }

    const audits = await Audit.find(filter)
      .sort({ createdAt: -1 })
      .select('_id businessId businessName status geoScore createdAt completedAt')
      .lean();

    // Fetch fresh business data for all referenced businesses.
    // With .lean(), businessId is an ObjectId object — use .toString() for the map key.
    const businessIds = [
      ...new Set(audits.map((a) => a.businessId.toString()).filter(Boolean)),
    ];
    const businessMap: Record<string, { name: string; primaryUrl: string }> = {};

    if (businessIds.length > 0) {
      const businesses = await Business.find({
        _id: { $in: businessIds },
        deletedAt: null,
      })
        .select('_id name primaryUrl')
        .lean();

      for (const biz of businesses) {
        businessMap[biz._id.toString()] = {
          name: biz.name,
          primaryUrl: biz.primaryUrl,
        };
      }
    }

    // Enrich each audit with live business data
    const enrichedAudits = audits.map((audit) => {
      const biz = businessMap[audit.businessId.toString()];
      return {
        ...audit,
        businessName: biz?.name ?? audit.businessName,
        businessPrimaryUrl: biz?.primaryUrl ?? null,
      };
    });

    return res.status(200).json({ success: true, data: enrichedAudits });
  } catch (error) {
    return handleApiError(error, res);
  }
}
