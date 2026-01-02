import { os, ORPCError } from "@orpc/server";
import type { DatabaseClient } from "@steamboat/database";
import type { RequestLogger } from "@steamboat/log/request";
import { verifyApiKey, markApiKeyUsed } from "./utils/api-key";

export type Context = {
  database: DatabaseClient;
  log: RequestLogger;
  userId: string | undefined;
  apiKey: string | undefined;
  steamApiKey: string;
};

export type AuthedContext = Pick<Context, "database" | "log" | "steamApiKey"> & {
  userId: string;
};

export type AdminContext = Pick<Context, "database" | "log" | "steamApiKey">;

export const publicProcedure = os.$context<Context>();

export const authedProcedure = publicProcedure.use(({ context, next }) => {
  if (context.userId === undefined) {
    throw new ORPCError("UNAUTHORIZED");
  }

  context.log.set("userId", context.userId);

  return next({
    context: {
      database: context.database,
      log: context.log,
      steamApiKey: context.steamApiKey,
      userId: context.userId,
    } satisfies AuthedContext,
  });
});

export const adminProcedure = publicProcedure.use(async ({ context, next }) => {
  if (!context.apiKey) {
    throw new ORPCError("UNAUTHORIZED");
  }

  const result = await verifyApiKey(context.database, context.apiKey);

  if (!result.valid) {
    throw new ORPCError("UNAUTHORIZED");
  }

  await markApiKeyUsed(context.database, result.key.id, result.key.oneTimeUse);

  context.log.set("admin", true);
  context.log.set("apiKeyId", result.key.id);

  return next({
    context: {
      database: context.database,
      log: context.log,
      steamApiKey: context.steamApiKey,
    } satisfies AdminContext,
  });
});
