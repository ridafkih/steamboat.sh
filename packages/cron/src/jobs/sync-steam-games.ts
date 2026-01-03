import type { CronContext, CronJobDefinition } from "../types";

export default ({ api }: CronContext): CronJobDefinition => ({
  name: "sync-steam-games",
  cron: "@every_5_minutes",
  delay: "5s",
  immediate: process.env.NODE_ENV !== "production",
  callback: async (context) => {
    const result = await api.admin.steam.syncAll();

    context.set("syncSucceeded", result.succeeded);
    context.set("syncFailed", result.failed);
    context.set("totalGamesSynced", result.totalGamesSynced);

    if (result.errors.length > 0) {
      context.set("errors", result.errors);
    }
  },
});
