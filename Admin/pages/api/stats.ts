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
    generatingAudits,
    questionsReviewAudits,
    auditingAudits,
    auditReviewAudits,
    completedAudits,
    failedAudits,
    rejectedAudits,
    // Legacy statuses still in DB
    processingAudits,
    reviewPendingAudits,
    totalBusinesses,
  ] = await Promise.all([
    db.collection("users").countDocuments(),
    db.collection("audits").countDocuments(),
    db.collection("audits").countDocuments({ status: "pending" }),
    db.collection("audits").countDocuments({ status: "generating" }),
    db.collection("audits").countDocuments({ status: "questions_review" }),
    db.collection("audits").countDocuments({ status: "auditing" }),
    db.collection("audits").countDocuments({ status: "audit_review" }),
    db.collection("audits").countDocuments({ status: "completed" }),
    db.collection("audits").countDocuments({ status: "failed" }),
    db.collection("audits").countDocuments({ status: "rejected" }),
    // Legacy
    db.collection("audits").countDocuments({ status: "processing" }),
    db.collection("audits").countDocuments({ status: "review_pending" }),
    db.collection("businesses").countDocuments(),
  ]);

  return res.status(200).json({
    users: totalUsers,
    businesses: totalBusinesses,
    audits: {
      total: totalAudits,
      pending: pendingAudits,
      generating: generatingAudits + processingAudits, // merge legacy processing
      questions_review: questionsReviewAudits,
      auditing: auditingAudits,
      audit_review: auditReviewAudits + reviewPendingAudits, // merge legacy review_pending
      completed: completedAudits,
      failed: failedAudits,
      rejected: rejectedAudits,
    },
  });
}
