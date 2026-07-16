/**
 * POST /api/admin/audits/[auditId]/review
 *
 * Single human-in-the-loop review endpoint. Body: { action: "approve" | "reject" }.
 *
 * Transitions:
 *   questions_review / awaiting_prompt_approval → auditing (approve → triggers Phase 2 on the Python service)
 *   questions_review / awaiting_prompt_approval → rejected
 *   audit_review / review_pending               → completed (approve → notifies the client)
 *   audit_review / review_pending               → rejected
 *
 * Admin-only (ADMIN_EMAIL env var).
 */
import type { NextApiRequest, NextApiResponse } from "next";
import { ObjectId } from "mongodb";
import { requireAdmin } from "@/lib/admin-auth";
import { getDb } from "@/lib/admin-db";
import { sendAuditCompletedClientEmail } from "@/lib/email";
import config from "@/config";

const ALLOWED_TRANSITIONS: Record<
  string,
  { approve: string; reject: string }
> = {
  questions_review: { approve: "auditing", reject: "rejected" },
  awaiting_prompt_approval: { approve: "auditing", reject: "rejected" },
  audit_review: { approve: "completed", reject: "rejected" },
  review_pending: { approve: "completed", reject: "rejected" },
};

/** Statuses whose approval must trigger Phase 2 on the Python service. */
const PHASE2_TRIGGER_STATUSES = new Set([
  "questions_review",
  "awaiting_prompt_approval",
]);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const session = await requireAdmin(req, res);
  if (!session) return;

  const { auditId } = req.query;
  if (!auditId || typeof auditId !== "string") {
    return res.status(400).json({ error: "Missing audit ID" });
  }

  const { action } = req.body as { action?: "approve" | "reject" };
  if (!action || !["approve", "reject"].includes(action)) {
    return res
      .status(400)
      .json({ error: "Missing action (approve|reject)" });
  }

  let oid: ObjectId;
  try {
    oid = new ObjectId(auditId);
  } catch {
    return res.status(400).json({ error: "Invalid audit ID" });
  }

  const db = await getDb();

  const audit = await db.collection("audits").findOne(
    { _id: oid },
    {
      projection: {
        status: 1,
        userId: 1,
        businessName: 1,
        geoScore: 1,
      },
    }
  );

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

  // Approving prompts (Phase 1 → Phase 2): hand off to the Python service,
  // which owns the status transition to "processing" / "auditing".
  if (action === "approve" && PHASE2_TRIGGER_STATUSES.has(audit.status)) {
    const serviceUrl = process.env.PROCESSING_SERVICE_URL;
    const serviceKey = process.env.PROCESSING_SERVICE_API_KEY;

    if (!serviceUrl || !serviceKey) {
      return res.status(500).json({
        error:
          "PROCESSING_SERVICE_URL or PROCESSING_SERVICE_API_KEY not configured",
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
          error: `Processing service returned ${serverRes.status}: ${errorBody}`,
        });
      }

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
        newStatus: "processing",
      });
    } catch (err) {
      return res.status(502).json({
        error: `Failed to reach processing service: ${
          err instanceof Error ? err.message : String(err)
        }`,
      });
    }
  }

  // All other transitions: audit_review → completed, or any → rejected.
  const updateFields: Record<string, unknown> = {
    status: newStatus,
    reviewedAt: new Date().toISOString(),
    reviewedBy: session.user?.email,
  };

  if (newStatus === "completed") {
    updateFields.completedAt = new Date().toISOString();
  }

  await db.collection("audits").updateOne({ _id: oid }, { $set: updateFields });

  // Notify the client when the audit is delivered.
  if (newStatus === "completed" && audit.userId) {
    try {
      const user = await db.collection("users").findOne(
        { _id: new ObjectId(audit.userId.toString()) },
        { projection: { email: 1, name: 1, username: 1, language: 1 } }
      );

      if (user?.email) {
        const lang = (user.language === "en" ? "en" : "fr") as "en" | "fr";
        const auditUrl = `${config.siteUrl}/${
          user.username ?? user.email
        }/audits/${auditId}`;

        sendAuditCompletedClientEmail({
          email: user.email,
          userName: user.name ?? "there",
          businessName: audit.businessName ?? "your website",
          geoScore: audit.geoScore ?? 0,
          auditUrl,
          language: lang,
        }).catch((err: Error) => {
          console.error(
            "[Admin] Failed to send audit completed email:",
            err.message
          );
        });
      }
    } catch (err) {
      console.error("[Admin] Error fetching user for completion email:", err);
    }
  }

  return res.status(200).json({
    success: true,
    auditId,
    previousStatus: audit.status,
    newStatus,
  });
}
