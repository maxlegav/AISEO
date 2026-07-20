/**
 * The monitoring pipeline: run one project's prompts across its LLMs, store the
 * raw results, recompute scores/sources, and flag significant score changes.
 *
 * This is the "server" of SYB v2 — it lives entirely inside the Next.js app and
 * is driven by a Vercel Cron endpoint. No external Python service.
 */

import mongoose from "mongoose";
import Project, { ProjectDocument } from "@/models/Project";
import LLMResult from "@/models/LLMResult";
import WeeklyScore from "@/models/WeeklyScore";
import MonitoredSource from "@/models/MonitoredSource";
import { queryLLM } from "@/lib/llm";
import { detectBrand, brandPosition } from "./brand-detection";
import { extractSources, domainOf } from "./source-extraction";
import {
  computeLLMScores,
  computeGlobalScore,
  computeDelta,
  ResultInput,
} from "./scoring";
import { isoWeek, nextRunDate } from "./week";
import type { LLMId } from "./types";
import { LLM_ORDER } from "./types";

/** Alert when a scope's presence rate moves by at least this many points. */
export const ALERT_THRESHOLD_PTS = 10;

export interface RunSummary {
  projectId: string;
  runId: string;
  week: string;
  resultsStored: number;
  usedMock: boolean;
  globalScore: number;
  alerts: { scope: LLMId | "global"; delta: number }[];
}

async function connectDB() {
  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(process.env.MONGODB_URI!);
  }
}

/** Run monitoring for a single project and persist everything. */
export async function runProjectMonitoring(project: ProjectDocument): Promise<RunSummary> {
  await connectDB();

  const runId = new mongoose.Types.ObjectId().toString();
  const week = isoWeek();
  const llms = project.llms.length ? project.llms : LLM_ORDER;
  const results: ResultInput[] = [];
  let usedMock = false;
  let resultsStored = 0;

  // Track sources per (llm, url) for this run.
  const sourceAgg = new Map<string, { llm: LLMId; url: string; domain: string; citesBrand: boolean; count: number }>();

  for (const prompt of project.prompts) {
    // Query the configured engines for this prompt in parallel.
    const answers = await Promise.all(
      llms.map(async (llm) => {
        const resp = await queryLLM(prompt, { brandName: project.brandName, llm });
        return { llm, resp };
      }),
    );

    for (const { llm, resp } of answers) {
      if (resp.mock) usedMock = true;
      const mentioned = detectBrand(resp.text, project.brandName).found;
      const position = mentioned
        ? brandPosition(resp.text, project.brandName, project.competitors)
        : null;
      const sources = extractSources(resp.text, resp.citations);

      results.push({ llm, brandMentioned: mentioned, brandPosition: position });

      await LLMResult.create({
        projectId: project._id,
        userId: project.userId,
        runId,
        week,
        llm,
        prompt,
        responseText: resp.text,
        brandMentioned: mentioned,
        brandPosition: position,
        sourcesCited: sources.map((s) => s.url),
        mock: resp.mock,
      });
      resultsStored++;

      for (const s of sources) {
        const key = `${llm}::${s.url}`;
        const citesBrand = detectBrand(s.url, project.brandName).found ||
          detectBrand(domainOf(s.url), project.brandName).found;
        const existing = sourceAgg.get(key);
        if (existing) {
          existing.count++;
          existing.citesBrand = existing.citesBrand || citesBrand;
        } else {
          sourceAgg.set(key, { llm, url: s.url, domain: s.domain, citesBrand, count: 1 });
        }
      }
    }
  }

  // --- Scores ------------------------------------------------------------
  const llmScores = computeLLMScores(results);
  const globalScore = computeGlobalScore(llmScores);
  const alerts: { scope: LLMId | "global"; delta: number }[] = [];

  const upsertScore = async (
    scope: LLMId | "global",
    presenceRate: number,
    avgPosition: number | null,
  ) => {
    const prev = await WeeklyScore.findOne({ projectId: project._id, scope })
      .sort({ week: -1 })
      .lean();
    const delta = computeDelta(presenceRate, prev?.presenceRate ?? null);
    if (Math.abs(delta) >= ALERT_THRESHOLD_PTS) alerts.push({ scope, delta });

    await WeeklyScore.findOneAndUpdate(
      { projectId: project._id, scope, week },
      { presenceRate, avgPosition, deltaVsLastWeek: delta },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
  };

  for (const s of llmScores) {
    await upsertScore(s.llm, s.presenceRate, s.avgPosition);
  }
  const globalAvgPos = (() => {
    const positions = llmScores
      .map((s) => s.avgPosition)
      .filter((p): p is number => typeof p === "number");
    if (positions.length === 0) return null;
    return Math.round((positions.reduce((a, b) => a + b, 0) / positions.length) * 10) / 10;
  })();
  await upsertScore("global", globalScore, globalAvgPos);

  // --- Sources -----------------------------------------------------------
  for (const s of sourceAgg.values()) {
    await MonitoredSource.findOneAndUpdate(
      { projectId: project._id, llm: s.llm, url: s.url },
      {
        domain: s.domain,
        citesBrand: s.citesBrand,
        citations: s.count,
        lastSeenAt: new Date(),
        $setOnInsert: { firstSeenAt: new Date() },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
  }

  // --- Project bookkeeping ----------------------------------------------
  await Project.findByIdAndUpdate(project._id, {
    lastRunAt: new Date(),
    nextRunAt: nextRunDate(project.frequency),
  });

  return {
    projectId: project._id.toString(),
    runId,
    week,
    resultsStored,
    usedMock,
    globalScore,
    alerts,
  };
}
