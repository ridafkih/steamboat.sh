FROM oven/bun:1 AS base
WORKDIR /app

FROM base AS prune
RUN bun install --global turbo
COPY . .
RUN turbo prune @steamboat/web --docker

FROM base AS build
COPY --from=prune /app/out/json/ .
RUN bun install --frozen-lockfile
COPY --from=prune /app/out/full/ .
RUN bun run --cwd packages/web build

FROM base AS runtime
COPY --from=build /app/packages/web/dist ./dist

ENV NODE_ENV=production
EXPOSE 3000

CMD ["bun", "dist/server.js"]
