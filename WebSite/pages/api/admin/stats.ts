import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdmin } from "@/lib/admin-auth";
import { getDb } from "@/lib/admin-db";

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
  const audits = db.collection("audits");

  const [
    totalUsers,
    totalAudits,
    pendingAudits,
    generatingAudits,
    questionsReviewAudits,
    awaitingPromptApprovalAudits,
    auditingAudits,
    auditReviewAudits,
    completedAudits,
    failedAudits,
    rejectedAudits,
    processingPhase1Audits,
    processingPhase2Audits,
    reviewPendingAudits,
    totalBusinesses,
  ] = await Promise.all([
    db.collection("users").countDocuments(),
    audits.countDocuments(),
    audits.countDocuments({ status: "pending" }),
    audits.countDocuments({ status: "generating" }),
    audits.countDocuments({ status: "questions_review" }),
    audits.countDocuments({ status: "awaiting_prompt_approval" }),
    audits.countDocuments({ status: "auditing" }),
    audits.countDocuments({ status: "audit_review" }),
    audits.countDocuments({ status: "completed" }),
    audits.countDocuments({ status: "failed" }),
    audits.countDocuments({ status: "rejected" }),
    // Legacy: processing without prompts = Phase 1 (generating)
    audits.countDocuments({
      status: "processing",
      $or: [
        { "results.generatedPrompts": { $exists: false } },
        { "results.generatedPrompts": { $size: 0 } },
      ],
    }),
    // Legacy: processing with prompts = Phase 2 (auditing)
    audits.countDocuments({
      status: "processing",
      "results.generatedPrompts": { $exists: true, $not: { $size: 0 } },
    }),
    audits.countDocuments({ status: "review_pending" }),
    db.collection("businesses").countDocuments(),
  ]);

  return res.status(200).json({
    users: totalUsers,
    businesses: totalBusinesses,
    audits: {
      total: totalAudits,
      pending: pendingAudits,
      generating: generatingAudits + processingPhase1Audits,
      questions_review: questionsReviewAudits + awaitingPromptApprovalAudits,
      auditing: auditingAudits + processingPhase2Audits,
      audit_review: auditReviewAudits + reviewPendingAudits,
      completed: completedAudits,
      failed: failedAudits,
      rejected: rejectedAudits,
    },
  });
}
