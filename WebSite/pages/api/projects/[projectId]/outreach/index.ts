import type { NextApiRequest, NextApiResponse } from "next";
import mongoose from "mongoose";
import { z } from "zod";
import Project from "@/models/Project";
import MonitoredSource from "@/models/MonitoredSource";
import OutreachTarget from "@/models/OutreachTarget";
import OutreachSuppression from "@/models/OutreachSuppression";
import { handleApiError, ApiError, ErrorType } from "@/lib/error-handler";
import { requireWorkspace } from "@/lib/api-workspace";
import { domainOf } from "@/lib/monitoring/source-extraction";
import { findContactEmail } from "@/lib/outreach/contact";
import { generateOutreachDraft, relevanceScore } from "@/lib/outreach/draft";
import { draftsRemainingToday } from "@/lib/outreach/outreach-page";
import type { LLMId } from "@/lib/monitoring/types";

// Generation fetches contact pages + hits an LLM per target, so give it room.
export const config = { maxDuration: 60 };

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) return;
  await mongoose.connect(process.env.MONGODB_URI!);
};

const GenerateSchema = z.object({
  action: z.literal("generate"),
  /** Max new targets to prepare in this call (bounded by the daily cap). */
  limit: z.number().int().min(1).max(20).optional(),
});

interface DomainAgg {
  domain: string;
  sampleUrl: string;
  citations: number;
  engines: Set<LLMId>;
}

/** Aggregate MonitoredSource rows into domains the engines cite but that ignore the brand. */
function aggregateTargets(
  sources: { url: string; domain: string; llm: LLMId; citesBrand: boolean; citations: number }[],
): DomainAgg[] {
  const byDomain = new Map<string, DomainAgg>();
  const brandDomains = new Set<string>();
  for (const s of sources) {
    if (s.citesBrand) brandDomains.add(s.domain);
  }
  for (const s of sources) {
    if (s.citesBrand || brandDomains.has(s.domain)) continue;
    const agg = byDomain.get(s.domain);
    if (agg) {
      agg.citations += s.citations;
      agg.engines.add(s.llm);
      if (!agg.sampleUrl) agg.sampleUrl = s.url;
    } else {
      byDomain.set(s.domain, {
        domain: s.domain,
        sampleUrl: s.url,
        citations: s.citations,
        engines: new Set([s.llm]),
      });
    }
  }
  return Array.from(byDomain.values()).sort((a, b) => b.citations - a.citations);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { userId, workspace } = await requireWorkspace(req, res);
    await connectDB();

    const project = await Project.findById(req.query.projectId as string);
    if (!project) throw new ApiError(ErrorType.NOT_FOUND, "Project not found");
    if (project.organizationId?.toString() !== workspace.organizationId) {
      throw new ApiError(ErrorType.NOT_FOUND, "Project not found");
    }

    if (req.method === "GET") {
      const targets = await OutreachTarget.find({ projectId: project._id })
        .sort({ relevanceScore: -1, createdAt: -1 })
        .lean();
      return res.status(200).json({ success: true, data: targets });
    }

    if (req.method === "POST") {
      const parsed = GenerateSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new ApiError(ErrorType.VALIDATION, "Invalid outreach request");
      }

      const remaining = await draftsRemainingToday(project._id);
      if (remaining <= 0) {
        throw new ApiError(
          ErrorType.RATE_LIMIT,
          "Plafond quotidien de brouillons atteint pour ce projet. Réessayez demain.",
        );
      }
      const budget = Math.min(remaining, parsed.data.limit ?? remaining);

      const sourceDocs = await MonitoredSource.find({ projectId: project._id }).lean();
      const aggregated = aggregateTargets(
        sourceDocs.map((s) => ({
          url: s.url,
          domain: s.domain,
          llm: s.llm as LLMId,
          citesBrand: s.citesBrand,
          citations: s.citations,
        })),
      );

      // Skip domains already tracked and suppressed emails' domains.
      const existing = await OutreachTarget.find({ projectId: project._id })
        .select("domain")
        .lean();
      const tracked = new Set(existing.map((t) => t.domain));
      const suppressed = await OutreachSuppression.find({
        organizationId: workspace.organizationId,
      })
        .select("email")
        .lean();
      const suppressedEmails = new Set(suppressed.map((s) => s.email.toLowerCase()));

      const ownDomain = domainOf(project.websiteUrl);
      const created: unknown[] = [];

      for (const agg of aggregated) {
        if (created.length >= budget) break;
        if (agg.domain === ownDomain || tracked.has(agg.domain)) continue;

        const engines = Array.from(agg.engines);
        const contact = await findContactEmail(agg.domain);
        if (contact.email && suppressedEmails.has(contact.email.toLowerCase())) {
          continue;
        }

        const draft = await generateOutreachDraft({
          brandName: project.brandName,
          websiteUrl: project.websiteUrl,
          category: project.category ?? "",
          domain: agg.domain,
          sampleUrl: agg.sampleUrl,
          engines,
          citations: agg.citations,
        });

        const doc = await OutreachTarget.create({
          projectId: project._id,
          organizationId: project.organizationId,
          userId,
          domain: agg.domain,
          sampleUrl: agg.sampleUrl,
          engines,
          citations: agg.citations,
          relevanceScore: relevanceScore(agg.citations, engines),
          contactEmail: contact.email,
          contactSource: contact.source,
          status: "draft",
          draftSubject: draft.subject,
          draftBody: draft.body,
          mock: draft.mock,
          provider: draft.provider ?? null,
        });
        tracked.add(agg.domain);
        created.push(doc.toObject());
      }

      return res.status(201).json({
        success: true,
        data: { created: created.length, targets: created },
      });
    }

    return res.status(405).json({ success: false, error: "METHOD_NOT_ALLOWED" });
  } catch (error) {
    return handleApiError(error, res);
  }
}
