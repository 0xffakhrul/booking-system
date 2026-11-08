import pg from "pg";
import { setUpDatabase } from "../src/db/setup.js";

// Runs once before all tests: make sure the test database exists, is fully migrated, and that
// tempah_app (the API's user) exists with its grants
export default async function setup() {
  const adminUrl = process.env.MIGRATION_DATABASE_URL!;
  const url = new URL(adminUrl);
  const dbName = url.pathname.slice(1);

  // connect to the built-in "postgres" database to create the test database if needed
  const serverUrl = new URL(url);
  serverUrl.pathname = "/postgres";
  const server = new pg.Client({ connectionString: serverUrl.toString() });
  await server.connect();
  const { rowCount } = await server.query(
    "SELECT 1 FROM pg_database WHERE datname = $1",
    [dbName],
  );
  if (!rowCount) await server.query(`CREATE DATABASE "${dbName}"`);
  await server.end();

  await setUpDatabase(adminUrl, process.env.DATABASE_URL!);
}
