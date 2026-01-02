FROM oven/bun:1 AS foundation
WORKDIR /app

FROM foundation AS prepare
RUN bun install --global turbo
COPY . .
RUN turbo prune @steamboat/bot --docker

FROM foundation AS build
COPY --from=prepare /app/out/json/ .
RUN bun install --frozen-lockfile

COPY --from=prepare /app/out/full/ .
RUN bun run build --filter=@steamboat/bot

FROM foundation AS runtime
RUN bun install --global turbo

COPY --from=prepare /app/out/json/ .
RUN bun install --frozen-lockfile --production

COPY --from=build /app/turbo.json ./turbo.json
COPY --from=build /app/packages/bot/turbo.json ./packages/bot/turbo.json
COPY --from=build /app/packages/bot/dist ./packages/bot/dist
COPY --from=build /app/packages/bot/package.json ./packages/bot/package.json

ENV NODE_ENV=production
ENV TURBO_TELEMETRY_DISABLED=1

CMD ["turbo", "start"]
