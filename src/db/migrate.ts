import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";

import env from "../env";

const libsqlClient = createClient({
  url: env.DB_URL,
  authToken: env.DB_AUTH_TOKEN,
});

const db = drizzle(libsqlClient);

console.log("Running Migrations...");

await migrate(db, { migrationsFolder: "src/db/migrations" });

console.log("Done.");

libsqlClient.close();
