import { Events, type Interaction } from "discord.js";
import { createInteractionLogger } from "@steamboat/log";
import type { EventContext, EventDefinition } from "../types";

export default ({ subcommands, log }: EventContext): EventDefinition => ({
  name: Events.InteractionCreate,

  execute: async (...eventArguments) => {
    const [potentialInteraction] = eventArguments;

    if (
      typeof potentialInteraction !== "object" ||
      potentialInteraction === null ||
      !("isChatInputCommand" in potentialInteraction)
    ) {
      return;
    }

    const interaction = potentialInteraction as Interaction;

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

    if (interaction.commandName !== "steamboat") return;

    const subcommandName = interaction.options.getSubcommand();
    const subcommand = subcommands.get(subcommandName);

    if (!subcommand) return;

    try {
      await subcommand.execute(interaction, interactionLogger);
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
  },
});
