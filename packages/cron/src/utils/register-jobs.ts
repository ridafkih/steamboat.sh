import type { CronOptions, ICron } from "cronbake";
import type { Logger } from "@steamboat/log";
import { baker } from "./baker";

export const registerJobs = (jobs: CronOptions[], log: Logger): ICron[] => {
  const crons: ICron[] = [];

  for (const job of jobs) {
    log.info({ jobName: job.name, cron: job.cron }, "registering cron job");
    const cron = baker.add(job);
    crons.push(cron);
  }

  baker.bakeAll();
  return crons;
};
