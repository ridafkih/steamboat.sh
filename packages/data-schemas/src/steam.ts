import { type } from "arktype";

export const unlinkSteamAccountSchema = type({
  steamAccountId: "number",
});

export type UnlinkSteamAccount = typeof unlinkSteamAccountSchema.infer;

export const steamOwnedGameSchema = type({
  appid: "number",
  name: "string",
  img_icon_url: "string",
  playtime_forever: "number",
  "playtime_2weeks?": "number",
  "playtime_windows_forever?": "number",
  "playtime_mac_forever?": "number",
  "playtime_linux_forever?": "number",
  "rtime_last_played?": "number",
});

export type SteamOwnedGame = typeof steamOwnedGameSchema.infer;

export const steamOwnedGamesResponseSchema = type({
  response: {
    "game_count?": "number",
    "games?": steamOwnedGameSchema.array(),
  },
});

export type SteamOwnedGamesResponse = typeof steamOwnedGamesResponseSchema.infer;

export const steamPriceOverviewSchema = type({
  currency: "string",
  initial: "number",
  final: "number",
  discount_percent: "number",
  initial_formatted: "string",
  final_formatted: "string",
});

export type SteamPriceOverview = typeof steamPriceOverviewSchema.infer;

export const steamAppDetailsResponseSchema = type({
  success: "boolean",
  "data?": {
    "price_overview?": steamPriceOverviewSchema,
  },
});

export type SteamAppDetailsResponse = typeof steamAppDetailsResponseSchema.infer;
