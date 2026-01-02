import { drizzle } from "drizzle-orm/bun-sql";
import * as schema from "./database/schema";

export type DatabaseClient = ReturnType<typeof createDatabase>;

export const createDatabase = (url: string) => {
  return drizzle(url, { schema });
};
