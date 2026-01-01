import type { Logger } from "./index";

export type RequestContext = {
  requestId: string;
  method: string;
  path: string;
  startTime: number;
  userId?: number;
  discordId?: string;
  steamAccountId?: number;
  error?: {
    type: string;
    message: string;
    stack?: string;
  };
  [key: string]: unknown;
};

export type RequestLogger = {
  set: <K extends keyof RequestContext>(key: K, value: RequestContext[K]) => void;
  setAll: (fields: Partial<RequestContext>) => void;
  get: <K extends keyof RequestContext>(key: K) => RequestContext[K];
  emit: (fields?: { statusCode: number; durationMs?: number }) => void;
};

export function createRequestLogger(logger: Logger, initialContext?: Partial<RequestContext>): RequestLogger {
  const context: RequestContext = {
    requestId: crypto.randomUUID(),
    method: "",
    path: "",
    startTime: Date.now(),
    ...initialContext,
  };

  return {
    set(key, value) {
      context[key] = value;
    },

    setAll(fields) {
      Object.assign(context, fields);
    },

    get(key) {
      return context[key];
    },

    emit(fields) {
      const durationMs = fields?.durationMs ?? Date.now() - context.startTime;
      const { startTime, ...rest } = context;

      const level = fields?.statusCode && fields.statusCode >= 500 ? "error" : "info";

      logger[level]({
        ...rest,
        statusCode: fields?.statusCode,
        durationMs,
      });
    },
  };
}
