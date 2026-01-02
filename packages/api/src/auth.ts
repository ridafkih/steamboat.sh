import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import type { DatabaseClient } from "@steam-eye/database";
import * as schema from "@steam-eye/database/schema";

type CreateAuthOptions = {
  trustedOrigins: string[];
};

export const createAuth = (
  database: DatabaseClient,
  { trustedOrigins }: CreateAuthOptions,
) => {
  return betterAuth({
    trustedOrigins,
    database: drizzleAdapter(database, {
      provider: "pg",
      schema: {
        user: schema.users,
        session: schema.sessions,
        account: schema.accounts,
        verification: schema.verifications,
      },
    }),
    socialProviders: {
      discord: {
        clientId: process.env.DISCORD_CLIENT_ID ?? "",
        clientSecret: process.env.DISCORD_CLIENT_SECRET ?? "",
      },
    },
    session: {
      cookieCache: {
        enabled: true,
        maxAge: 60 * 5,
      },
    },
  });
};

export type Auth = ReturnType<typeof createAuth>;
