import { MessageFlags } from "discord.js";
import type { CommandContext, SubcommandDefinition } from "../types";

export default ({ api, webUrl }: CommandContext): SubcommandDefinition => ({
  name: "compare",

  configure: (subcommand) =>
    subcommand
      .setName("compare")
      .setDescription("Compare your Steam library with another user")
      .addUserOption((option) =>
        option
          .setName("user")
          .setDescription("The user to compare your library with")
          .setRequired(true),
      ),

  execute: async (interaction, interactionLogger) => {
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
        flags: MessageFlags.Ephemeral,
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
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

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
  },
});
