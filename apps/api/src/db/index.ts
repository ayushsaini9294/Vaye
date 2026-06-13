import { createClient } from "@libsql/client";
import * as schema from "@vaye/db-schema";
import { drizzle } from "drizzle-orm/libsql";

const client = createClient({
	url: process.env.DATABASE_URL || "file:./vaye.db",
	authToken: process.env.DATABASE_AUTH_TOKEN,
});

export const db = drizzle(client, { schema });

export { schema };
