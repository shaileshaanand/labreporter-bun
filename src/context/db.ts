import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "../db/schema";
import env from "../env";

const client = createClient({ url: env.DB_URL, authToken: env.DB_AUTH_TOKEN });

const db = drizzle(client, { schema });

export default db;
