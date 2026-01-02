FROM oven/bun:1 AS base
WORKDIR /app

FROM base AS prune
RUN bun install --global turbo
COPY . .
RUN turbo prune @steamboat/bot --docker

FROM base AS build
COPY --from=prune /app/out/json/ .
RUN bun install --frozen-lockfile
COPY --from=prune /app/out/full/ .
RUN bun build packages/bot/src/index.ts --outdir packages/bot/dist --target bun

FROM base AS runtime
COPY --from=prune /app/out/json/ .
RUN bun install --frozen-lockfile --production
COPY --from=build /app/packages/bot/dist ./packages/bot/dist

ENV NODE_ENV=production

CMD ["bun", "packages/bot/dist/index.js"]
