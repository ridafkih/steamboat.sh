import { eq } from "drizzle-orm";
import { games, ownedGames, steamAccounts } from "@steamboat/database/schema";
import { adminGameIdSchema } from "@steamboat/data-schemas";
import { syncSteamGames, syncMissingGamePrices } from "@steamboat/steam";
import { adminProcedure } from "../../orpc";

export const listGames = adminProcedure.handler(async ({ context }) => {
  const allGames = await context.database.query.games.findMany();
  return allGames;
});

export const getGame = adminProcedure
  .input(adminGameIdSchema)
  .handler(async ({ input, context }) => {
    const game = await context.database.query.games.findFirst({
      where: eq(games.appId, input.gameId),
    });
    return game;
  });

export const getGameOwners = adminProcedure
  .input(adminGameIdSchema)
  .handler(async ({ input, context }) => {
    const owners = await context.database.query.ownedGames.findMany({
      where: eq(ownedGames.appId, input.gameId),
      with: {
        steamAccount: {
          with: { user: true },
        },
      },
    });
    return owners;
  });

export const syncAll = adminProcedure.handler(async ({ context }) => {
  const accounts = await context.database.select().from(steamAccounts);

  context.log.set("accountCount", accounts.length);

  if (accounts.length === 0) {
    return { succeeded: 0, failed: 0, totalGamesSynced: 0, errors: [] };
  }

  type SyncError = {
    steamAccountId: number;
    steamId: string;
    error: string;
  };

  const errors: SyncError[] = [];
  let succeeded = 0;
  let totalGamesSynced = 0;

  for (const account of accounts) {
    try {
      const gameCount = await syncSteamGames(
        context.database,
        account.id,
        account.steamId,
        context.steamApiKey,
      );
      succeeded++;
      totalGamesSynced += gameCount;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      errors.push({
        steamAccountId: account.id,
        steamId: account.steamId,
        error: errorMessage,
      });
    }
  }

  context.log.set("syncSucceeded", succeeded);
  context.log.set("syncFailed", errors.length);
  context.log.set("totalGamesSynced", totalGamesSynced);

  return {
    succeeded,
    failed: errors.length,
    totalGamesSynced,
    errors,
  };
});

export const syncPrices = adminProcedure.handler(async ({ context }) => {
  const result = await syncMissingGamePrices(context.database);

  context.log.set("pricesSyncTotal", result.total);
  context.log.set("pricesSyncSucceeded", result.succeeded);
  context.log.set("pricesSyncFailed", result.failed);

  return result;
});

export const adminSteamRouter = {
  games: {
    list: listGames,
    get: getGame,
    owners: getGameOwners,
  },
  syncAll,
  syncPrices,
};
