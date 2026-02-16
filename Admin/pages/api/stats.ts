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

  const [
    totalUsers,
    totalAudits,
    pendingAudits,
    processingAudits,
    reviewPendingAudits,
    completedAudits,
    failedAudits,
    rejectedAudits,
    totalBusinesses,
  ] = await Promise.all([
    db.collection("users").countDocuments(),
    db.collection("audits").countDocuments(),
    db.collection("audits").countDocuments({ status: "pending" }),
    db.collection("audits").countDocuments({ status: "processing" }),
    db.collection("audits").countDocuments({ status: "review_pending" }),
    db.collection("audits").countDocuments({ status: "completed" }),
    db.collection("audits").countDocuments({ status: "failed" }),
    db.collection("audits").countDocuments({ status: "rejected" }),
    db.collection("businesses").countDocuments(),
  ]);

  return res.status(200).json({
    users: totalUsers,
    businesses: totalBusinesses,
    audits: {
      total: totalAudits,
      pending: pendingAudits,
      processing: processingAudits,
      review_pending: reviewPendingAudits,
      completed: completedAudits,
      failed: failedAudits,
      rejected: rejectedAudits,
    },
  });
}
