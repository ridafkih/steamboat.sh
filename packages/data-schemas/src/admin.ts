import { type } from "arktype";

export const adminUserIdSchema = type({ userId: "string" });

export const adminUsersQuerySchema = type({
  "discordId?": "string",
  "steamId?": "string",
});

export const adminGameIdSchema = type({ gameId: "number" });

export const adminServerIdSchema = type({ serverId: "string" });

export const adminCompareDiscordUsersSchema = type({
  invokerDiscordId: "string",
  targetDiscordId: "string",
});

export type AdminUserId = typeof adminUserIdSchema.infer;
export type AdminUsersQuery = typeof adminUsersQuerySchema.infer;
export type AdminGameId = typeof adminGameIdSchema.infer;
export type AdminServerId = typeof adminServerIdSchema.infer;
export type AdminCompareDiscordUsers = typeof adminCompareDiscordUsersSchema.infer;
