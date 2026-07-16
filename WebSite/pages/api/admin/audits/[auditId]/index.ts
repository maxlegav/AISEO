/**
 * GET /api/admin/audits/[auditId]
 * Full audit document + user/business context for the admin detail view.
 * Admin-only (ADMIN_EMAIL env var).
 */
import type { NextApiRequest, NextApiResponse } from "next";
import { ObjectId } from "mongodb";
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

  const { auditId } = req.query;
  if (!auditId || typeof auditId !== "string") {
    return res.status(400).json({ error: "Missing audit ID" });
  }

  let oid: ObjectId;
  try {
    oid = new ObjectId(auditId);
  } catch {
    return res.status(400).json({ error: "Invalid audit ID" });
  }

  const db = await getDb();

  const audit = await db.collection("audits").findOne({ _id: oid });
  if (!audit) {
    return res.status(404).json({ error: "Audit not found" });
  }

  let user = null;
  if (audit.userId) {
    try {
      user = await db
        .collection("users")
        .findOne(
          { _id: new ObjectId(audit.userId) },
          { projection: { name: 1, email: 1, subscriptionTier: 1 } }
        );
    } catch {
      // userId might not be a valid ObjectId
    }
  }

  let business = null;
  if (audit.businessId) {
    try {
      business = await db
        .collection("businesses")
        .findOne(
          { _id: new ObjectId(audit.businessId) },
          { projection: { name: 1, primaryUrl: 1, category: 1 } }
        );
    } catch {
      // businessId might not be a valid ObjectId
    }
  }

  return res.status(200).json({ audit, user, business });
}
