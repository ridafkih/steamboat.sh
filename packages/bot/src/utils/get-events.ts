import { Glob } from "bun";
import { join } from "node:path";
import type { EventContext, EventDefinition } from "../types";

export const getAllEvents = async (
  eventsDirectory: string,
  context: EventContext,
): Promise<EventDefinition[]> => {
  const globPattern = join(eventsDirectory, "**/*.{ts,js}");
  const globScanner = new Glob(globPattern);
  const entrypoints = await Array.fromAsync(globScanner.scan());

  const imports = entrypoints.map(async (entrypoint) => {
    const module = await import(entrypoint);
    const createEvent = module.default;
    return createEvent(context);
  });

  return Promise.all(imports);
};
