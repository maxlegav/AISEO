/**
 * GET /api/admin/audits
 * Paginated, status-filtered list of audits for the admin surface.
 * Admin-only (ADMIN_EMAIL env var).
 */
import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdmin } from "@/lib/admin-auth";
import { getDb } from "@/lib/admin-db";

// Map admin statuses to include legacy/backend equivalents for DB queries.
const STATUS_FILTER_MAP: Record<string, string[]> = {
  generating: ["generating"],
  questions_review: ["questions_review", "awaiting_prompt_approval"],
  audit_review: ["audit_review", "review_pending"],
};

function buildFilter(status?: string): Record<string, unknown> {
  if (!status) return {};

  if (status === "generating") {
    return {
      $or: [
        { status: { $in: ["generating"] } },
        {
          status: "processing",
          $or: [
            { "results.generatedPrompts": { $exists: false } },
            { "results.generatedPrompts": { $size: 0 } },
          ],
        },
      ],
    };
  }

  if (status === "auditing") {
    return {
      $or: [
        { status: "auditing" },
        {
          status: "processing",
          "results.generatedPrompts": { $exists: true, $not: { $size: 0 } },
        },
      ],
    };
  }

  const mapped = STATUS_FILTER_MAP[status];
  if (mapped) {
    return { status: { $in: mapped } };
  }

  return { status };
}

/** Normalize a raw DB status to its admin-facing status. */
function normalizeAuditStatus(status: string, hasPrompts: boolean): string {
  if (status === "processing") {
    return hasPrompts ? "auditing" : "generating";
  }
  if (status === "awaiting_prompt_approval") return "questions_review";
  if (status === "review_pending") return "audit_review";
  return status;
}

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

  const status = req.query.status as string | undefined;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 50;
  const skip = (page - 1) * limit;

  const filter = buildFilter(status);

  const [rawAudits, total] = await Promise.all([
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
          "results.generatedPrompts": { $slice: 1 },
        },
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray(),
    db.collection("audits").countDocuments(filter),
  ]);

  const audits = rawAudits.map((a) => {
    const generatedPrompts = a.results?.generatedPrompts;
    const hasPrompts =
      Array.isArray(generatedPrompts) && generatedPrompts.length > 0;
    const status = normalizeAuditStatus(a.status, hasPrompts);
    return {
      _id: a._id,
      businessId: a.businessId,
      userId: a.userId,
      businessName: a.businessName,
      geoScore: a.geoScore,
      createdAt: a.createdAt,
      completedAt: a.completedAt,
      schemaVersion: a.schemaVersion,
      error: a.error,
      status,
    };
  });

  return res.status(200).json({
    audits,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}
