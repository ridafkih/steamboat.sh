FROM oven/bun:1 AS base
WORKDIR /app

FROM base AS source
COPY . .

FROM base AS prune
RUN bun install --global turbo
COPY --from=source /app .
RUN turbo prune @steamboat/web --docker

FROM base AS build
COPY --from=prune /app/out/json/ .
RUN bun install --frozen-lockfile
COPY --from=prune /app/out/full/ .
COPY --from=source /app/packages/web/.env.production ./packages/web/.env.production
RUN bun run --cwd packages/web build

FROM base AS runtime
COPY --from=build /app/packages/web/dist ./packages/web/dist
COPY --from=source /app/packages/web/server.ts ./packages/web/server.ts
COPY --from=source /app/packages/web/entrypoint.sh ./packages/web/entrypoint.sh
RUN chmod +x ./packages/web/entrypoint.sh

ENV NODE_ENV=production
EXPOSE 3000

ENTRYPOINT ["./packages/web/entrypoint.sh"]
