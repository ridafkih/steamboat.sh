import type {
  ChatInputCommandInteraction,
  Client,
  SlashCommandSubcommandBuilder,
} from "discord.js";
import type { Client as ApiClient } from "@steamboat/api/client";
import type { InteractionLogger, Logger } from "@steamboat/log";

export type CommandContext = {
  api: ApiClient;
  webUrl: string;
};

export type SubcommandDefinition = {
  name: string;
  configure: (subcommand: SlashCommandSubcommandBuilder) => SlashCommandSubcommandBuilder;
  execute: (
    interaction: ChatInputCommandInteraction,
    interactionLogger: InteractionLogger,
  ) => Promise<void>;
};

export type EventContext = {
  subcommands: Map<string, SubcommandDefinition>;
  log: Logger;
};

export type EventDefinition = {
  name: string;
  once?: boolean;
  execute: (...arguments_: unknown[]) => Promise<void>;
};
