import { eq } from "drizzle-orm";
import { games, ownedGames } from "@steamboat/database/schema";
import { adminGameIdSchema } from "@steamboat/data-schemas";
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

export const adminSteamRouter = {
  games: {
    list: listGames,
    get: getGame,
    owners: getGameOwners,
  },
};
