import { RPCHandler } from "@orpc/server/fetch";
import { createDatabase } from "@steam-eye/database";
import { entry } from "@steam-eye/entry-point";
import { createRequestLogger } from "@steam-eye/log/request";
import {
  createSteamAuth,
  linkSteamAccount,
  syncSteamGames,
  SteamAccountAlreadyLinkedError,
} from "@steam-eye/steam";
import { router } from "./routers";
import { bootstrap } from "./utils/bootstrap";
import { createAuth } from "./auth";

const createCorsHeaders = (origin: string) => ({
  "Access-Control-Allow-Origin": origin,
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Credentials": "true",
});

const createWithCors = (corsHeaders: Record<string, string>) => {
  return (response: Response): Response => {
    const newResponse = new Response(response.body, response);
    for (const [key, value] of Object.entries(corsHeaders)) {
      newResponse.headers.set(key, value);
    }
    return newResponse;
  };
};

entry("api")
  .env({
    DATABASE_URL: "string.url",
    CORS_ORIGIN: "string.url",
    DISCORD_CLIENT_ID: "string",
    DISCORD_CLIENT_SECRET: "string",
    BETTER_AUTH_SECRET: "string",
    BETTER_AUTH_URL: "string.url",
    STEAM_API_KEY: "string",
    STEAM_REALM: "string.url",
  })
  .setup(({ env }) => {
    const database = createDatabase(env.DATABASE_URL);
    const auth = createAuth(database, { trustedOrigins: [env.CORS_ORIGIN] });
    const steamCallbackUrl = new URL("/api/steam/callback", env.STEAM_REALM);
    const steamAuth = createSteamAuth({
      realm: env.STEAM_REALM,
      returnUrl: steamCallbackUrl.toString(),
      apiKey: env.STEAM_API_KEY,
    });
    const rpcHandler = new RPCHandler(router);
    const corsHeaders = createCorsHeaders(env.CORS_ORIGIN);
    const withCors = createWithCors(corsHeaders);
    return { database, auth, steamAuth, rpcHandler, corsHeaders, withCors, env };
  })
  .run(async ({ log, rpcHandler, database, auth, steamAuth, corsHeaders, withCors, env, context }) => {
    const port = 3001;
    const { ready } = await bootstrap(database);

    context.set("port", port);
    context.set("bootstrap.ready", ready);

    Bun.serve({
      port,
      fetch: async (request) => {
        const url = new URL(request.url);
        const requestLogger = createRequestLogger(log, {
          method: request.method,
          path: url.pathname,
        });

        if (request.method === "OPTIONS") {
          requestLogger.emit({ statusCode: 204 });
          return new Response(null, { status: 204, headers: corsHeaders });
        }

        if (url.pathname === "/health") {
          requestLogger.emit({ statusCode: 200 });
          return withCors(Response.json({ ready }));
        }

        if (url.pathname.startsWith("/api/auth")) {
          const response = await auth.handler(request);
          requestLogger.emit({ statusCode: response.status });
          return withCors(response);
        }

        if (url.pathname === "/api/steam/link") {
          const session = await auth.api.getSession({ headers: request.headers });
          if (!session?.user) {
            requestLogger.emit({ statusCode: 401 });
            return withCors(new Response("Unauthorized", { status: 401 }));
          }
          const redirectUrl = await steamAuth.getRedirectUrl();
          requestLogger.emit({ statusCode: 302 });
          return new Response(null, {
            status: 302,
            headers: { Location: redirectUrl },
          });
        }

        if (url.pathname === "/api/steam/callback") {
          const session = await auth.api.getSession({ headers: request.headers });
          const errorRedirectUrl = new URL(env.CORS_ORIGIN);

          if (!session?.user) {
            requestLogger.set("error", {
              type: "AuthenticationError",
              message: "No session found during Steam callback",
            });
            
            errorRedirectUrl.searchParams.set("error", "unauthorized");
            requestLogger.emit({ statusCode: 302 });
            return Response.redirect(errorRedirectUrl.toString(), 302);
          }

          requestLogger.set("userId", session.user.id);

          try {
            const steamUser = await steamAuth.authenticate(request);
            requestLogger.setAll({
              steamId: steamUser.steamid,
              steamUsername: steamUser.username,
            });

            const linkResult = await linkSteamAccount(database, session.user.id, steamUser);
            requestLogger.set("steamAccountId", linkResult.steamAccountId);
            requestLogger.set("isNewSteamAccount", linkResult.isNew);

            const syncedGamesCount = await syncSteamGames(
              database,
              linkResult.steamAccountId,
              linkResult.steamId,
              env.STEAM_API_KEY,
            );
            requestLogger.set("syncedGamesCount", syncedGamesCount);

            const successRedirectUrl = new URL(env.CORS_ORIGIN);
            successRedirectUrl.searchParams.set("steam", "linked");
            requestLogger.emit({ statusCode: 302 });
            return Response.redirect(successRedirectUrl.toString(), 302);
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            const errorStack = error instanceof Error ? error.stack : undefined;

            if (error instanceof SteamAccountAlreadyLinkedError) {
              requestLogger.set("error", {
                type: "SteamAccountAlreadyLinkedError",
                message: errorMessage,
              });
              errorRedirectUrl.searchParams.set("error", "steam-already-linked");
            } else {
              requestLogger.set("error", {
                type: error instanceof Error ? error.constructor.name : "UnknownError",
                message: errorMessage,
                stack: errorStack,
              });
              errorRedirectUrl.searchParams.set("error", "steam-link-failed");
            }
            requestLogger.emit({ statusCode: 302 });
            return Response.redirect(errorRedirectUrl.toString(), 302);
          }
        }

        if (url.pathname.startsWith("/rpc")) {
          const apiKey = request.headers.get("x-api-key") ?? undefined;
          const session = await auth.api.getSession({ headers: request.headers });

          const { matched, response } = await rpcHandler.handle(request, {
            prefix: "/rpc",
            context: {
              database,
              log: requestLogger,
              userId: session?.user?.id,
              apiKey,
            },
          });

          if (matched && response) {
            requestLogger.emit({ statusCode: response.status });
            return withCors(response);
          }
        }

        requestLogger.emit({ statusCode: 404 });
        return withCors(new Response("Not Found", { status: 404 }));
      },
    });
  });
