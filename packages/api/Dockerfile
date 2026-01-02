FROM oven/bun:1 AS base
WORKDIR /app

FROM base AS prune
RUN bun install --global turbo
COPY . .
RUN turbo prune @steamboat/api --docker

FROM base AS build
COPY --from=prune /app/out/json/ .
RUN bun install --frozen-lockfile
COPY --from=prune /app/out/full/ .
RUN bun build packages/api/src/index.ts --outdir packages/api/dist --target bun

FROM base AS runtime
COPY --from=prune /app/out/json/ .
RUN bun install --frozen-lockfile --production
COPY --from=build /app/packages/api/dist ./packages/api/dist
COPY --from=prune /app/out/full/packages/database ./packages/database

ENV NODE_ENV=production
EXPOSE 3001

CMD ["sh", "-c", "bunx drizzle-kit migrate --config packages/database/drizzle.config.ts && bun packages/api/dist/index.js"]
