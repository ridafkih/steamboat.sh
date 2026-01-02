import { RPCHandler } from "@orpc/server/fetch";
import { createDatabase } from "@steam-eye/database";
import { entry } from "@steam-eye/entry-point";
import { createRequestLogger } from "@steam-eye/log/request";
import { router } from "./routers";
import { bootstrap } from "./utils/bootstrap";

entry("api")
  .env({ DATABASE_URL: "string.url" })
  .setup(({ env }) => {
    const database = createDatabase(env.DATABASE_URL);
    const handler = new RPCHandler(router);
    return { database, handler };
  })
  .run(async ({ log, handler, database }) => {
    const { ready } = await bootstrap(database);

    if (!ready) {
      log.fatal("server is misconfigured");
      process.exit(1);
    }

    Bun.serve({
      port: 3001,
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

        if (url.pathname.startsWith("/rpc")) {
          const apiKey = request.headers.get("x-api-key") ?? undefined;

          const { matched, response } = await handler.handle(request, {
            prefix: "/rpc",
            context: {
              database,
              log: requestLogger,
              userId: undefined,
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

    log.info({ port: 3001 }, "api server started");
  });
