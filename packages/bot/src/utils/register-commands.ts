import { REST, Routes, SlashCommandBuilder } from "discord.js";
import type { SubcommandDefinition } from "../types";

export const registerCommands = async (
  subcommands: SubcommandDefinition[],
  discordToken: string,
  applicationId: string,
): Promise<number> => {
  const steamboatCommand = new SlashCommandBuilder()
    .setName("steamboat")
    .setDescription("Steamboat commands");

  for (const subcommand of subcommands) {
    steamboatCommand.addSubcommand(subcommand.configure);
  }

  const rest = new REST().setToken(discordToken);

  await rest.put(Routes.applicationCommands(applicationId), {
    body: [steamboatCommand.toJSON()],
  });

  return subcommands.length;
};
