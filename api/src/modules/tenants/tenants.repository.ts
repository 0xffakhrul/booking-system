import pg from "pg";
import { pool, type Queryable } from "../../db/pool.js";
import { ConflictError } from "../../lib/errors.js";

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  timezone: string;
}

const COLUMNS = "id, name, slug, timezone";

export async function createTenant(
  input: { name: string; slug: string; timezone: string },
  db: Queryable = pool,
): Promise<Tenant> {
  try {
    const { rows } = await db.query<Tenant>(
      `INSERT INTO tenants (name, slug, timezone) VALUES ($1, $2, $3) RETURNING ${COLUMNS}`,
      [input.name, input.slug, input.timezone],
    );
    return rows[0]!;
  } catch (err) {
    if (err instanceof pg.DatabaseError && err.code === "23505") {
      throw new ConflictError(
        "SLUG_TAKEN",
        "that booking link is already taken",
      );
    }
    throw err;
  }
}

export async function findTenantById(
  id: string,
  db: Queryable = pool,
): Promise<Tenant | null> {
  const { rows } = await db.query<Tenant>(
    `SELECT ${COLUMNS} FROM tenants WHERE id = $1`,
    [id],
  );

  return rows[0] ?? null;
}
