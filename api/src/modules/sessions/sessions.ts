import { createHash, randomBytes } from "node:crypto";
import type { CookieOptions, Request } from "express";
import { env } from "../../config/env.js";
import { pool, type Queryable } from "../../db/pool.js";
import { USER_COLUMNS, type User } from "../users/users.repository.js";

export const COOKIE_NAME = "sid";
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export interface NewSession {
  token: string;
  expiresAt: Date;
}

// cookie-parser turns "j:..." values into objects, so never trust the type
export function readSessionToken(req: Request): string | undefined {
  const token: unknown = req.cookies[COOKIE_NAME];
  return typeof token === "string" && token.length > 0 ? token : undefined;
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest();
}

export async function createSession(
  userId: string,
  db: Queryable = pool,
): Promise<NewSession> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await db.query(
    "INSERT INTO sessions (id_hash, user_id, expires_at) VALUES ($1, $2, $3)",
    [hashToken(token), userId, expiresAt],
  );
  return { token, expiresAt };
}

export async function getSessionUser(token: string) {
  const { rows } = await pool.query<User>(
    `SELECT ${USER_COLUMNS}
       FROM sessions s
       JOIN users u ON u.id = s.user_id
      WHERE s.id_hash = $1 AND s.expires_at > now()`,
    [hashToken(token)],
  );
  return rows[0] ?? null;
}

export async function deleteSession(token: string) {
  await pool.query("DELETE FROM sessions WHERE id_hash = $1", [
    hashToken(token),
  ]);
}

export async function deleteExpiredSessions() {
  const result = await pool.query(
    "DELETE FROM sessions WHERE expires_at < now()",
  );
  return result.rowCount ?? 0;
}

export function cookieOptions(expires?: Date): CookieOptions {
  return {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires,
  };
}
