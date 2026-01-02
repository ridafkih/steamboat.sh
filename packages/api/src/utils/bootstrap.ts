import { count } from "drizzle-orm";
import { apiKeys } from "@steamboat/database/schema";
import type { DatabaseClient } from "@steamboat/database";
import { generateSecureApiKey } from "./crypto";

const getApiKeyCount = async (database: DatabaseClient): Promise<number> => {
  const [selection] = await database
    .select({ count: count() })
    .from(apiKeys);

  return selection?.count ?? 0;
};

export const bootstrap = async (database: DatabaseClient): Promise<void> => {
  const keyCount = await getApiKeyCount(database);

  if (keyCount > 0) {
    return;
  }

  const plainApiKey = generateSecureApiKey();
  const apiKeyHash = await Bun.password.hash(plainApiKey, "argon2id");

  await database.insert(apiKeys).values({
    name: "Administrator Key",
    hash: apiKeyHash,
  });

  console.warn("First launch: an administrator API key has been generated.");
  console.warn("Save it securely, it will never be shown again.");
  console.warn("");
  console.warn(plainApiKey);
  console.warn("");
};
