import mongoose from "mongoose";
import type { Db } from "mongodb";

/**
 * Native MongoDB driver handle for the admin surface.
 *
 * Reuses the same Mongoose connection (and therefore the same database) as the
 * rest of the app, so the admin reads exactly the audits the client app writes.
 * The admin queries use the raw driver to read the dense `results` blob and rich
 * status set without going through the Mongoose schema.
 */
export async function getDb(): Promise<Db> {
  if (mongoose.connection.readyState < 1) {
    await mongoose.connect(process.env.MONGODB_URI!);
  }
  const db = mongoose.connection.db;
  if (!db) {
    throw new Error("MongoDB connection is not established");
  }
  return db;
}
