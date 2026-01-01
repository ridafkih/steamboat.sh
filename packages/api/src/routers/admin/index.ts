import { adminUsersRouter } from "./users";
import { adminSteamRouter } from "./steam";
import { adminDiscordRouter } from "./discord";

export const adminRouter = {
  users: adminUsersRouter,
  steam: adminSteamRouter,
  discord: adminDiscordRouter,
};
