/* eslint-disable */
/**
 * Delete monitoring rows whose project no longer exists.
 *
 * Reseeding the demo workspace has left behind results and scores pointing at
 * deleted projects — unreachable from the app, but they inflate the collections
 * and would distort any query written against them later (a spend audit, a
 * "how many runs have we done" count). Nothing the UI reads is touched: the
 * scope is exactly "projectId is absent from the projects collection".
 *
 * Dry run by default. Pass APPLY=1 to actually delete.
 *
 * Usage:
 *   node scripts/purge-orphan-monitoring.js            # count only
 *   APPLY=1 node scripts/purge-orphan-monitoring.js    # delete
 */
const fs = require("fs");
const mongoose = require("mongoose");

const uri = (fs.readFileSync(".env.local", "utf8").match(/^MONGODB_URI=(.*)$/m) || [])[1].trim();
const APPLY = process.env.APPLY === "1";

const COLLECTIONS = ["llmresults", "weeklyscores", "monitoredsources", "geoactions", "outreachtargets"];

(async () => {
  await mongoose.connect(uri);
  const db = mongoose.connection.db;

  const ids = await db.collection("projects").distinct("_id");
  console.log(`${ids.length} projets vivants\n`);

  let total = 0;
  for (const name of COLLECTIONS) {
    const filter = { projectId: { $nin: ids } };
    const n = await db.collection(name).countDocuments(filter);
    total += n;
    if (n === 0) { console.log(`${name.padEnd(18)} rien à supprimer`); continue; }
    if (APPLY) {
      const r = await db.collection(name).deleteMany(filter);
      console.log(`${name.padEnd(18)} ${r.deletedCount} documents supprimés`);
    } else {
      console.log(`${name.padEnd(18)} ${n} documents orphelins (APPLY=1 pour supprimer)`);
    }
  }
  console.log(`\n${total} documents orphelins au total${APPLY ? " — supprimés" : ""}`);
  await mongoose.disconnect();
})().catch((e) => { console.error("ERREUR", e.message); process.exit(1); });
