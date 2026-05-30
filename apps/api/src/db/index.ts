import * as schema from "@vaye/db-schema";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";

const client = createClient({
	url: process.env.DATABASE_URL || "file:./vaye.db",
});

export const db = drizzle(client, { schema });

export { schema };
