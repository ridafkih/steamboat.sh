import { type } from "arktype";

export const gameIdSchema = type({ appId: "number" });

export const searchGamesSchema = type({ query: "string > 0" });

export const createGameSchema = type({
  appId: "number",
  name: "string",
  "iconUrl?": "string",
  "logoUrl?": "string",
  "headerImageUrl?": "string",
  "shortDescription?": "string",
  "developers?": "string",
  "publishers?": "string",
  "genres?": "string",
  "releaseDate?": "string",
  "isFree?": "boolean",
});

export const compareGamesSchema = type({
  targetUserId: "number",
});

export const hideGameSchema = type({
  steamAccountId: "number",
  appId: "number",
  hidden: "boolean",
});

export const listUserGamesSchema = type({
  userId: "number",
});

export type GameId = typeof gameIdSchema.infer;
export type SearchGames = typeof searchGamesSchema.infer;
export type CreateGame = typeof createGameSchema.infer;
export type CompareGames = typeof compareGamesSchema.infer;
export type HideGame = typeof hideGameSchema.infer;
export type ListUserGames = typeof listUserGamesSchema.infer;
