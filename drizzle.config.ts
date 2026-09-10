import "dotenv/config";
import { defineConfig } from "drizzle-kit";

/**
 * Single source of truth for the schema push: the same DATABASE_URL the
 * application reads, so `db:push` can never target a different database than
 * the running app.
 */
export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "postgresql://cleopatre:cleopatre@127.0.0.1:5433/cleopatre_dev",
  },
  strict: false,
  verbose: true,
});
