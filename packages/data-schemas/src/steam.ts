import { type } from "arktype";

export const steamAccountIdSchema = type({ id: "number" });

export const steamAccountQuerySchema = type({ steamAccountId: "number" });

export const createSteamAccountSchema = type({
  steamId: "string",
  steamUsername: "string",
  "steamAvatar?": "string",
  "profileUrl?": "string",
});

export const syncSteamGamesSchema = type({
  steamAccountId: "number",
  games: type({
    appId: "number",
    "playtimeForever?": "number",
    "playtimeRecent?": "number",
    "playtimeWindows?": "number",
    "playtimeMac?": "number",
    "playtimeLinux?": "number",
    "lastPlayedAt?": "number",
  }).array(),
});

export type SteamAccountId = typeof steamAccountIdSchema.infer;
export type SteamAccountQuery = typeof steamAccountQuerySchema.infer;
export type CreateSteamAccount = typeof createSteamAccountSchema.infer;
export type SyncSteamGames = typeof syncSteamGamesSchema.infer;
