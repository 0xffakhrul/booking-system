import pg from "pg";
import { runner } from "node-pg-migrate";

// Runs once before all tests: make sure the test database exists and is fully migrated
export default async function setup() {
  const url = new URL(process.env.DATABASE_URL!);
  const dbName = url.pathname.slice(1);

  // connect to the built-in "postgres" database to create the test database if needed
  const adminUrl = new URL(url);
  adminUrl.pathname = "/postgres";
  const admin = new pg.Client({ connectionString: adminUrl.toString() });
  await admin.connect();
  const { rowCount } = await admin.query(
    "SELECT 1 FROM pg_database WHERE datname = $1",
    [dbName],
  );
  if (!rowCount) await admin.query(`CREATE DATABASE "${dbName}"`);
  await admin.end();

  await runner({
    databaseUrl: url.toString(),
    dir: "migrations",
    direction: "up",
    migrationsTable: "pgmigrations",
    log: () => {},
  });
}
