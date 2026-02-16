import type { NextApiRequest, NextApiResponse } from "next";
import { ObjectId } from "mongodb";
import { requireAdmin } from "@/lib/requireAdmin";
import { getDb } from "@/lib/db";

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

  // Verify audit exists and is in review_pending status
  const audit = await db
    .collection("audits")
    .findOne({ _id: oid }, { projection: { status: 1 } });

  if (!audit) {
    return res.status(404).json({ error: "Audit not found" });
  }

  if (audit.status !== "review_pending") {
    return res.status(400).json({
      error: `Cannot ${action} audit with status "${audit.status}". Only "review_pending" audits can be approved/rejected.`,
    });
  }

  const newStatus = action === "approve" ? "completed" : "rejected";

  await db.collection("audits").updateOne(
    { _id: oid },
    {
      $set: {
        status: newStatus,
        reviewedAt: new Date().toISOString(),
        reviewedBy: session.user?.email,
      },
    }
  );

  return res.status(200).json({
    success: true,
    auditId,
    newStatus,
  });
}
