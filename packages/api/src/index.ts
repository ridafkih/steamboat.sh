import { RPCHandler } from "@orpc/server/fetch";
import { createDatabase } from "@steam-eye/database";
import { entry } from "@steam-eye/entry-point";
import { createRequestLogger } from "@steam-eye/log/request";
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
  })
  .setup(({ env }) => {
    const database = createDatabase(env.DATABASE_URL);
    const auth = createAuth(database, { trustedOrigins: [env.CORS_ORIGIN] });
    const rpcHandler = new RPCHandler(router);
    const corsHeaders = createCorsHeaders(env.CORS_ORIGIN);
    const withCors = createWithCors(corsHeaders);
    return { database, auth, rpcHandler, corsHeaders, withCors };
  })
  .run(async ({ log, rpcHandler, database, auth, corsHeaders, withCors, context }) => {
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
