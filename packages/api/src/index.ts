import { RPCHandler } from "@orpc/server/fetch";
import { createDatabase } from "@steam-eye/database";
import { entry } from "@steam-eye/entry-point";
import { createRequestLogger } from "@steam-eye/log/request";
import { router } from "./routers";
import { bootstrap } from "./utils/bootstrap";
import { createAuth } from "./auth";

entry("api")
  .env({
    DATABASE_URL: "string.url",
    DISCORD_CLIENT_ID: "string",
    DISCORD_CLIENT_SECRET: "string",
    BETTER_AUTH_SECRET: "string",
    BETTER_AUTH_URL: "string.url",
  })
  .setup(({ env }) => {
    const database = createDatabase(env.DATABASE_URL);
    const auth = createAuth(database);
    const rpcHandler = new RPCHandler(router);
    return { database, auth, rpcHandler };
  })
  .run(async ({ log, rpcHandler, database, auth, context }) => {
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

        if (url.pathname === "/health") {
          requestLogger.emit({ statusCode: 200 });
          return Response.json({ ready });
        }

        if (url.pathname.startsWith("/api/auth")) {
          const response = await auth.handler(request);
          requestLogger.emit({ statusCode: response.status });
          return response;
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
            return response;
          }
        }

        requestLogger.emit({ statusCode: 404 });
        return new Response("Not Found", { status: 404 });
      },
    });
  });
