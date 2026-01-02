import type { CronOptions } from "cronbake";
import type { Client } from "@steamboat/api/client";
import type { Logger } from "@steamboat/log";

export type CronContext = {
  api: Client;
  log: Logger;
};

export type JobContext = {
  set: (key: string, value: unknown) => void;
};

export type CronJobDefinition = Omit<CronOptions, "callback"> & {
  callback: (context: JobContext) => Promise<void>;
};
