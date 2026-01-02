import { eq } from "drizzle-orm";
import { keyValue } from "@steamboat/database/schema";
import type { DatabaseClient } from "@steamboat/database";

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
