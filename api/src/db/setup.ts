// Gets the database ready for the API: runs migrations, then creates or updates the API's
// role and its grants. Runs as the admin user (MIGRATION_DATABASE_URL), because the API's
// own user (DATABASE_URL) isn't allowed to change tables or roles.
//
//   npm run db:setup          (npm run dev does this first)

import { fileURLToPath } from "node:url";
import { runner } from "node-pg-migrate";
import pg from "pg";
import { ensureAppRole } from "./app-role.js";

const migrationsDir = fileURLToPath(
  new URL("../../migrations", import.meta.url),
);

export async function setUpDatabase(adminUrl: string, appUrl: string) {
  await runner({
    databaseUrl: adminUrl,
    dir: migrationsDir,
    direction: "up",
    migrationsTable: "pgmigrations",
    log: () => {},
  });

  const admin = new pg.Client({ connectionString: adminUrl });
  await admin.connect();
  try {
    await ensureAppRole(admin, appUrl); // after migrations, so new tables get grants too
  } finally {
    await admin.end();
  }
}

// run directly (not imported by the tests)
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { MIGRATION_DATABASE_URL, DATABASE_URL } = process.env;
  if (!MIGRATION_DATABASE_URL || !DATABASE_URL)
    throw new Error("set MIGRATION_DATABASE_URL and DATABASE_URL");
  await setUpDatabase(MIGRATION_DATABASE_URL, DATABASE_URL);
  // eslint-disable-next-line no-console -- a command-line script, not the API
  console.log("database ready: migrations applied, app role up to date");
}
