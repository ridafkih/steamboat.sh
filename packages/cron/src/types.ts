import type { CronOptions } from "cronbake";
import type { DatabaseClient } from "@steamboat/database";
import type { Logger } from "@steamboat/log";

export type CronEnv = {
  DATABASE_URL: string;
  STEAM_API_KEY: string;
};

export type CronContext = {
  database: DatabaseClient;
  env: CronEnv;
  log: Logger;
};

export type JobContext = {
  set: (key: string, value: unknown) => void;
};

export type CronJobDefinition = Omit<CronOptions, "callback"> & {
  callback: (context: JobContext) => Promise<void>;
};
