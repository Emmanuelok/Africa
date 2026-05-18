import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Lazy DB client. Returns null when DATABASE_URL is not set so callers can
// gracefully degrade to console logging / in-memory paths.

type DB = PostgresJsDatabase<typeof schema>;

let db: DB | null = null;
let attempted = false;

export function getDb(): DB | null {
  if (attempted) return db;
  attempted = true;
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  try {
    const sql = postgres(url, {
      ssl: url.includes("sslmode=require") || url.includes("amazonaws") ? "require" : undefined,
      prepare: false,
      max: 5
    });
    db = drizzle(sql, { schema });
    return db;
  } catch (err) {
    console.warn("[db] failed to connect:", err);
    return null;
  }
}

export { schema };
