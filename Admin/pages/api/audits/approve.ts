import type { NextApiRequest, NextApiResponse } from "next";
import { ObjectId } from "mongodb";
import { requireAdmin } from "@/lib/requireAdmin";
import { getDb } from "@/lib/db";
import { sendAuditCompletedClientEmail } from "@/lib/email";

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
  awaiting_prompt_approval: { approve: "auditing", reject: "rejected" },
  audit_review: { approve: "completed", reject: "rejected" },
  // Legacy support
  review_pending: { approve: "completed", reject: "rejected" },
};

/** Statuses that require calling the backend server to start Phase 2 */
const PHASE2_TRIGGER_STATUSES = new Set(["questions_review", "awaiting_prompt_approval"]);

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
    .findOne({ _id: oid }, { projection: { status: 1, userId: 1, businessName: 1, geoScore: 1 } });

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

  // When approving questions (Phase 1 → Phase 2), call the backend server
  if (action === "approve" && PHASE2_TRIGGER_STATUSES.has(audit.status)) {
    const serviceUrl = process.env.PROCESSING_SERVICE_URL;
    const serviceKey = process.env.PROCESSING_SERVICE_API_KEY;

    if (!serviceUrl || !serviceKey) {
      return res.status(500).json({
        error: "PROCESSING_SERVICE_URL or PROCESSING_SERVICE_API_KEY not configured",
      });
    }

    try {
      const serverRes = await fetch(
        `${serviceUrl}/audit/${auditId}/approve-prompts`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${serviceKey}`,
          },
        }
      );

      if (!serverRes.ok) {
        const errorBody = await serverRes.text();
        return res.status(502).json({
          error: `Backend server returned ${serverRes.status}: ${errorBody}`,
        });
      }

      // Record who reviewed (server handles the status transition)
      await db.collection("audits").updateOne(
        { _id: oid },
        {
          $set: {
            reviewedAt: new Date().toISOString(),
            reviewedBy: session.user?.email,
          },
        }
      );

      return res.status(200).json({
        success: true,
        auditId,
        previousStatus: audit.status,
        newStatus: "processing", // server sets this
      });
    } catch (err) {
      return res.status(502).json({
        error: `Failed to reach backend server: ${err instanceof Error ? err.message : String(err)}`,
      });
    }
  }

  // For all other transitions (audit_review → completed, any → rejected)
  const updateFields: Record<string, unknown> = {
    status: newStatus,
    reviewedAt: new Date().toISOString(),
    reviewedBy: session.user?.email,
  };

  if (newStatus === "completed") {
    updateFields.completedAt = new Date().toISOString();
  }

  await db.collection("audits").updateOne(
    { _id: oid },
    { $set: updateFields }
  );

  // Send client notification email when audit is delivered
  if (newStatus === "completed" && audit.userId) {
    try {
      const userOid = new ObjectId(audit.userId.toString());
      const user = await db
        .collection("users")
        .findOne(
          { _id: userOid },
          { projection: { email: 1, name: 1, username: 1, language: 1 } }
        );

      if (user?.email) {
        const websiteUrl = process.env.WEBSITE_URL ?? "https://showyourbrand.app";
        const lang = (user.language === "en" ? "en" : "fr") as "en" | "fr";
        const auditUrl = user.username
          ? `${websiteUrl}/${user.username}/audits/${auditId}`
          : `${websiteUrl}/dashboard`;

        sendAuditCompletedClientEmail({
          to: user.email,
          userName: user.name ?? "there",
          businessName: audit.businessName ?? "your website",
          geoScore: audit.geoScore ?? 0,
          auditUrl,
          language: lang,
        }).catch((err: Error) => {
          console.error("[Email] Failed to send audit completed email:", err.message);
        });
      }
    } catch (err) {
      // Non-blocking — don't fail the approval if email errors
      console.error("[Email] Error fetching user for completion email:", err);
    }
  }

  return res.status(200).json({
    success: true,
    auditId,
    previousStatus: audit.status,
    newStatus,
  });
}
