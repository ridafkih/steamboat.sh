import { and, eq } from "drizzle-orm";
import { games, ownedGames, steamAccounts } from "@steam-eye/database/schema";
import type { DatabaseClient } from "@steam-eye/database";
import { steamOwnedGamesResponseSchema } from "@steam-eye/data-schemas";

const buildSteamIconUrl = (appId: number, iconHash: string) =>
  `https://media.steampowered.com/steamcommunity/public/images/apps/${appId}/${iconHash}.jpg`;

const buildHeaderImageUrl = (appId: number) =>
  `https://steamcdn-a.akamaihd.net/steam/apps/${appId}/header.jpg`;

export const syncSteamGames = async (
  database: DatabaseClient,
  steamAccountId: number,
  steamId: string,
  apiKey: string,
): Promise<number> => {
  const ownedGamesUrl = new URL(
    "https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/",
  );
  ownedGamesUrl.searchParams.set("key", apiKey);
  ownedGamesUrl.searchParams.set("steamid", steamId);
  ownedGamesUrl.searchParams.set("include_appinfo", "1");
  ownedGamesUrl.searchParams.set("include_played_free_games", "1");

  const response = await fetch(ownedGamesUrl.toString());

  if (!response.ok) {
    throw new Error(`Failed to fetch owned games: ${response.statusText}`);
  }

  const json = await response.json();
  const data = steamOwnedGamesResponseSchema.assert(json);
  const steamGames = data.response.games ?? [];

  if (steamGames.length === 0) {
    return 0;
  }

  for (const steamGame of steamGames) {
    const existingGame = await database.query.games.findFirst({
      where: eq(games.appId, steamGame.appid),
    });

    if (!existingGame) {
      await database.insert(games).values({
        appId: steamGame.appid,
        name: steamGame.name,
        iconUrl: steamGame.img_icon_url
          ? buildSteamIconUrl(steamGame.appid, steamGame.img_icon_url)
          : null,
        headerImageUrl: buildHeaderImageUrl(steamGame.appid),
      });
    }

    const existingOwned = await database.query.ownedGames.findFirst({
      where: and(
        eq(ownedGames.steamAccountId, steamAccountId),
        eq(ownedGames.appId, steamGame.appid),
      ),
    });

    if (!existingOwned) {
      await database.insert(ownedGames).values({
        steamAccountId,
        appId: steamGame.appid,
        playtimeForever: steamGame.playtime_forever,
        playtimeRecent: steamGame.playtime_2weeks ?? 0,
        playtimeWindows: steamGame.playtime_windows_forever,
        playtimeMac: steamGame.playtime_mac_forever,
        playtimeLinux: steamGame.playtime_linux_forever,
        lastPlayedAt: steamGame.rtime_last_played
          ? new Date(steamGame.rtime_last_played * 1000)
          : null,
      });
    } else {
      await database
        .update(ownedGames)
        .set({
          playtimeForever: steamGame.playtime_forever,
          playtimeRecent: steamGame.playtime_2weeks ?? 0,
          playtimeWindows: steamGame.playtime_windows_forever,
          playtimeMac: steamGame.playtime_mac_forever,
          playtimeLinux: steamGame.playtime_linux_forever,
          lastPlayedAt: steamGame.rtime_last_played
            ? new Date(steamGame.rtime_last_played * 1000)
            : null,
          syncedAt: new Date(),
        })
        .where(
          and(
            eq(ownedGames.steamAccountId, steamAccountId),
            eq(ownedGames.appId, steamGame.appid),
          ),
        );
    }
  }

  await database
    .update(steamAccounts)
    .set({ lastSyncedAt: new Date() })
    .where(eq(steamAccounts.id, steamAccountId));

  return steamGames.length;
};
