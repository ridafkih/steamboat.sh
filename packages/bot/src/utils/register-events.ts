import type { Client } from "discord.js";
import type { EventDefinition } from "../types";

export const registerEvents = (
  events: EventDefinition[],
  client: Client,
): number => {
  for (const event of events) {
    if (event.once) {
      client.once(event.name, (...arguments_) => event.execute(...arguments_));
    } else {
      client.on(event.name, (...arguments_) => event.execute(...arguments_));
    }
  }

  return events.length;
};
