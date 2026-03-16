import clientPromise from "./mongo";

const DB_NAME = "showyourbrand";

export async function getDb() {
  const client = await clientPromise;
  return client.db(DB_NAME);
}
