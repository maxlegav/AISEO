import type { NextApiRequest, NextApiResponse } from "next";
import mongoose from "mongoose";
import Project from "@/models/Project";
import User from "@/models/User";
import { runProjectMonitoring } from "@/lib/monitoring/pipeline";
import { getWorkspacePlan } from "@/lib/monitoring/workspace";
import { getUsage, canAfford } from "@/lib/monitoring/usage";
import type { SubscriptionTier } from "@/lib/subscription-limits";
import { sendMonitoringAlertEmail } from "@/lib/email";
import { LLMS, isLLMId } from "@/lib/monitoring/types";
import { nextRunDate } from "@/lib/monitoring/week";

/**
 * Vercel Cron entry point. Runs every active project whose next run is due,
 * recomputes scores and sends alert emails on significant moves.
 *
 * Auth: Vercel Cron sends `Authorization: Bearer $CRON_SECRET`. A single
 * project can also be forced with `?projectId=...` (same auth) for testing.
 */

// Monitoring runs can take a while (many prompts × engines).
export const config = { maxDuration: 300 };

async function connectDB() {
  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(process.env.MONGODB_URI!);
  }
}

function isAuthorized(req: NextApiRequest): boolean {
  const secret = process.env.CRON_SECRET;
  // In dev with no secret configured, allow local runs.
  if (!secret) return process.env.NODE_ENV !== "production";
  const auth = req.headers.authorization;
  return auth === `Bearer ${secret}`;
}

function engineLabel(scope: string): string {
  return isLLMId(scope) ? LLMS[scope].name : "Global";
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!isAuthorized(req)) {
    return res.status(401).json({ success: false, error: "UNAUTHORIZED" });
  }

  try {
    await connectDB();

    const projectId = req.query.projectId as string | undefined;
    const now = new Date();
    const query = projectId
      ? { _id: projectId }
      : {
          active: true,
          $or: [{ nextRunAt: { $lte: now } }, { nextRunAt: null }],
        };

    const projects = await Project.find(query).limit(50);
    const summaries = [];
    const skipped: { projectId: string; brandName: string; reason: string }[] = [];

    // Usage is per organization and read once per org, not per project: the
    // cron can hold dozens of projects belonging to the same workspace.
    const usageCache = new Map<string, Awaited<ReturnType<typeof getUsage>>>();

    for (const project of projects) {
      const orgId = project.organizationId?.toString() ?? "";
      let usage = usageCache.get(orgId);
      if (!usage) {
        const { tier } = await getWorkspacePlan(project.userId.toString());
        usage = await getUsage(orgId, tier as SubscriptionTier);
        usageCache.set(orgId, usage);
      }

      const cost = project.prompts.length * (project.llms.length || 1);
      if (!canAfford(usage, cost)) {
        skipped.push({
          projectId: project._id.toString(),
          brandName: project.brandName,
          reason: `budget épuisé (${usage.used}/${usage.budget})`,
        });
        // Push the next attempt out so a saturated workspace does not retry on
        // every cron tick for the rest of the month.
        project.nextRunAt = nextRunDate(project.frequency);
        await project.save();
        continue;
      }
      // Keep the cached counter in step within this tick.
      usage.used += cost;

      const summary = await runProjectMonitoring(project);
      summaries.push(summary);

      if (summary.alerts.length > 0) {
        const user = await User.findById(project.userId).lean();
        if (user?.email) {
          await sendMonitoringAlertEmail({
            email: user.email,
            userName: user.name || user.email,
            brandName: project.brandName,
            projectUrl: `${process.env.NEXTAUTH_URL || ""}/app/${project._id}`,
            globalScore: summary.globalScore,
            changes: summary.alerts.map((a) => ({
              engine: engineLabel(a.scope),
              delta: a.delta,
            })),
            language: (user.language as "en" | "fr") || "fr",
          });
        }
      }
    }

    return res.status(200).json({
      success: true,
      data: { ranProjects: summaries.length, summaries, skippedForBudget: skipped },
    });
  } catch (error) {
    console.error("[cron/run-monitoring]", error);
    return res.status(500).json({ success: false, error: "INTERNAL_SERVER_ERROR" });
  }
}
