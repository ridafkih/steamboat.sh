import { Client, Events, GatewayIntentBits } from "discord.js";
import { createClient } from "@steam-eye/api/client";
import { entry } from "@steam-eye/entry-point";

entry("bot")
  .env({ DISCORD_TOKEN: "string>0", API_URL: "string.url" })
  .setup(({ env }) => {
    const api = createClient(env.API_URL);
    return { discordToken: env.DISCORD_TOKEN, api };
  })
  .run(async ({ discordToken, api, context }) => {
    const client = new Client({
      intents: [GatewayIntentBits.Guilds],
    });

    const readyClient = await new Promise<Client<true>>((resolve) => {
      client.once(Events.ClientReady, resolve);
      client.login(discordToken);
    });

    context.set("discord.tag", readyClient.user.tag);
    context.set("discord.id", readyClient.user.id);
    context.set("discord.guildCount", readyClient.guilds.cache.size);
  });
