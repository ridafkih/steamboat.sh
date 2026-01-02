import { steamAccounts } from "@steam-eye/database/schema";
import { syncSteamGames } from "@steam-eye/steam";
import type { CronContext, CronJobDefinition } from "../types";

export default ({ database, env }: CronContext): CronJobDefinition => ({
  name: "sync-steam-games",
  cron: "@every_5_minutes",
  immediate: process.env.NODE_ENV !== "production",
  callback: async (context) => {
    const accounts = await database.select().from(steamAccounts);
    context.set("accountCount", accounts.length);

    if (accounts.length === 0) {
      return;
    }

    const results = await Promise.allSettled(
      accounts.map((account) =>
        syncSteamGames(
          database,
          account.id,
          account.steamId,
          env.STEAM_API_KEY,
        ),
      ),
    );

    const succeeded = results.filter(
      (result) => result.status === "fulfilled",
    ).length;
    const failed = results.filter(
      (result) => result.status === "rejected",
    ).length;
    const totalGamesSynced = results
      .filter(
        (result): result is PromiseFulfilledResult<number> =>
          result.status === "fulfilled",
      )
      .reduce((total, result) => total + result.value, 0);

    context.set("syncSucceeded", succeeded);
    context.set("syncFailed", failed);
    context.set("totalGamesSynced", totalGamesSynced);
  },
});
