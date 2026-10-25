import pg from "pg";
import { pool, type Queryable } from "../../db/pool.js";
import { ConflictError } from "../../lib/errors.js";

export interface User {
  id: string;
  email: string;
  role: "owner";
  tenantId: string;
}

export const USER_COLUMNS = `id, email, role, tenant_id AS "tenantId"`;

export async function createUser(
  input: { tenantId: string; email: string; passwordHash: string },
  db: Queryable = pool,
): Promise<User> {
  try {
    const { rows } = await db.query<User>(
      `INSERT INTO users (tenant_id, email, password_hash) VALUES ($1, $2, $3) RETURNING ${USER_COLUMNS}`,
      [input.tenantId, input.email, input.passwordHash],
    );
    return rows[0]!;
  } catch (err) {
    if (err instanceof pg.DatabaseError && err.code === "23505") {
      throw new ConflictError("EMAIL_TAKEN", "email already registered");
    }
    throw err;
  }
}

export async function findUserByEmail(email: string) {
  const { rows } = await pool.query<User & { passwordHash: string }>(
    `SELECT ${USER_COLUMNS}, password_hash AS "passwordHash" FROM users WHERE email = $1`,
    [email],
  );
  return rows[0] ?? null;
}
