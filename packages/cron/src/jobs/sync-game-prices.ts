import type { CronContext, CronJobDefinition } from "../types";

export default ({ api }: CronContext): CronJobDefinition => ({
  name: "sync-game-prices",
  cron: "@every_15_minutes",
  delay: "10s",
  immediate: process.env.NODE_ENV !== "production",
  callback: async (context) => {
    const result = await api.admin.steam.syncPrices();

    context.set("total", result.total);
    context.set("succeeded", result.succeeded);
    context.set("failed", result.failed);
  },
});
