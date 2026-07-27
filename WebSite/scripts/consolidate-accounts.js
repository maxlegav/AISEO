/* eslint-disable */
/**
 * Consolidate every monitored project (and its data) onto a single account.
 *
 * Creates/ensures a user + personal organization, then reassigns ALL projects
 * and their dependent documents to that user/org so one login sees everything.
 *
 * Monitoring child data (LLMResult / WeeklyScore / MonitoredSource) is keyed by
 * projectId, so it follows the project automatically.
 *
 * Usage:
 *   MONGODB_URI=mongodb://127.0.0.1:27017/syb_test \
 *   TARGET_EMAIL=showyourband@syb.com TARGET_PASSWORD=showyourbrand \
 *   node scripts/consolidate-accounts.js
 */
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/syb_test";
const EMAIL = (process.env.TARGET_EMAIL || "showyourband@syb.com").toLowerCase();
const PASSWORD = process.env.TARGET_PASSWORD || "showyourbrand";
const ORG_NAME = process.env.TARGET_ORG_NAME || "ShowYourBrand";

async function main() {
  await mongoose.connect(URI);
  const db = mongoose.connection.db;
  const now = new Date();

  // 1. Ensure the target user exists (password hashed to match credentials auth).
  const hash = await bcrypt.hash(PASSWORD, 10);
  await db.collection("users").updateOne(
    { email: EMAIL },
    {
      $set: {
        email: EMAIL,
        password: hash,
        emailVerified: now,
        subscriptionTier: "agency",
        subscriptionStatus: "active",
        language: "fr",
        deletedAt: null,
        updatedAt: now,
      },
      $setOnInsert: {
        name: "ShowYourBrand",
        auditCredits: 0,
        createdAt: now,
      },
    },
    { upsert: true },
  );
  const user = await db.collection("users").findOne({ email: EMAIL });
  const userId = user._id;

  // 2. Ensure a personal organization owned by the user + owner membership.
  let org = await db.collection("organizations").findOne({ ownerId: userId });
  if (!org) {
    const res = await db
      .collection("organizations")
      .insertOne({ name: ORG_NAME, ownerId: userId, createdAt: now, updatedAt: now });
    org = { _id: res.insertedId };
  }
  const organizationId = org._id;
  await db.collection("memberships").updateOne(
    { organizationId, email: EMAIL },
    {
      $set: {
        organizationId,
        userId,
        email: EMAIL,
        role: "owner",
        status: "active",
        acceptedAt: now,
      },
    },
    { upsert: true },
  );

  // 3. Reassign every project + dependent doc to this user/org.
  const p = await db
    .collection("projects")
    .updateMany({}, { $set: { userId, organizationId, updatedAt: now } });
  const c = await db.collection("clients").updateMany({}, { $set: { organizationId } });
  const g = await db
    .collection("geoactions")
    .updateMany({}, { $set: { organizationId, userId } });
  const o = await db
    .collection("outreachtargets")
    .updateMany({}, { $set: { organizationId, userId } });
  const s = await db
    .collection("outreachsuppressions")
    .updateMany({}, { $set: { organizationId } });

  console.log("Consolidation done:");
  console.log("  target user:", EMAIL, String(userId));
  console.log("  organization:", ORG_NAME, String(organizationId));
  console.log("  projects moved:", p.modifiedCount);
  console.log("  clients moved:", c.modifiedCount);
  console.log("  geoActions moved:", g.modifiedCount);
  console.log("  outreachTargets moved:", o.modifiedCount);
  console.log("  outreachSuppressions moved:", s.modifiedCount);

  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
