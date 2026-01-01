import { Client, Events, GatewayIntentBits } from "discord.js";
import { createDatabase } from "@steam-eye/database";
import { log } from "@steam-eye/log";

const logger = log.child({ module: "discord-bot" });
const database = createDatabase("steam-eye.db");

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

client.once(Events.ClientReady, (readyClient) => {
  logger.info({ tag: readyClient.user.tag }, "bot ready");
});

client.login(process.env.DISCORD_TOKEN);
