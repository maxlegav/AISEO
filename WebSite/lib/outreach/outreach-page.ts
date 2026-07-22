/**
 * Server-side data for the Outreach page (`/app/[projectId]/outreach`).
 * Returns the project meta plus every prepared outreach target and the
 * organization suppression list, in a JSON-serializable shape for
 * getServerSideProps.
 */
import mongoose from "mongoose";
import Project from "@/models/Project";
import OutreachTarget, {
  type OutreachStatus,
  type ContactSource,
} from "@/models/OutreachTarget";
import OutreachSuppression from "@/models/OutreachSuppression";
import { hasScores } from "@/lib/monitoring/impact";
import type { LLMId } from "@/lib/monitoring/types";

/** Max outreach drafts an agent prepares per project per day. */
export const OUTREACH_DAILY_CAP = 20;

export interface OutreachTargetView {
  id: string;
  domain: string;
  sampleUrl: string;
  engines: LLMId[];
  citations: number;
  relevanceScore: number;
  contactEmail: string | null;
  contactSource: ContactSource;
  status: OutreachStatus;
  subject: string;
  body: string;
  mock: boolean;
  provider: LLMId | null;
  sentAt: string | null;
  createdAt: string;
}

export interface SuppressionView {
  id: string;
  email: string;
  reason: string;
  createdAt: string;
}

export interface OutreachProjectMeta {
  id: string;
  brandName: string;
  websiteUrl: string;
  category: string;
  pendingFirstRun: boolean;
}

export interface OutreachPageData {
  project: OutreachProjectMeta | null;
  targets: OutreachTargetView[];
  suppressions: SuppressionView[];
  dailyRemaining: number;
}

async function connectDB(): Promise<void> {
  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(process.env.MONGODB_URI!);
  }
}

interface LeanProject {
  _id: mongoose.Types.ObjectId;
  brandName: string;
  websiteUrl: string;
  category?: string;
}

/** How many more drafts can be prepared today for this project. */
export async function draftsRemainingToday(
  projectId: mongoose.Types.ObjectId | string,
): Promise<number> {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const usedToday = await OutreachTarget.countDocuments({
    projectId,
    createdAt: { $gte: start },
  });
  return Math.max(0, OUTREACH_DAILY_CAP - usedToday);
}

export async function getOutreachData(
  organizationId: string,
  projectId: string,
): Promise<OutreachPageData> {
  await connectDB();

  const empty: OutreachPageData = {
    project: null,
    targets: [],
    suppressions: [],
    dailyRemaining: OUTREACH_DAILY_CAP,
  };
  if (!mongoose.Types.ObjectId.isValid(projectId)) return empty;

  const p = (await Project.findOne({ _id: projectId, organizationId })
    .select("brandName websiteUrl category")
    .lean()) as unknown as LeanProject | null;
  if (!p) return empty;

  const scored = await hasScores(p._id);

  const targetDocs = await OutreachTarget.find({ projectId: p._id })
    .sort({ relevanceScore: -1, createdAt: -1 })
    .lean();

  const targets: OutreachTargetView[] = targetDocs.map((t) => ({
    id: t._id.toString(),
    domain: t.domain,
    sampleUrl: t.sampleUrl ?? "",
    engines: (t.engines ?? []) as LLMId[],
    citations: t.citations ?? 0,
    relevanceScore: t.relevanceScore ?? 0,
    contactEmail: t.contactEmail ?? null,
    contactSource: t.contactSource ?? null,
    status: t.status,
    subject: t.editedSubject ?? t.draftSubject ?? "",
    body: t.editedBody ?? t.draftBody ?? "",
    mock: t.mock ?? true,
    provider: (t.provider as LLMId | null) ?? null,
    sentAt: t.sentAt ? new Date(t.sentAt).toISOString() : null,
    createdAt: new Date(t.createdAt).toISOString(),
  }));

  const suppressionDocs = await OutreachSuppression.find({ organizationId })
    .sort({ createdAt: -1 })
    .lean();
  const suppressions: SuppressionView[] = suppressionDocs.map((s) => ({
    id: s._id.toString(),
    email: s.email,
    reason: s.reason ?? "",
    createdAt: new Date(s.createdAt).toISOString(),
  }));

  return {
    project: {
      id: p._id.toString(),
      brandName: p.brandName,
      websiteUrl: p.websiteUrl,
      category: p.category ?? "",
      pendingFirstRun: !scored,
    },
    targets,
    suppressions,
    dailyRemaining: await draftsRemainingToday(p._id),
  };
}
