import { join } from "node:path";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL environment variable is required for drizzle-kit");
}

export default {
  out: "./drizzle",
  schema: join(__dirname, "src", "database", "schema.ts"),
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl,
  },
};
