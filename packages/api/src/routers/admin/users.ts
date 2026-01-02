import { eq, and } from "drizzle-orm";
import { users, steamAccounts, accounts } from "@steam-eye/database/schema";
import { adminUserIdSchema, adminUsersQuerySchema } from "@steam-eye/data-schemas";
import { adminProcedure } from "../../orpc";

export const listUsers = adminProcedure.handler(async ({ context }) => {
  const allUsers = await context.database.query.users.findMany({
    with: { steamAccounts: true, accounts: true },
  });
  return allUsers;
});

export const getUser = adminProcedure
  .input(adminUserIdSchema)
  .handler(async ({ input, context }) => {
    const user = await context.database.query.users.findFirst({
      where: eq(users.id, input.userId),
      with: { steamAccounts: true, accounts: true },
    });
    return user;
  });

export const searchUsers = adminProcedure
  .input(adminUsersQuerySchema)
  .handler(async ({ input, context }) => {
    if (!input.discordId && !input.steamId) {
      return [];
    }

    if (input.steamId) {
      const steamAccount = await context.database.query.steamAccounts.findFirst({
        where: eq(steamAccounts.steamId, input.steamId),
        with: { user: { with: { steamAccounts: true, accounts: true } } },
      });
      return steamAccount?.user ? [steamAccount.user] : [];
    }

    if (input.discordId) {
      const discordAccount = await context.database.query.accounts.findFirst({
        where: and(
          eq(accounts.providerId, "discord"),
          eq(accounts.accountId, input.discordId)
        ),
        with: { user: { with: { steamAccounts: true, accounts: true } } },
      });
      return discordAccount?.user ? [discordAccount.user] : [];
    }

    return [];
  });

export const adminUsersRouter = {
  list: listUsers,
  get: getUser,
  search: searchUsers,
};
