import { eq, and, inArray } from "drizzle-orm";
import {
  accounts,
  discordServerMembers,
  steamAccounts,
  ownedGames,
} from "@steam-eye/database/schema";
import {
  adminServerIdSchema,
  adminCompareDiscordUsersSchema,
} from "@steam-eye/data-schemas";
import { adminProcedure } from "../../orpc";

export const getServerUsers = adminProcedure
  .input(adminServerIdSchema)
  .handler(async ({ input, context }) => {
    const members = await context.database.query.discordServerMembers.findMany({
      where: eq(discordServerMembers.discordServerId, input.serverId),
      with: {
        user: {
          with: { steamAccounts: true },
        },
      },
    });
    return members.map((member) => member.user);
  });

export const getServerGames = adminProcedure
  .input(adminServerIdSchema)
  .handler(async ({ input, context }) => {
    const members = await context.database.query.discordServerMembers.findMany({
      where: eq(discordServerMembers.discordServerId, input.serverId),
      with: { user: true },
    });

    const userIds = members.map((member) => member.userId);

    if (userIds.length === 0) {
      return [];
    }

    const accounts = await context.database.query.steamAccounts.findMany({
      where: inArray(steamAccounts.userId, userIds),
    });

    const accountIds = accounts.map((account) => account.id);

    if (accountIds.length === 0) {
      return [];
    }

    const serverGames = await context.database.query.ownedGames.findMany({
      where: inArray(ownedGames.steamAccountId, accountIds),
      with: { game: true },
    });

    const uniqueGames = new Map<number, typeof serverGames[number]["game"]>();
    for (const owned of serverGames) {
      if (owned.game && !uniqueGames.has(owned.appId)) {
        uniqueGames.set(owned.appId, owned.game);
      }
    }

    return Array.from(uniqueGames.values());
  });

export const compareDiscordUsers = adminProcedure
  .input(adminCompareDiscordUsersSchema)
  .handler(async ({ input, context }) => {
    const [invokerAccount, targetAccount] = await Promise.all([
      context.database.query.accounts.findFirst({
        where: and(
          eq(accounts.accountId, input.invokerDiscordId),
          eq(accounts.providerId, "discord"),
        ),
      }),
      context.database.query.accounts.findFirst({
        where: and(
          eq(accounts.accountId, input.targetDiscordId),
          eq(accounts.providerId, "discord"),
        ),
      }),
    ]);

    if (!invokerAccount || !targetAccount) {
      return { found: false as const };
    }

    const [invokerSteamAccounts, targetSteamAccounts] = await Promise.all([
      context.database.query.steamAccounts.findMany({
        where: eq(steamAccounts.userId, invokerAccount.userId),
      }),
      context.database.query.steamAccounts.findMany({
        where: eq(steamAccounts.userId, targetAccount.userId),
      }),
    ]);

    if (invokerSteamAccounts.length === 0 || targetSteamAccounts.length === 0) {
      return { found: false as const };
    }

    const invokerAccountIds = invokerSteamAccounts.map((account) => account.id);
    const targetAccountIds = targetSteamAccounts.map((account) => account.id);

    const [invokerGames, targetGames] = await Promise.all([
      context.database.query.ownedGames.findMany({
        where: and(
          inArray(ownedGames.steamAccountId, invokerAccountIds),
          eq(ownedGames.hidden, false),
        ),
      }),
      context.database.query.ownedGames.findMany({
        where: and(
          inArray(ownedGames.steamAccountId, targetAccountIds),
          eq(ownedGames.hidden, false),
        ),
      }),
    ]);

    const targetAppIds = new Set(targetGames.map((game) => game.appId));
    const sharedCount = invokerGames.filter((game) =>
      targetAppIds.has(game.appId),
    ).length;

    return {
      found: true as const,
      sharedCount,
      invokerGameCount: invokerGames.length,
      targetGameCount: targetGames.length,
    };
  });

export const adminDiscordRouter = {
  servers: {
    users: getServerUsers,
    games: getServerGames,
  },
  compareUsers: compareDiscordUsers,
};
