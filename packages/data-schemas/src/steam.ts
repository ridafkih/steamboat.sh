import { type } from "arktype";

export const unlinkSteamAccountSchema = type({
  steamAccountId: "number",
});

export type UnlinkSteamAccount = typeof unlinkSteamAccountSchema.infer;
