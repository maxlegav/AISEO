import type { NextApiRequest, NextApiResponse } from "next";
import { ObjectId } from "mongodb";
import { requireAdmin } from "@/lib/requireAdmin";
import { getDb } from "@/lib/db";

interface QuestionUpdate {
  id: string;
  question?: string;
  enabled?: boolean;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const session = await requireAdmin(req, res);
  if (!session) return;

  const { auditId, questions } = req.body as {
    auditId?: string;
    questions?: QuestionUpdate[];
  };

  if (!auditId || !questions || !Array.isArray(questions)) {
    return res.status(400).json({
      error: "Missing auditId or questions array",
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
    .findOne({ _id: oid }, { projection: { status: 1, "results.generatedPrompts": 1 } });

  if (!audit) {
    return res.status(404).json({ error: "Audit not found" });
  }

  if (audit.status !== "questions_review" && audit.status !== "awaiting_prompt_approval") {
    return res.status(400).json({
      error: `Cannot edit questions for audit with status "${audit.status}". Only "questions_review" or "awaiting_prompt_approval" audits can have questions edited.`,
    });
  }

  const existingPrompts: Array<{ id: string; level: number; category: string; question: string; enabled?: boolean }> =
    audit.results?.generatedPrompts || [];

  // Apply updates
  const updatedPrompts = existingPrompts.map((prompt) => {
    const update = questions.find((q) => q.id === prompt.id);
    if (!update) return prompt;

    return {
      ...prompt,
      ...(update.question !== undefined && { question: update.question }),
      ...(update.enabled !== undefined && { enabled: update.enabled }),
    };
  });

  await db.collection("audits").updateOne(
    { _id: oid },
    {
      $set: {
        "results.generatedPrompts": updatedPrompts,
        questionsEditedAt: new Date().toISOString(),
        questionsEditedBy: session.user?.email,
      },
    }
  );

  return res.status(200).json({
    success: true,
    auditId,
    updatedCount: questions.length,
  });
}
