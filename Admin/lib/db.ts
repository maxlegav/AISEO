import clientPromise from "./mongo";

const DB_NAME = "ShowYourBrand";

export async function getDb() {
  const client = await clientPromise;
  return client.db(DB_NAME);
}
