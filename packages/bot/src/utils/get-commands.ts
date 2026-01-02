import { Glob } from "bun";
import { join } from "node:path";
import type { CommandContext, SubcommandDefinition } from "../types";

export const getAllSubcommands = async (
  commandsDirectory: string,
  context: CommandContext,
): Promise<SubcommandDefinition[]> => {
  const globPattern = join(commandsDirectory, "**/*.{ts,js}");
  const globScanner = new Glob(globPattern);
  const entrypoints = await Array.fromAsync(globScanner.scan());

  const imports = entrypoints.map(async (entrypoint) => {
    const module = await import(entrypoint);
    const createSubcommand = module.default;
    return createSubcommand(context);
  });

  return Promise.all(imports);
};
