FROM oven/bun:1 AS base
WORKDIR /app

FROM base AS prune
RUN bun install --global turbo
COPY . .
RUN turbo prune @steamboat/bot --docker

FROM base AS runtime
COPY --from=prune /app/out/json/ .
RUN bun install --frozen-lockfile
COPY --from=prune /app/out/full/ .

ENV NODE_ENV=production

CMD ["bun", "packages/bot/src/index.ts"]
