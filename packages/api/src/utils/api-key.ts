import { eq } from "drizzle-orm";
import { apiKeys } from "@steamboat/database/schema";
import type { DatabaseClient } from "@steamboat/database";

type ApiKey = typeof apiKeys.$inferSelect;

type VerifyResult =
  | { valid: true; key: ApiKey }
  | { valid: false; key: undefined };

export const verifyApiKey = async (
  database: DatabaseClient,
  plainKey: string,
): Promise<VerifyResult> => {
  const keys = await database.query.apiKeys.findMany();

  for (const key of keys) {
    const isValid = await Bun.password.verify(plainKey, key.hash);
    if (isValid) {
      return { valid: true, key };
    }
  }

  return { valid: false, key: undefined };
};

export const updateApiKeyLastUsed = async (
  database: DatabaseClient,
  keyId: number,
): Promise<void> => {
  await database
    .update(apiKeys)
    .set({ lastUsedAt: new Date() })
    .where(eq(apiKeys.id, keyId));
};
