FROM oven/bun:1 AS foundation
WORKDIR /app

FROM foundation AS prepare
RUN bun install --global turbo
COPY . .
RUN turbo prune @steamboat/web --docker

FROM foundation AS build
RUN bun install --global turbo

COPY --from=prepare /app/out/json/ .
RUN bun install --frozen-lockfile

COPY --from=prepare /app/out/full/ .
RUN turbo build --filter=@steamboat/web

FROM foundation AS runtime

COPY --from=build /app/packages/web/dist ./dist

ENV NODE_ENV=production
EXPOSE 3000

CMD ["bun", "run", "dist/server.js"]
