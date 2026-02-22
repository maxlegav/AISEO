import type { NextApiRequest, NextApiResponse } from "next";
import { ObjectId } from "mongodb";
import { requireAdmin } from "@/lib/requireAdmin";
import { getDb } from "@/lib/db";

/**
 * Multi-step approval endpoint.
 *
 * Transitions:
 *   questions_review  → auditing   (approve questions)
 *   questions_review  → rejected   (reject questions)
 *   audit_review      → completed  (approve final audit)
 *   audit_review      → rejected   (reject final audit)
 *
 * Legacy compat: review_pending is treated as audit_review.
 */

const ALLOWED_TRANSITIONS: Record<string, { approve: string; reject: string }> = {
  questions_review: { approve: "auditing", reject: "rejected" },
  audit_review: { approve: "completed", reject: "rejected" },
  // Legacy support
  review_pending: { approve: "completed", reject: "rejected" },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const session = await requireAdmin(req, res);
  if (!session) return;

  const { auditId, action } = req.body as {
    auditId?: string;
    action?: "approve" | "reject";
  };

  if (!auditId || !action || !["approve", "reject"].includes(action)) {
    return res.status(400).json({
      error: "Missing auditId or action (approve|reject)",
    });
  }

  let oid: ObjectId;
  try {
    oid = new ObjectId(auditId);
  } catch {
    return res.status(400).json({ error: "Invalid audit ID" });
  }

  const db = await getDb();

  const audit = await db
    .collection("audits")
    .findOne({ _id: oid }, { projection: { status: 1 } });

  if (!audit) {
    return res.status(404).json({ error: "Audit not found" });
  }

  const transition = ALLOWED_TRANSITIONS[audit.status];

  if (!transition) {
    return res.status(400).json({
      error: `Cannot ${action} audit with status "${audit.status}". Only audits in "questions_review" or "audit_review" can be approved/rejected.`,
    });
  }

  const newStatus = transition[action];

  const updateFields: Record<string, unknown> = {
    status: newStatus,
    reviewedAt: new Date().toISOString(),
    reviewedBy: session.user?.email,
  };

  // When approving final audit, also set completedAt
  if (newStatus === "completed") {
    updateFields.completedAt = new Date().toISOString();
  }

  await db.collection("audits").updateOne(
    { _id: oid },
    { $set: updateFields }
  );

  return res.status(200).json({
    success: true,
    auditId,
    previousStatus: audit.status,
    newStatus,
  });
}
