import { type } from "arktype";

export const userIdSchema = type({ id: "number" });

export const createUserSchema = type({
  discordId: "string",
  discordUsername: "string",
  "discordAvatar?": "string",
});

export type UserId = typeof userIdSchema.infer;
export type CreateUser = typeof createUserSchema.infer;
