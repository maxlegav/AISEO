import type { NextApiRequest, NextApiResponse } from "next";
import mongoose from "mongoose";
import Project from "@/models/Project";
import Client from "@/models/Client";
import { handleApiError, ApiError, ErrorType } from "@/lib/error-handler";
import { handleZodError } from "@/lib/validation/helpers";
import { CreateProjectSchema } from "@/lib/validation/project";
import { getProjectLimit, getMaxLLMs, isFrequencyAllowed } from "@/lib/monitoring/limits";
import type { SubscriptionTier } from "@/lib/subscription-limits";
import { requireWorkspace } from "@/lib/api-workspace";
import { getWorkspacePlan } from "@/lib/monitoring/workspace";

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) return;
  await mongoose.connect(process.env.MONGODB_URI!);
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { userId, workspace } = await requireWorkspace(req, res);
    await connectDB();
    const organizationId = workspace.organizationId;

    if (req.method === "GET") {
      const query: Record<string, unknown> = { organizationId };
      if (typeof req.query.clientId === "string" && req.query.clientId) {
        query.clientId = req.query.clientId;
      }
      const projects = await Project.find(query).sort({ createdAt: -1 });
      return res.status(200).json({ success: true, data: projects });
    }

    if (req.method === "POST") {
      const parsed = CreateProjectSchema.safeParse(req.body);
      if (!parsed.success) return handleZodError(parsed.error, res);

      const { tier } = await getWorkspacePlan(workspace.ownerId);

      // Optional client must belong to this organization.
      let clientId: string | null = null;
      if (typeof req.body.clientId === "string" && req.body.clientId) {
        const client = await Client.findOne({
          _id: req.body.clientId,
          organizationId,
        });
        if (!client) {
          throw new ApiError(ErrorType.NOT_FOUND, "Client introuvable pour cette organisation.");
        }
        clientId = client._id.toString();
      }

      const maxLLMs = getMaxLLMs(tier as SubscriptionTier);
      if (parsed.data.llms.length > maxLLMs) {
        return res.status(403).json({
          success: false,
          error: "UPGRADE_REQUIRED",
          message: `Votre plan autorise ${maxLLMs} moteur(s) par projet. Passez à un plan supérieur pour tous les activer.`,
        });
      }

      if (!isFrequencyAllowed(tier, parsed.data.frequency)) {
        return res.status(403).json({
          success: false,
          error: "UPGRADE_REQUIRED",
          message: `Votre plan ne permet pas la fréquence « ${parsed.data.frequency} ». Passez à un plan supérieur pour le suivi quotidien.`,
        });
      }

      const limit = getProjectLimit(tier);
      const count = await Project.countDocuments({ organizationId });
      if (count >= limit) {
        return res.status(403).json({
          success: false,
          error: "UPGRADE_REQUIRED",
          message: `Votre plan autorise ${limit} projet(s). Passez à un plan supérieur pour en suivre davantage.`,
        });
      }

      const project = await Project.create({
        ...parsed.data,
        userId,
        organizationId,
        clientId,
      });
      return res.status(201).json({ success: true, data: project });
    }

    return res.status(405).json({ success: false, error: "METHOD_NOT_ALLOWED" });
  } catch (error) {
    return handleApiError(error, res);
  }
}
