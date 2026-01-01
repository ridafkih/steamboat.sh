import { eq } from "drizzle-orm";
import { keyValue } from "@steam-eye/database/schema";
import type { DatabaseClient } from "@steam-eye/database";

export const getValue = async (
  database: DatabaseClient,
  key: string,
): Promise<string | undefined> => {
  const { value } =
    (await database.query.keyValue.findFirst({
      where: eq(keyValue.key, key),
    })) ?? {};

  return value;
};
