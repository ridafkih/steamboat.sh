import { defineConfig } from "drizzle-kit";
import { join } from "node:path";

export default process.env.DATABASE_URL
  ? defineConfig({
      out: "./drizzle",
      schema: join(__dirname, "src", "database", "schema.ts"),
      dialect: "postgresql",
      dbCredentials: {
        url: process.env.DATABASE_URL,
      },
    })
  : undefined;
