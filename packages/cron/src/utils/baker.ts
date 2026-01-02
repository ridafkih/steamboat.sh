import { Baker } from "cronbake";
import { log } from "@steam-eye/log";

export const baker = Baker.create({
  onError(error, jobName) {
    log.error({ error, jobName }, "error in cron job");
  },
});
