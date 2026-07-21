import type { NextApiRequest, NextApiResponse } from "next";
import mongoose from "mongoose";
import Client from "@/models/Client";
import Project from "@/models/Project";
import { handleApiError } from "@/lib/error-handler";
import { requireWorkspace, requireManager } from "@/lib/api-workspace";

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) return;
  await mongoose.connect(process.env.MONGODB_URI!);
};

function str(v: unknown, max: number): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { workspace } = await requireWorkspace(req, res);
    await connectDB();
    const organizationId = workspace.organizationId;

    if (req.method === "GET") {
      const clients = await Client.find({ organizationId, archived: false })
        .sort({ createdAt: -1 })
        .lean();
      const counts = await Project.aggregate<{ _id: mongoose.Types.ObjectId | null; n: number }>([
        { $match: { organizationId: new mongoose.Types.ObjectId(organizationId) } },
        { $group: { _id: "$clientId", n: { $sum: 1 } } },
      ]);
      const countById = new Map(
        counts.filter((c) => c._id).map((c) => [c._id!.toString(), c.n]),
      );
      const data = clients.map((c) => ({
        ...c,
        projectCount: countById.get(c._id.toString()) ?? 0,
      }));
      return res.status(200).json({ success: true, data });
    }

    if (req.method === "POST") {
      requireManager(workspace);
      const name = str(req.body.name, 120);
      if (!name) {
        return res.status(400).json({
          success: false,
          error: "VALIDATION_ERROR",
          message: "Le nom du client est requis.",
        });
      }
      const client = await Client.create({
        organizationId,
        name,
        websiteUrl: str(req.body.websiteUrl, 300) || undefined,
        contactEmail: str(req.body.contactEmail, 200) || undefined,
      });
      return res.status(201).json({ success: true, data: client });
    }

    return res.status(405).json({ success: false, error: "METHOD_NOT_ALLOWED" });
  } catch (error) {
    return handleApiError(error, res);
  }
}
