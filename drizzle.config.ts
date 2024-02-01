import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema.ts",
  driver: "libsql",
  dbCredentials: {
    url: process.env.DB_URL as string,
  },
  out: "./src/db/migrations",
  verbose: true,
  strict: true,
});
