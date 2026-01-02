import { Client, Events, GatewayIntentBits } from "discord.js";
import { createClient } from "@steam-eye/api/client";
import { entry } from "@steam-eye/entry-point";

entry("bot")
  .env({ DISCORD_TOKEN: "string", API_URL: "string.url" })
  .setup(({ env }) => {
    const api = createClient(env.API_URL);
    return { discordToken: env.DISCORD_TOKEN, api };
  })
  .run(async ({ discordToken, api, log }) => {
    const client = new Client({
      intents: [GatewayIntentBits.Guilds],
    });

    client.once(Events.ClientReady, (readyClient) => {
      log.info({ tag: readyClient.user.tag }, "bot ready");
    });

    await client.login(discordToken);
  });
