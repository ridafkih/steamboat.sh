---
description: Use Bun instead of Node.js, npm, pnpm, or vite.
globs: "*.ts, *.tsx, *.html, *.css, *.js, *.jsx, package.json"
alwaysApply: false
---

Default to using Bun instead of Node.js.

- Use `bun <file>` instead of `node <file>` or `ts-node <file>`
- Use `bun test` instead of `jest` or `vitest`
- Use `bun build <file.html|file.ts|file.css>` instead of `webpack` or `esbuild`
- Use `bun install` instead of `npm install` or `yarn install` or `pnpm install`
- Use `bun run <script>` instead of `npm run <script>` or `yarn run <script>` or `pnpm run <script>`
- Use `bunx <package> <command>` instead of `npx <package> <command>`
- Bun automatically loads .env, so don't use dotenv.
- Always construct URLs using `new URL`, rather than concatenating.
- We use the wide-logging pattern for logging with Pino. Use the codebase as a reference, and check https://loggingsucks.com/

## Code Style

- **Arrow functions only.** Use `const fn = () => {}` not `function fn() {}`.
- **No abbreviated variable names.** Use full, self-descriptive names.
  - `database` not `db`
  - `requestLogger` not `reqLog`
  - `context` not `ctx`
  - `response` not `res`
  - `request` not `req`
  - `error` not `err`
  - `message` not `msg`
  - `configuration` not `config` or `cfg`
- **No type assertions.** Avoid `as Type` or non-null assertions `!`. Fix the types properly instead.
- **Self-descriptive code.** Names should make the code readable without comments.
- **No unnecessary comments.** Code should be self-explanatory.
- **No declaration-and-returns.** Rather than `const N = await ...\nreturn N` prefer `return await ...`.

## Project Structure

Follow the monorepo patterns from `keeper.sh`:

- Centralized TypeScript config in `packages/typescript-config`
- Shared packages export via `workspace:*` protocol
- Each package has minimal `tsconfig.json` extending the base
- Factory functions over singletons (e.g., `createDatabase()` not a global `db`)

## Libraries

- **Validation:** Arktype (not Zod)
- **API:** oRPC with `@orpc/server` and `@orpc/client`
- **Database:** Drizzle ORM with `bun:sqlite`
- **Logging:** Pino with wide events pattern (see `packages/log`)

## APIs

- `Bun.serve()` supports WebSockets, HTTPS, and routes. Don't use `express`.
- `bun:sqlite` for SQLite. Don't use `better-sqlite3`.
- `Bun.redis` for Redis. Don't use `ioredis`.
- `Bun.sql` for Postgres. Don't use `pg` or `postgres.js`.
- `WebSocket` is built-in. Don't use `ws`.
- Prefer `Bun.file` over `node:fs`'s readFile/writeFile
- Bun.$`ls` instead of execa.

## Testing

Use `bun test` to run tests.

```ts#index.test.ts
import { test, expect } from "bun:test";

test("hello world", () => {
  expect(1).toBe(1);
});
```

## Frontend

Use Vite for the web package.

For more information, read the Bun API docs in `node_modules/bun-types/docs/**.mdx`.
