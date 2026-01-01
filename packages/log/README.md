# @steam-eye/log

Wrapper around `pino` for logging.

## Usage

```typescript
import { log } from "@steam-eye/log";

log.info({ userId: 123 }, "user %s authenticated");
```

## Child Loggers

```typescript
const botLog = log.child({ module: "discord-bot" });
botLog.info({ guildId }, "joined");
```

## Wide Events

This is a package to wrap logging functions so it's easier to employ the strategies discussed by [Boris Tane](https://boristane.com/) in [logginsucks.com](https://loggingsucks.com/). The idea is to prevent the need to search through thousands of lines and manually draw correlations, and instead just use high-cardinality "wide events." Each request _or action_ is thus entirely contained within a single log.

```typescript
import { createRequestLogger } from "@steam-eye/log/request";

const request = createRequestLogger(log, { method: "POST", path: "/rpc" });
request.set("userId", ctx.userId);
request.emit({ statusCode: 200 });
```

## Considerations

This uses the global `LOG_LEVEL` environment variable, defaulted to `'info'`.
