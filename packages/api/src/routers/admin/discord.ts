import { eq, inArray } from "drizzle-orm";
import {
  discordServerMembers,
  steamAccounts,
  ownedGames,
} from "@steam-eye/database/schema";
import { adminServerIdSchema } from "@steam-eye/data-schemas";
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

export const adminDiscordRouter = {
  servers: {
    users: getServerUsers,
    games: getServerGames,
  },
};
