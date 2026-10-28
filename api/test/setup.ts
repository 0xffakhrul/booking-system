import { afterAll, beforeEach } from "vitest";
import { pool } from "../src/db/pool.js";

// Every test starts with empty tables, so tests can't affect each other
beforeEach(async () => {
  const { rows } = await pool.query<{ tablename: string }>(
    "SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename <> 'pgmigrations'",
  );
  const tables = rows.map((r) => `"${r.tablename}"`).join(", ");
  await pool.query(`TRUNCATE ${tables} RESTART IDENTITY CASCADE`);
});

afterAll(async () => {
  await pool.end();
});
