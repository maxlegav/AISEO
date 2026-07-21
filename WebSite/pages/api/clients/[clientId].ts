import type { NextApiRequest, NextApiResponse } from "next";
import mongoose from "mongoose";
import Client, { type ClientBranding } from "@/models/Client";
import Project from "@/models/Project";
import { handleApiError, ApiError, ErrorType } from "@/lib/error-handler";
import { requireWorkspace, requireManager } from "@/lib/api-workspace";

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) return;
  await mongoose.connect(process.env.MONGODB_URI!);
};

function str(v: unknown, max: number): string | undefined {
  return typeof v === "string" ? v.trim().slice(0, max) : undefined;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { workspace } = await requireWorkspace(req, res);
    await connectDB();

    const clientId = req.query.clientId as string;
    const client = await Client.findOne({
      _id: clientId,
      organizationId: workspace.organizationId,
    });
    if (!client) throw new ApiError(ErrorType.NOT_FOUND, "Client introuvable.");

    if (req.method === "GET") {
      return res.status(200).json({ success: true, data: client });
    }

    if (req.method === "PATCH") {
      requireManager(workspace);
      if (typeof req.body.name === "string") client.name = str(req.body.name, 120) || client.name;
      if (typeof req.body.websiteUrl === "string") client.websiteUrl = str(req.body.websiteUrl, 300);
      if (typeof req.body.contactEmail === "string")
        client.contactEmail = str(req.body.contactEmail, 200);
      if (req.body.branding && typeof req.body.branding === "object") {
        const b = req.body.branding as Record<string, unknown>;
        const branding: ClientBranding = {
          agencyName: str(b.agencyName, 80),
          logoUrl: str(b.logoUrl, 500),
          primaryColor: str(b.primaryColor, 9),
          customDomain: str(b.customDomain, 200),
        };
        client.branding = branding;
      }
      await client.save();
      return res.status(200).json({ success: true, data: client });
    }

    if (req.method === "DELETE") {
      requireManager(workspace);
      // Detach projects from the client rather than deleting them.
      await Project.updateMany(
        { organizationId: workspace.organizationId, clientId: client._id },
        { $set: { clientId: null } },
      );
      await client.deleteOne();
      return res.status(200).json({ success: true, data: { id: clientId } });
    }

    return res.status(405).json({ success: false, error: "METHOD_NOT_ALLOWED" });
  } catch (error) {
    return handleApiError(error, res);
  }
}
