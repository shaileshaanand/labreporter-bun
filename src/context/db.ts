import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import env from "../env";
import * as schema from "../db/schema";

const client = createClient({ url: env.DB_URL, authToken: env.DB_AUTH_TOKEN });

const db = drizzle(client, { schema });

export default db;
