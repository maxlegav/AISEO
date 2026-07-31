/* eslint-disable */
/**
 * Backfill weekly history for demo projects so the 12-week charts have a curve.
 *
 * A freshly seeded project has a single run, hence a single `WeeklyScore` per
 * scope and a flat (empty) evolution chart. This writes the *previous* weeks.
 *
 * Coherence, without duplicating the scoring rules: the global score is a
 * weighted mean of the per-engine presence rates
 * (`computeGlobalScore` in lib/monitoring/scoring.ts). It is therefore linear —
 * scaling every engine by the same factor `f` scales the global by exactly `f`.
 * So each past week is the real, pipeline-computed current week multiplied by a
 * per-week factor, applied to *every* scope including `global`. The weighting
 * stays exact and this script never needs to know `ENGINE_WEIGHTS`.
 *
 * Only `WeeklyScore` documents are written: they are what the evolution chart
 * reads. Per-prompt results stay attached to the real run, so nothing anywhere
 * claims an engine answered something it never answered.
 *
 * Usage:
 *   node scripts/backfill-demo-history.js            # 11 weeks before the current one
 *   WEEKS=8 node scripts/backfill-demo-history.js
 *   RESET=1 node scripts/backfill-demo-history.js    # drop previously backfilled weeks first
 */
require("dotenv").config({ path: ".env.local" });
const mongoose = require("mongoose");

const WEEKS = Number(process.env.WEEKS || 11);
const RESET = process.env.RESET === "1";
const EMAIL = process.env.TARGET_EMAIL || "showyourbrand@syb.com";

/** ISO week key ("2026-W31") for a date — mirrors lib/monitoring/week.ts. */
function isoWeek(date) {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

/** Deterministic 0..1 noise so every brand gets its own shape, reproducibly. */
function noise(seed, i) {
  const x = Math.sin(seed * 928371 + i * 7919) * 43758.5453;
  return x - Math.floor(x);
}

function hash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return Math.abs(h) % 1000;
}

/**
 * Growth factors for the weeks preceding the current one, oldest first.
 * Ends at 1 (the real measured week). Rises overall, with small dips so the
 * curve looks measured rather than drawn.
 */
function factors(seed, n) {
  const start = 0.45 + noise(seed, 0) * 0.25; // between 45% and 70% of today
  const out = [];
  for (let i = 0; i < n; i++) {
    const t = i / n;
    const wobble = (noise(seed, i + 1) - 0.5) * 0.07;
    out.push(Math.min(1.05, Math.max(0.15, start + (1 - start) * t + wobble)));
  }
  return out;
}

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;

  const user = await db.collection("users").findOne({ email: EMAIL });
  if (!user) throw new Error(`No account ${EMAIL}`);
  const org = await db.collection("organizations").findOne({ ownerId: user._id });
  if (!org) throw new Error(`No organization for ${EMAIL}`);

  const projects = await db
    .collection("projects")
    .find({ organizationId: org._id })
    .toArray();
  console.log(`${projects.length} project(s) on ${EMAIL}`);

  const now = new Date();
  const currentWeek = isoWeek(now);
  const pastWeeks = [];
  for (let i = WEEKS; i >= 1; i--) {
    const d = new Date(now);
    d.setUTCDate(d.getUTCDate() - i * 7);
    pastWeeks.push(isoWeek(d));
  }

  let written = 0;

  for (const p of projects) {
    const current = await db
      .collection("weeklyscores")
      .find({ projectId: p._id, week: currentWeek })
      .toArray();

    if (current.length === 0) {
      console.log(`- ${p.brandName}: no run for ${currentWeek}, skipped`);
      continue;
    }

    if (RESET) {
      await db
        .collection("weeklyscores")
        .deleteMany({ projectId: p._id, week: { $in: pastWeeks } });
    }

    const seed = hash(p.brandName);
    const fs = factors(seed, pastWeeks.length);

    // presenceRate per (scope, weekIndex), so deltas chain correctly.
    const byScope = new Map();
    for (const doc of current) {
      byScope.set(
        doc.scope,
        fs.map((f) => Math.round(doc.presenceRate * f)),
      );
    }

    for (let i = 0; i < pastWeeks.length; i++) {
      const week = pastWeeks[i];
      for (const doc of current) {
        const series = byScope.get(doc.scope);
        const value = series[i];
        const previous = i === 0 ? null : series[i - 1];

        await db.collection("weeklyscores").updateOne(
          { projectId: p._id, scope: doc.scope, week },
          {
            $set: {
              projectId: p._id,
              userId: doc.userId,
              scope: doc.scope,
              week,
              presenceRate: value,
              avgPosition: doc.avgPosition ?? null,
              deltaVsLastWeek: previous === null ? 0 : value - previous,
              backfilled: true,
            },
          },
          { upsert: true },
        );
        written++;
      }
    }

    // The real current week's delta must follow the last backfilled week.
    for (const doc of current) {
      const series = byScope.get(doc.scope);
      const previous = series[series.length - 1];
      await db
        .collection("weeklyscores")
        .updateOne(
          { _id: doc._id },
          { $set: { deltaVsLastWeek: doc.presenceRate - previous } },
        );
    }

    const g = current.find((d) => d.scope === "global");
    console.log(
      `✓ ${p.brandName}: ${pastWeeks.length} weeks backfilled` +
        (g ? ` (global ${Math.round(g.presenceRate * fs[0])} → ${g.presenceRate})` : ""),
    );
  }

  console.log(`\n${written} WeeklyScore documents written (flagged backfilled: true).`);
  console.log(`Weeks: ${pastWeeks[0]} … ${pastWeeks[pastWeeks.length - 1]} + real ${currentWeek}`);
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
