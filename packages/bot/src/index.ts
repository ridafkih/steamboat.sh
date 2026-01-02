import { join } from "node:path";
import { Client, Events, GatewayIntentBits } from "discord.js";
import { createClient } from "@steamboat/api/client";
import { entry } from "@steamboat/entry-point";
import { getAllSubcommands } from "./utils/get-commands";
import { getAllEvents } from "./utils/get-events";
import { registerCommands } from "./utils/register-commands";
import { registerEvents } from "./utils/register-events";

const sourceDirectory = import.meta.dir;
const commandsDirectory = join(sourceDirectory, "commands");
const eventsDirectory = join(sourceDirectory, "events");

entry("bot")
  .env({
    DISCORD_TOKEN: "string>0",
    API_URL: "string.url",
    API_KEY: "string>0",
    WEB_URL: "string.url",
  })
  .setup(({ env }) => {
    const api = createClient({
      baseUrl: env.API_URL,
      credentials: "omit",
      apiKey: env.API_KEY,
    });

    return { discordToken: env.DISCORD_TOKEN, api, webUrl: env.WEB_URL };
  })
  .run(async ({ discordToken, api, webUrl, log, context }) => {
    const subcommands = await getAllSubcommands(commandsDirectory, {
      api,
      webUrl,
    });

    context.set("subcommandCount", subcommands.length);
    context.set(
      "subcommandNames",
      subcommands.map((subcommand) => subcommand.name),
    );

    const subcommandsMap = new Map(
      subcommands.map((subcommand) => [subcommand.name, subcommand]),
    );

    const events = await getAllEvents(eventsDirectory, {
      subcommands: subcommandsMap,
      log,
    });

    context.set("eventCount", events.length);
    context.set(
      "eventNames",
      events.map((event) => event.name),
    );

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

    await registerCommands(subcommands, discordToken, readyClient.user.id);
    registerEvents(events, client);
  });
