import type { CronOptions } from "cronbake";
import type { Logger } from "@steam-eye/log";
import type { CronJobDefinition, JobContext } from "../types";

export const injectJobs = (
  jobs: CronJobDefinition[],
  log: Logger,
): CronOptions[] => {
  return jobs.map(({ callback, ...job }) => ({
    ...job,
    callback: async () => {
      const contextMap = new Map<string, unknown>();
      const startTime = Date.now();

      contextMap.set("jobName", job.name);
      contextMap.set("cron", job.cron);

      const jobContext: JobContext = {
        set: (key, value) => contextMap.set(key, value),
      };

      try {
        await callback(jobContext);
        contextMap.set("status", "completed");
      } catch (error) {
        contextMap.set("status", "failed");
        contextMap.set(
          "error.type",
          error instanceof Error ? error.constructor.name : "UnknownError",
        );
        contextMap.set(
          "error.message",
          error instanceof Error ? error.message : String(error),
        );
        contextMap.set(
          "error.stack",
          error instanceof Error ? error.stack : undefined,
        );
      }

      const durationMs = Date.now() - startTime;
      contextMap.set("durationMs", durationMs);

      const level = contextMap.get("status") === "failed" ? "error" : "info";
      log[level](Object.fromEntries(contextMap), "cron job executed");
    },
  }));
};
