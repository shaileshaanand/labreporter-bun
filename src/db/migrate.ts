import { migrate } from "drizzle-orm/libsql/migrator";

import db from "../context/db";

// biome-ignore lint/suspicious/noConsoleLog: needs logging
console.log("Running Migrations...");

await migrate(db, { migrationsFolder: "src/db/migrations" });

// biome-ignore lint/suspicious/noConsoleLog: needs logging
console.log("Done.");
