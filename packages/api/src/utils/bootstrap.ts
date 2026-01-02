import { count } from "drizzle-orm";
import { apiKeys, keyValue } from "@steamboat/database/schema";
import type { DatabaseClient } from "@steamboat/database";
import { BootstrapError } from "./errors";
import { getValue } from "./key-value";
import { generateSecureApiKey } from "./crypto";

const FIRST_LAUNCH_KEY = "first_launch";

type BootstrapResult = {
  ready: boolean;
};

const getApiKeyCount = async (database: DatabaseClient): Promise<number> => {
  const [selection] = await database
    .select({ count: count() })
    .from(apiKeys);

  return selection?.count ?? 0;
};

export const bootstrap = async (
  database: DatabaseClient,
): Promise<BootstrapResult> => {
  const firstLaunch = await getValue(database, FIRST_LAUNCH_KEY);
  const keyCount = await getApiKeyCount(database);

  if (keyCount > 0 && firstLaunch === "true") {
    throw new BootstrapError(
      "API keys exist despite first launch being flagged. This is a critical security misconfiguration.",
    );
  }

  if (keyCount === 0 && firstLaunch === "true") {
    return { ready: false };
  }

  const plainApiKey = generateSecureApiKey();
  const apiKeyHash = await Bun.password.hash(plainApiKey, "argon2id");

  await database.transaction(async (transaction) => {
    await transaction
      .insert(keyValue)
      .values({ key: FIRST_LAUNCH_KEY, value: "true" })
      .onConflictDoUpdate({
        target: keyValue.key,
        set: { value: "true", updatedAt: new Date() },
      });

    await transaction.insert(apiKeys).values({
      name: "Administrator Key",
      hash: apiKeyHash,
    });
  });

  console.warn("First launch: an administrator API key has been generated.");
  console.warn("Save it securely, it will never be shown again.");
  console.warn("");
  console.warn(plainApiKey);
  console.warn("");

  return { ready: true };
};
