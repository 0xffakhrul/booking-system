import pg from "pg";
import type { Queryable } from "./pool.js";

// The API connects as a plain role so that Row-Level Security applies to it (ADR-0003).
// Superusers and table owners skip RLS, so the API must be neither.

/**
 * Creates or updates the API's role from DATABASE_URL's user and password, and grants it
 * read/write on every table. Run as the admin user after migrations; safe to repeat.
 */
export async function ensureAppRole(admin: pg.Client, appUrl: string) {
  const url = new URL(appUrl);
  const role = decodeURIComponent(url.username);
  const password = decodeURIComponent(url.password);
  if (!role || !password)
    throw new Error("DATABASE_URL needs a user and a password");

  const { rows } = await admin.query<{ me: string; rolsuper: boolean | null }>(
    `SELECT current_user AS me,
            (SELECT rolsuper FROM pg_roles WHERE rolname = $1) AS rolsuper`,
    [role],
  );
  // ALTER ROLE below makes it NOSUPERUSER, which would lock you out of an admin account
  if (rows[0]!.me === role || rows[0]!.rolsuper)
    throw new Error(
      `DATABASE_URL uses "${role}", an admin user. The API needs its own plain user (ADR-0003).`,
    );

  const name = admin.escapeIdentifier(role);
  if (rows[0]!.rolsuper === null) {
    try {
      await admin.query(`CREATE ROLE ${name}`);
    } catch (err) {
      // created at the same moment by another process (dev and tests share the server)
      if (!(err instanceof pg.DatabaseError && err.code === "42710")) throw err;
    }
  }
  await admin.query(
    `ALTER ROLE ${name} WITH LOGIN NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE
       PASSWORD ${admin.escapeLiteral(password)}`,
  );
  await admin.query(`GRANT USAGE ON SCHEMA public TO ${name}`);
  await admin.query(
    `GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO ${name}`,
  );
  await admin.query(
    `GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO ${name}`,
  );
  await admin.query(`REVOKE ALL ON pgmigrations FROM ${name}`); // only migrations touch this
}

/**
 * Throws unless the connected user is subject to Row-Level Security: not a superuser, no
 * BYPASSRLS, and not the owner of any table. The API runs this before it starts listening.
 */
export async function checkAppRole(db: Queryable) {
  const { rows } = await db.query<{
    name: string;
    rolsuper: boolean;
    rolbypassrls: boolean;
    owns: number;
  }>(
    `SELECT r.rolname AS name, r.rolsuper, r.rolbypassrls,
            (SELECT count(*)::int FROM pg_tables
              WHERE schemaname = 'public' AND tableowner = current_user) AS owns
       FROM pg_roles r
      WHERE r.rolname = current_user`,
  );
  const me = rows[0]!;
  if (me.rolsuper || me.rolbypassrls || me.owns > 0)
    throw new Error(
      `the API is connected as "${me.name}", which skips Row-Level Security ` +
        `(superuser: ${me.rolsuper}, bypassrls: ${me.rolbypassrls}, owns ${me.owns} tables)`,
    );
}
