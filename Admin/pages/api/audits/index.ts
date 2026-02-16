import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdmin } from "@/lib/requireAdmin";
import { getDb } from "@/lib/db";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const session = await requireAdmin(req, res);
  if (!session) return;

  const db = await getDb();

  // Query params
  const status = req.query.status as string | undefined;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 50;
  const skip = (page - 1) * limit;

  const filter: Record<string, unknown> = {};
  if (status) {
    filter.status = status;
  }

  const [audits, total] = await Promise.all([
    db
      .collection("audits")
      .find(filter, {
        projection: {
          _id: 1,
          businessId: 1,
          userId: 1,
          businessName: 1,
          status: 1,
          geoScore: 1,
          createdAt: 1,
          completedAt: 1,
          schemaVersion: 1,
          error: 1,
        },
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray(),
    db.collection("audits").countDocuments(filter),
  ]);

  return res.status(200).json({
    audits,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}
