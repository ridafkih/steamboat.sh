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

export type GameId = typeof gameIdSchema.infer;
export type SearchGames = typeof searchGamesSchema.infer;
export type CreateGame = typeof createGameSchema.infer;
