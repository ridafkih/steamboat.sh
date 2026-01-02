import { count, eq } from "drizzle-orm";
import { apiKeys, keyValue } from "@steamboat/database/schema";
import type { DatabaseClient } from "@steamboat/database";
import { BootstrapError } from "./errors";
import { getValue } from "./key-value";
import { generateSecureApiKey } from "./crypto";

const FIRST_LAUNCH_KEY = "first_launch";

type BootstrapResult = {
  ready: boolean;
};

const getPermanentAdministratorKeys = async (
  database: DatabaseClient,
): Promise<number> => {
  const [selection] = await database
    .select({ count: count() })
    .from(apiKeys)
    .where(eq(apiKeys.oneTimeUse, false));

  return selection?.count ?? 0;
};

export const bootstrap = async (
  database: DatabaseClient,
): Promise<BootstrapResult> => {
  const firstLaunch = await getValue(database, FIRST_LAUNCH_KEY);
  const keyCount = await getPermanentAdministratorKeys(database);

  if (keyCount > 0 && firstLaunch === "true") {
    throw new BootstrapError(
      "Administrator keys are configured despite first launch being flagged to true. This is a critical security misconfiguration.",
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
      name: "Initial Setup Key",
      hash: apiKeyHash,
      oneTimeUse: true,
      used: false,
    });
  });

  console.warn(
    "Since this is the first time you launch, a one-time administrator API key has been generated.",
  );
  console.warn(
    "You will need to use this to get up-and-running, so save it securely until you have time to do so.",
  );
  console.warn("");
  console.warn(plainApiKey);
  console.warn("");
  console.warn("The key will not be saved, and it will never be shown again.");

  return { ready: true };
};
