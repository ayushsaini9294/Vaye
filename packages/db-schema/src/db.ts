import { createClient } from "@libsql/client";
import * as schema from "./schema";
import { drizzle } from "drizzle-orm/libsql";

// Shared DB client — used by both client-user and client-admin server functions.
// In development: reads from local vaye.db file.
// In production (Vercel + Turso): reads from DATABASE_URL + DATABASE_AUTH_TOKEN env vars.
const client = createClient({
	url: process.env.DATABASE_URL || "file:../../apps/api/vaye.db",
	authToken: process.env.DATABASE_AUTH_TOKEN,
});

export const db = drizzle(client, { schema });
export { schema };
