import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdmin } from "@/lib/requireAdmin";
import { getDb } from "@/lib/db";

// Map admin statuses to include legacy/backend equivalents for DB queries
const STATUS_FILTER_MAP: Record<string, string[]> = {
  generating: ["generating"],
  questions_review: ["questions_review", "awaiting_prompt_approval"],
  audit_review: ["audit_review", "review_pending"],
};

// For "generating", we also need processing docs WITHOUT prompts (Phase 1)
// For "auditing", we also need processing docs WITH prompts (Phase 2)
// These are handled specially in buildFilter() below

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

/** Normalize a raw DB status to its Admin-facing status */
function normalizeAuditStatus(
  status: string,
  hasPrompts: boolean
): string {
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
          "results.generatedPrompts": { $slice: 1 },
        },
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray(),
    db.collection("audits").countDocuments(filter),
  ]);

  // Normalize statuses for the frontend
  const normalizedAudits = audits.map((a) => {
    const hasPrompts = Array.isArray(a.results?.generatedPrompts) && a.results.generatedPrompts.length > 0;
    const normalized = normalizeAuditStatus(a.status, hasPrompts);
    // Remove the results field from list response (only needed for normalization)
    const { results, ...rest } = a;
    return { ...rest, status: normalized };
  });

  return res.status(200).json({
    audits: normalizedAudits,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}
