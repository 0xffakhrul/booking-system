import pg from "pg";
import { pool, type Queryable } from "../../db/pool.js";
import { ConflictError } from "../../lib/errors.js";

export interface User {
  id: string;
  email: string;
  username: string;
}

export async function createUser(
  email: string,
  username: string,
  passwordHash: string,
  db: Queryable = pool,
) {
  try {
    const { rows } = await db.query<User>(
      "INSERT INTO users (email, username, password_hash) VALUES ($1, $2, $3) RETURNING id, email, username",
      [email, username, passwordHash],
    );
    return rows[0]!;
  } catch (err) {
    if (err instanceof pg.DatabaseError && err.code === "23505") {
      const field =
        err.constraint === "users_username_key" ? "username" : "email";
      throw new ConflictError(
        field === "username" ? "USERNAME_TAKEN" : "EMAIL_TAKEN",
        `${field} already taken`,
      );
    }
    throw err;
  }
}

export async function findUserByEmail(email: string) {
  const { rows } = await pool.query<User & { password_hash: string }>(
    "SELECT id, email, username, password_hash FROM users WHERE email = $1",
    [email],
  );
  return rows[0] ?? null;
}
