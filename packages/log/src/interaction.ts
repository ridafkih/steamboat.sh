import type { Logger } from "./index";

export type InteractionContext = {
  interactionId: string;
  commandName: string;
  subcommand?: string;
  guildId?: string;
  channelId?: string;
  invokerId: string;
  invokerTag: string;
  targetUserId?: string;
  targetUserTag?: string;
  startTime: number;
  outcome?: "success" | "error" | "user_error";
  error?: {
    type: string;
    message: string;
    stack?: string;
  };
  [key: string]: unknown;
};

export type InteractionLogger = {
  set: <K extends keyof InteractionContext>(
    key: K,
    value: InteractionContext[K],
  ) => void;
  setAll: (fields: Partial<InteractionContext>) => void;
  get: <K extends keyof InteractionContext>(key: K) => InteractionContext[K];
  emit: () => void;
};

export const createInteractionLogger = (
  logger: Logger,
  initialContext: Partial<InteractionContext>,
): InteractionLogger => {
  const context: InteractionContext = {
    interactionId: "",
    commandName: "",
    invokerId: "",
    invokerTag: "",
    startTime: Date.now(),
    ...initialContext,
  };

  let emitted = false;

  return {
    set: (key, value) => {
      context[key] = value;
    },

    setAll: (fields) => {
      Object.assign(context, fields);
    },

    get: (key) => {
      return context[key];
    },

    emit: () => {
      if (emitted) return;
      emitted = true;

      const durationMs = Date.now() - context.startTime;
      const { startTime, ...rest } = context;

      const level =
        context.outcome === "error"
          ? "error"
          : context.outcome === "user_error"
            ? "warn"
            : "info";

      logger[level]({
        ...rest,
        durationMs,
      });
    },
  };
};
