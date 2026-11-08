import { afterAll, beforeEach } from "vitest";
import { pool } from "../src/db/pool.js";
import { admin } from "./db.js";

// Every test starts with empty tables, so tests can't affect each other.
// As admin: the API's user isn't allowed to TRUNCATE.
beforeEach(async () => {
  const { rows } = await admin.query<{ tablename: string }>(
    "SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename <> 'pgmigrations'",
  );
  const tables = rows.map((r) => `"${r.tablename}"`).join(", ");
  await admin.query(`TRUNCATE ${tables} RESTART IDENTITY CASCADE`);
});

afterAll(async () => {
  await Promise.all([pool.end(), admin.end()]);
});
