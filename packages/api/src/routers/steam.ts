import { eq } from "drizzle-orm";
import { steamAccounts } from "@steam-eye/database/schema";
import { unlinkSteamAccountSchema } from "@steam-eye/data-schemas";
import { authedProcedure } from "../orpc";

export const getLinkedAccounts = authedProcedure.handler(async ({ context }) => {
  return await context.database.query.steamAccounts.findMany({
    where: eq(steamAccounts.userId, context.userId),
  });
});

export const unlinkAccount = authedProcedure
  .input(unlinkSteamAccountSchema)
  .handler(async ({ input, context }) => {
    const account = await context.database.query.steamAccounts.findFirst({
      where: eq(steamAccounts.id, input.steamAccountId),
    });

    if (!account || account.userId !== context.userId) {
      return { success: false, error: "Account not found or unauthorized" };
    }

    await context.database
      .delete(steamAccounts)
      .where(eq(steamAccounts.id, input.steamAccountId));

    return { success: true };
  });

export const steamRouter = {
  linkedAccounts: getLinkedAccounts,
  unlink: unlinkAccount,
};
