import { drizzle } from "drizzle-orm/bun-sqlite";
import { Database } from "bun:sqlite";
import * as schema from "./database/schema";

export type DatabaseClient = ReturnType<typeof createDatabase>;

export const createDatabase = (path: string) => {
  const sqlite = new Database(path);
  return drizzle(sqlite, { schema });
};
