import { MessageFlags } from "discord.js";
import type { CommandContext, SubcommandDefinition } from "../types";

export default ({ api, webUrl }: CommandContext): SubcommandDefinition => ({
  name: "profile",

  configure: (subcommand) =>
    subcommand
      .setName("profile")
      .setDescription("Get a link to your or another user's Steam profile")
      .addUserOption((option) =>
        option
          .setName("user")
          .setDescription("The user whose Steam profile to show (defaults to yourself)"),
      ),

  execute: async (interaction, interactionLogger) => {
    const targetUser = interaction.options.getUser("user") ?? interaction.user;
    const isSelf = targetUser.id === interaction.user.id;

    interactionLogger.setAll({
      targetUserId: targetUser.id,
      targetUserTag: targetUser.tag,
      isSelf,
    });

    if (targetUser.bot) {
      interactionLogger.setAll({
        outcome: "user_error",
        responseType: "bot_profile",
      });
      await interaction.reply({
        content: "Bots don't have Steam profiles!",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const profile = await api.admin.discord.getSteamProfile({
      discordId: targetUser.id,
    });

    if (!profile.found) {
      interactionLogger.setAll({
        outcome: "user_error",
        responseType: "no_steam_linked",
      });
      if (isSelf) {
        const loginUrl = new URL("/login", webUrl);
        await interaction.editReply({
          content: `You haven't linked your Steam account yet!\n${loginUrl}`,
        });
      } else {
        await interaction.editReply({
          content: `<@${targetUser.id}> hasn't linked their Steam account to Steamboat yet.`,
        });
      }
      return;
    }

    interactionLogger.setAll({
      outcome: "success",
      responseType: "profile_link",
      steamId: profile.steamId,
    });

    const profileUrl = new URL(`/profiles/${profile.steamId}`, "https://steamcommunity.com");
    await interaction.editReply({
      content: isSelf
        ? `Your Steam profile: ${profileUrl}`
        : `<@${targetUser.id}>'s Steam profile: ${profileUrl}`,
    });
  },
});
