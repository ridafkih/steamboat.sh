FROM oven/bun:1 AS foundation
WORKDIR /app

FROM foundation AS prepare
RUN bun install --global turbo
COPY . .
RUN turbo prune @steamboat/cron --docker

FROM foundation AS build
COPY --from=prepare /app/out/json/ .
RUN bun install --frozen-lockfile

COPY --from=prepare /app/out/full/ .
RUN bun run build --filter=@steamboat/cron

FROM foundation AS runtime
RUN bun install --global turbo

COPY --from=prepare /app/out/json/ .
RUN bun install --frozen-lockfile --production

COPY --from=build /app/turbo.json ./turbo.json
COPY --from=build /app/packages/cron/turbo.json ./packages/cron/turbo.json
COPY --from=build /app/packages/cron/dist ./packages/cron/dist
COPY --from=build /app/packages/cron/package.json ./packages/cron/package.json

ENV NODE_ENV=production
ENV TURBO_TELEMETRY_DISABLED=1

CMD ["turbo", "start"]
