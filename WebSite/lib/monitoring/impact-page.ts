/**
 * Server-side data for the Impact page (`/app/[projectId]/impact`).
 * Returns the project meta (with real prompt strings, for the tracking form)
 * plus every tracked action with its computed before/after impact, all in a
 * JSON-serializable shape for getServerSideProps.
 */
import mongoose from "mongoose";
import Project from "@/models/Project";
import GeoAction, {
  type GeoActionKind,
  type GeoActionStatus,
  type EngineRate,
  type ScoreSnapshot,
} from "@/models/GeoAction";
import { computeImpact, hasScores, type ImpactResult } from "@/lib/monitoring/impact";

export interface ActionSnapshotView {
  week: string;
  globalScore: number;
  engines: EngineRate[];
  promptEnginesCiting: number | null;
  promptEnginesTotal: number | null;
}

export interface ActionView {
  id: string;
  kind: GeoActionKind;
  title: string;
  prompt: string | null;
  publishedUrl: string | null;
  status: GeoActionStatus;
  createdAt: string;
  measuredAt: string | null;
  baseline: ActionSnapshotView;
  after: ActionSnapshotView | null;
  impact: ImpactResult | null;
}

export interface ImpactProjectMeta {
  id: string;
  brandName: string;
  websiteUrl: string;
  prompts: string[];
  pendingFirstRun: boolean;
}

export interface ImpactPageData {
  project: ImpactProjectMeta | null;
  hasScores: boolean;
  actions: ActionView[];
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
  prompts: string[];
}

function snapshotView(s: ScoreSnapshot): ActionSnapshotView {
  return {
    week: s.week,
    globalScore: s.globalScore,
    engines: s.engines.map((e) => ({ llm: e.llm, presenceRate: e.presenceRate })),
    promptEnginesCiting: s.promptEnginesCiting ?? null,
    promptEnginesTotal: s.promptEnginesTotal ?? null,
  };
}

export async function getImpactData(
  organizationId: string,
  projectId: string,
): Promise<ImpactPageData> {
  await connectDB();

  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    return { project: null, hasScores: false, actions: [] };
  }
  const p = (await Project.findOne({ _id: projectId, organizationId })
    .select("brandName websiteUrl prompts")
    .lean()) as unknown as LeanProject | null;
  if (!p) return { project: null, hasScores: false, actions: [] };

  const scored = await hasScores(p._id);

  const actionDocs = (await GeoAction.find({ projectId: p._id })
    .sort({ createdAt: -1 })
    .lean()) as unknown as (Omit<
    ActionView,
    "id" | "createdAt" | "measuredAt" | "baseline" | "after" | "impact"
  > & {
    _id: mongoose.Types.ObjectId;
    createdAt: Date;
    measuredAt: Date | null;
    baseline: ScoreSnapshot;
    after: ScoreSnapshot | null;
  })[];

  const actions: ActionView[] = actionDocs.map((a) => ({
    id: a._id.toString(),
    kind: a.kind,
    title: a.title,
    prompt: a.prompt ?? null,
    publishedUrl: a.publishedUrl ?? null,
    status: a.status,
    createdAt: a.createdAt.toISOString(),
    measuredAt: a.measuredAt ? a.measuredAt.toISOString() : null,
    baseline: snapshotView(a.baseline),
    after: a.after ? snapshotView(a.after) : null,
    impact: a.after ? computeImpact(a.baseline, a.after) : null,
  }));

  return {
    project: {
      id: p._id.toString(),
      brandName: p.brandName,
      websiteUrl: p.websiteUrl,
      prompts: p.prompts,
      pendingFirstRun: !scored,
    },
    hasScores: scored,
    actions,
  };
}
