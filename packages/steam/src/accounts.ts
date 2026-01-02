import { eq } from "drizzle-orm";
import { steamAccounts } from "@steamboat/database/schema";
import type { DatabaseClient } from "@steamboat/database";
import type { SteamUser } from "./openid";

export class SteamAccountAlreadyLinkedError extends Error {
  constructor() {
    super("Steam account is already linked to another user");
    this.name = "SteamAccountAlreadyLinkedError";
  }
}

type LinkSteamAccountResult = {
  steamAccountId: number;
  steamId: string;
  isNew: boolean;
};

export const linkSteamAccount = async (
  database: DatabaseClient,
  userId: string,
  steamUser: SteamUser,
): Promise<LinkSteamAccountResult> => {
  const existingAccount = await database.query.steamAccounts.findFirst({
    where: eq(steamAccounts.steamId, steamUser.steamid),
  });

  if (existingAccount) {
    if (existingAccount.userId === userId) {
      await database
        .update(steamAccounts)
        .set({
          steamUsername: steamUser.username,
          steamAvatar: steamUser.avatar.large,
          profileUrl: steamUser.profile.url,
        })
        .where(eq(steamAccounts.steamId, steamUser.steamid));
      return {
        steamAccountId: existingAccount.id,
        steamId: existingAccount.steamId,
        isNew: false,
      };
    }
    throw new SteamAccountAlreadyLinkedError();
  }

  const [inserted] = await database
    .insert(steamAccounts)
    .values({
      userId,
      steamId: steamUser.steamid,
      steamUsername: steamUser.username,
      steamAvatar: steamUser.avatar.large,
      profileUrl: steamUser.profile.url,
    })
    .returning({ id: steamAccounts.id });

  if (!inserted) {
    throw new Error("Failed to insert steam account");
  }

  return {
    steamAccountId: inserted.id,
    steamId: steamUser.steamid,
    isNew: true,
  };
};

export const getUserSteamAccounts = async (
  database: DatabaseClient,
  userId: string,
) => {
  return await database.query.steamAccounts.findMany({
    where: eq(steamAccounts.userId, userId),
  });
};

export const unlinkSteamAccount = async (
  database: DatabaseClient,
  userId: string,
  steamAccountId: number,
): Promise<boolean> => {
  const account = await database.query.steamAccounts.findFirst({
    where: eq(steamAccounts.id, steamAccountId),
  });

  if (!account || account.userId !== userId) {
    return false;
  }

  await database
    .delete(steamAccounts)
    .where(eq(steamAccounts.id, steamAccountId));

  return true;
};
