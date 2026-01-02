import pino from "pino";

const DEFAULT_REDACT_PATHS = [
  "*.password",
  "*.secret",
  "*.token",
  "*.apiKey",
  "*.api_key",
  "*.accessToken",
  "*.access_token",
  "*.refreshToken",
  "*.refresh_token",
  "*.authorization",
  "*.cookie",
  "*.creditCard",
  "*.credit_card",
  "*.ssn",
  "*.privateKey",
  "*.private_key",
  "*.clientSecret",
  "*.client_secret",
  "env.DATABASE_URL",
  "env.DISCORD_TOKEN",
  "env.DISCORD_CLIENT_ID",
  "env.DISCORD_CLIENT_SECRET",
  "env.BETTER_AUTH_SECRET",
  "env.API_KEY",
  "env.STEAM_API_KEY",
];

export const log = pino({
  level: process.env.LOG_LEVEL ?? "info",
  redact: {
    paths: DEFAULT_REDACT_PATHS,
    censor: "*".repeat(12),
  },
});

export type Logger = typeof log;

export { DEFAULT_REDACT_PATHS };
