import { eq, and, inArray } from "drizzle-orm";
import { accounts, ownedGames, steamAccounts, users } from "@steam-eye/database/schema";
import {
  compareGamesSchema,
  compareByDiscordIdSchema,
  hideGameSchema,
  listUserGamesSchema,
} from "@steam-eye/data-schemas";
import { publicProcedure, authedProcedure } from "../orpc";

export const listMyGames = authedProcedure.handler(async ({ context }) => {
  const userSteamAccounts = await context.database.query.steamAccounts.findMany({
    where: eq(steamAccounts.userId, context.userId),
  });

  const accountIds = userSteamAccounts.map((account) => account.id);

  if (accountIds.length === 0) {
    return [];
  }

  const games = await context.database.query.ownedGames.findMany({
    where: and(
      inArray(ownedGames.steamAccountId, accountIds),
      eq(ownedGames.hidden, false)
    ),
    with: { game: true },
  });

  return games;
});

export const listUserGames = publicProcedure
  .input(listUserGamesSchema)
  .handler(async ({ input, context }) => {
    const user = await context.database.query.users.findFirst({
      where: eq(users.id, input.userId),
    });

    if (!user) {
      return [];
    }

    const userSteamAccounts = await context.database.query.steamAccounts.findMany({
      where: eq(steamAccounts.userId, input.userId),
    });

    const accountIds = userSteamAccounts.map((account) => account.id);

    if (accountIds.length === 0) {
      return [];
    }

    const games = await context.database.query.ownedGames.findMany({
      where: and(
        inArray(ownedGames.steamAccountId, accountIds),
        eq(ownedGames.hidden, false)
      ),
      with: { game: true },
    });

    return games;
  });

export const compareGames = authedProcedure
  .input(compareGamesSchema)
  .handler(async ({ input, context }) => {
    const currentUserAccounts = await context.database.query.steamAccounts.findMany({
      where: eq(steamAccounts.userId, context.userId),
    });

    const targetUserAccounts = await context.database.query.steamAccounts.findMany({
      where: eq(steamAccounts.userId, input.targetUserId),
    });

    const currentAccountIds = currentUserAccounts.map((account) => account.id);
    const targetAccountIds = targetUserAccounts.map((account) => account.id);

    if (currentAccountIds.length === 0 || targetAccountIds.length === 0) {
      return { shared: [], onlyCurrentUser: [], onlyTargetUser: [] };
    }

    const currentUserGames = await context.database.query.ownedGames.findMany({
      where: and(
        inArray(ownedGames.steamAccountId, currentAccountIds),
        eq(ownedGames.hidden, false)
      ),
      with: { game: true },
    });

    const targetUserGames = await context.database.query.ownedGames.findMany({
      where: and(
        inArray(ownedGames.steamAccountId, targetAccountIds),
        eq(ownedGames.hidden, false)
      ),
      with: { game: true },
    });

    const currentUserAppIds = new Set(currentUserGames.map((g) => g.appId));
    const targetUserAppIds = new Set(targetUserGames.map((g) => g.appId));

    const shared = currentUserGames.filter((g) => targetUserAppIds.has(g.appId));
    const onlyCurrentUser = currentUserGames.filter((g) => !targetUserAppIds.has(g.appId));
    const onlyTargetUser = targetUserGames.filter((g) => !currentUserAppIds.has(g.appId));

    return { shared, onlyCurrentUser, onlyTargetUser };
  });

export const compareByDiscordId = authedProcedure
  .input(compareByDiscordIdSchema)
  .handler(async ({ input, context }) => {
    const targetAccount = await context.database.query.accounts.findFirst({
      where: and(
        eq(accounts.accountId, input.discordId),
        eq(accounts.providerId, "discord"),
      ),
    });

    if (!targetAccount) {
      return { found: false as const };
    }

    if (targetAccount.userId === context.userId) {
      return { isSelf: true as const };
    }

    const currentUserAccounts = await context.database.query.steamAccounts.findMany({
      where: eq(steamAccounts.userId, context.userId),
    });

    const targetUserAccounts = await context.database.query.steamAccounts.findMany({
      where: eq(steamAccounts.userId, targetAccount.userId),
    });

    if (currentUserAccounts.length === 0 || targetUserAccounts.length === 0) {
      return { found: false as const };
    }

    const currentAccountIds = currentUserAccounts.map((account) => account.id);
    const targetAccountIds = targetUserAccounts.map((account) => account.id);

    const currentUserGames = await context.database.query.ownedGames.findMany({
      where: and(
        inArray(ownedGames.steamAccountId, currentAccountIds),
        eq(ownedGames.hidden, false),
      ),
      with: { game: true },
    });

    const targetUserGames = await context.database.query.ownedGames.findMany({
      where: and(
        inArray(ownedGames.steamAccountId, targetAccountIds),
        eq(ownedGames.hidden, false),
      ),
      with: { game: true },
    });

    const targetUserAppIds = new Set(targetUserGames.map((game) => game.appId));
    const sharedGames = currentUserGames.filter((game) =>
      targetUserAppIds.has(game.appId),
    );

    return {
      found: true as const,
      sharedGames,
      sharedCount: sharedGames.length,
      currentUserGameCount: currentUserGames.length,
      targetUserGameCount: targetUserGames.length,
    };
  });

export const setGameVisibility = authedProcedure
  .input(hideGameSchema)
  .handler(async ({ input, context }) => {
    const account = await context.database.query.steamAccounts.findFirst({
      where: eq(steamAccounts.id, input.steamAccountId),
    });

    if (!account || account.userId !== context.userId) {
      return { success: false };
    }

    await context.database
      .update(ownedGames)
      .set({ hidden: input.hidden })
      .where(
        and(
          eq(ownedGames.steamAccountId, input.steamAccountId),
          eq(ownedGames.appId, input.appId)
        )
      );

    return { success: true };
  });

export const libraryRouter = {
  myGames: listMyGames,
  userGames: listUserGames,
  compare: compareGames,
  compareByDiscordId: compareByDiscordId,
  setVisibility: setGameVisibility,
};
