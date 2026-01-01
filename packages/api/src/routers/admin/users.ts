import { eq, or } from "drizzle-orm";
import { users, steamAccounts } from "@steam-eye/database/schema";
import { adminUserIdSchema, adminUsersQuerySchema } from "@steam-eye/data-schemas";
import { adminProcedure } from "../../orpc";

export const listUsers = adminProcedure.handler(async ({ context }) => {
  const allUsers = await context.database.query.users.findMany({
    with: { steamAccounts: true },
  });
  return allUsers;
});

export const getUser = adminProcedure
  .input(adminUserIdSchema)
  .handler(async ({ input, context }) => {
    const user = await context.database.query.users.findFirst({
      where: eq(users.id, input.userId),
      with: { steamAccounts: true },
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
      const account = await context.database.query.steamAccounts.findFirst({
        where: eq(steamAccounts.steamId, input.steamId),
        with: { user: { with: { steamAccounts: true } } },
      });
      return account?.user ? [account.user] : [];
    }

    if (input.discordId) {
      const user = await context.database.query.users.findFirst({
        where: eq(users.discordId, input.discordId),
        with: { steamAccounts: true },
      });
      return user ? [user] : [];
    }

    return [];
  });

export const adminUsersRouter = {
  list: listUsers,
  get: getUser,
  search: searchUsers,
};
