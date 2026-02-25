/**
 * Migration: convert audit userId and businessId from plain strings to BSON ObjectId.
 *
 * Background: the WebSite previously wrote these fields as plain strings.
 * The Audit Mongoose model now declares them as ObjectId, so existing
 * string-typed documents must be converted for queries to match.
 *
 * Usage:
 *   MONGODB_URI=mongodb+srv://... node scripts/migrate-audit-ids-to-objectid.js
 *
 * Safe to re-run: documents already stored as ObjectId are skipped.
 */

const { MongoClient, ObjectId } = require('mongodb');

const DB_NAME = 'ShowYourBrand';

async function migrate() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('Error: MONGODB_URI environment variable is not set.');
    process.exit(1);
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db(DB_NAME);
    const audits = db.collection('audits');

    const total = await audits.countDocuments();
    console.log(`Total audit documents: ${total}`);

    let converted = 0;
    let skipped = 0;
    let errors = 0;

    const cursor = audits.find({});

    for await (const doc of cursor) {
      const updates = {};

      // Convert userId if it is a plain string
      if (typeof doc.userId === 'string') {
        if (ObjectId.isValid(doc.userId)) {
          updates.userId = new ObjectId(doc.userId);
        } else {
          console.warn(`  [${doc._id}] userId "${doc.userId}" is not a valid ObjectId — skipping field`);
          errors++;
        }
      }

      // Convert businessId if it is a plain string
      if (typeof doc.businessId === 'string') {
        if (ObjectId.isValid(doc.businessId)) {
          updates.businessId = new ObjectId(doc.businessId);
        } else {
          console.warn(`  [${doc._id}] businessId "${doc.businessId}" is not a valid ObjectId — skipping field`);
          errors++;
        }
      }

      if (Object.keys(updates).length > 0) {
        await audits.updateOne({ _id: doc._id }, { $set: updates });
        converted++;
        if (converted % 100 === 0) {
          console.log(`  Converted ${converted} documents...`);
        }
      } else {
        skipped++;
      }
    }

    console.log('\nMigration complete:');
    console.log(`  Converted : ${converted}`);
    console.log(`  Skipped   : ${skipped} (already ObjectId)`);
    console.log(`  Errors    : ${errors}`);
  } finally {
    await client.close();
  }
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
