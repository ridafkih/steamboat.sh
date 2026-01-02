import {
  Client,
  Events,
  GatewayIntentBits,
  SlashCommandBuilder,
  REST,
  Routes,
  type ChatInputCommandInteraction,
} from "discord.js";
import { createClient } from "@steamboat/api/client";
import { entry } from "@steamboat/entry-point";
import {
  createInteractionLogger,
  type InteractionLogger,
} from "@steamboat/log";

const compareCommand = new SlashCommandBuilder()
  .setName("steamboat")
  .setDescription("Steamboat commands")
  .addSubcommand((subcommand) =>
    subcommand
      .setName("compare")
      .setDescription("Compare your Steam library with another user")
      .addUserOption((option) =>
        option
          .setName("user")
          .setDescription("The user to compare your library with")
          .setRequired(true),
      ),
  );

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

    const rest = new REST().setToken(discordToken);
    await rest.put(Routes.applicationCommands(readyClient.user.id), {
      body: [compareCommand.toJSON()],
    });

    const handleCompareCommand = async (
      interaction: ChatInputCommandInteraction,
      interactionLogger: InteractionLogger,
    ) => {
      const targetUser = interaction.options.getUser("user", true);
      const invokerId = interaction.user.id;

      interactionLogger.setAll({
        targetUserId: targetUser.id,
        targetUserTag: targetUser.tag,
      });

      if (targetUser.id === invokerId) {
        interactionLogger.setAll({
          outcome: "user_error",
          responseType: "self_compare",
        });
        await interaction.reply({
          content: "You can't compare your library with yourself!",
          ephemeral: true,
        });
        return;
      }

      if (targetUser.bot) {
        interactionLogger.setAll({
          outcome: "user_error",
          responseType: "bot_compare",
        });
        await interaction.reply({
          content: "You can't compare your library with a bot!",
          ephemeral: true,
        });
        return;
      }

      await interaction.deferReply({ ephemeral: true });

      const [invokerStatus, targetStatus] = await Promise.all([
        api.library.checkDiscordLinkStatus({ discordId: invokerId }),
        api.library.checkDiscordLinkStatus({ discordId: targetUser.id }),
      ]);

      interactionLogger.setAll({
        invokerHasAccount: invokerStatus.hasAccount,
        invokerHasSteamLinked: invokerStatus.hasSteamLinked,
        targetHasAccount: targetStatus.hasAccount,
        targetHasSteamLinked: targetStatus.hasSteamLinked,
      });

      if (!invokerStatus.hasAccount || !invokerStatus.hasSteamLinked) {
        interactionLogger.setAll({
          outcome: "user_error",
          responseType: "invoker_not_linked",
        });
        const loginUrl = new URL("/login", webUrl);
        await interaction.editReply({
          content: `You need to link your Steam account first!\n${loginUrl}`,
        });
        return;
      }

      if (!targetStatus.hasAccount || !targetStatus.hasSteamLinked) {
        interactionLogger.setAll({
          outcome: "user_error",
          responseType: "target_not_linked",
        });
        await interaction.editReply({
          content: `<@${targetUser.id}> hasn't linked their Steam account to Steamboat yet. Ask them to sign up!`,
        });
        return;
      }

      const comparison = await api.admin.discord.compareUsers({
        invokerDiscordId: invokerId,
        targetDiscordId: targetUser.id,
      });

      if (!comparison.found) {
        interactionLogger.setAll({
          outcome: "error",
          responseType: "comparison_failed",
        });
        await interaction.editReply({
          content:
            "Something went wrong while comparing libraries. Please try again.",
        });
        return;
      }

      interactionLogger.setAll({
        outcome: "success",
        responseType: "compare_link",
        sharedCount: comparison.sharedCount,
        invokerGameCount: comparison.invokerGameCount,
        targetGameCount: comparison.targetGameCount,
      });

      const compareUrl = new URL(`/compare/${targetUser.id}`, webUrl);
      await interaction.editReply({
        content: `You share **${comparison.sharedCount}** games with <@${targetUser.id}>!\n${compareUrl}`,
      });
    };

    client.on(Events.InteractionCreate, async (interaction) => {
      if (!interaction.isChatInputCommand()) return;

      const interactionLogger = createInteractionLogger(log, {
        interactionId: interaction.id,
        commandName: interaction.commandName,
        subcommand: interaction.options.getSubcommand(false) ?? undefined,
        guildId: interaction.guildId ?? undefined,
        channelId: interaction.channelId,
        invokerId: interaction.user.id,
        invokerTag: interaction.user.tag,
      });

      if (
        interaction.commandName === "steamboat" &&
        interaction.options.getSubcommand() === "compare"
      ) {
        try {
          await handleCompareCommand(interaction, interactionLogger);
        } catch (error) {
          interactionLogger.setAll({
            outcome: "error",
            error: {
              type: error instanceof Error ? error.name : "UnknownError",
              message: error instanceof Error ? error.message : String(error),
              stack: error instanceof Error ? error.stack : undefined,
            },
          });

          const errorMessage = "Something went wrong. Please try again later.";

          if (interaction.deferred) {
            await interaction.editReply({ content: errorMessage });
          } else {
            await interaction.reply({ content: errorMessage, ephemeral: true });
          }
        } finally {
          interactionLogger.emit();
        }
      }
    });
  });
