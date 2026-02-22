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

    const client = await clientPromise;
    const db = client.db(DB_NAME);

    // userId and businessId are stored as plain strings in the audits collection
    const filter: Record<string, unknown> = {
      userId: session.user.id,
    };

    // Optional businessId filter
    const { businessId } = req.query;
    if (businessId && typeof businessId === 'string') {
      filter.businessId = businessId;
    }

    const audits = await db
      .collection('audits')
      .find(filter, {
        projection: {
          _id: 1,
          businessId: 1,
          businessName: 1,
          status: 1,
          geoScore: 1,
          createdAt: 1,
          completedAt: 1,
        },
      })
      .sort({ createdAt: -1 })
      .toArray();

    // Fetch fresh business data for all referenced businesses
    const businessIds = [...new Set(audits.map((a) => a.businessId).filter(Boolean))];
    const businessMap: Record<string, { name: string; primaryUrl: string }> = {};

    if (businessIds.length > 0) {
      const validObjectIds = businessIds
        .filter((id) => ObjectId.isValid(id))
        .map((id) => new ObjectId(id as string));

      if (validObjectIds.length > 0) {
        const businesses = await db
          .collection('businesses')
          .find(
            { _id: { $in: validObjectIds }, deletedAt: null },
            { projection: { _id: 1, name: 1, primaryUrl: 1 } }
          )
          .toArray();

        for (const biz of businesses) {
          businessMap[biz._id.toString()] = {
            name: biz.name,
            primaryUrl: biz.primaryUrl,
          };
        }
      }
    }

    // Enrich each audit with live business data
    const enrichedAudits = audits.map((audit) => {
      const biz = businessMap[audit.businessId as string];
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
