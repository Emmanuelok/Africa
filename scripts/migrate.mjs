// Applies pending Drizzle migrations from lib/db/migrations against
// DATABASE_URL. Run in CI / pre-deploy: `node scripts/migrate.mjs`.
// Idempotent — Drizzle tracks applied migrations in a __drizzle_migrations
// table, so re-running is safe.

import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set — nothing to migrate.");
  process.exit(0); // not an error in environments without a DB (demo/local)
}

const sql = postgres(url, { max: 1 });
const db = drizzle(sql);

try {
  console.log("Running migrations…");
  await migrate(db, { migrationsFolder: "./lib/db/migrations" });
  console.log("Migrations applied.");
} catch (err) {
  console.error("Migration failed:", err);
  process.exitCode = 1;
} finally {
  await sql.end();
}
