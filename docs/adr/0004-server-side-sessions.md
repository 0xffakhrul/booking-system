# ADR-0004: Server-side sessions with hashed opaque tokens

- **Status:** Accepted (already implemented in `api/src/modules/sessions/`)
- **Date:** 2026-10-23

## Context

Owners log in to the dashboard, and the session must survive page refreshes. The React app and the API are served from the same origin. Customers never log in. Owners must be able to log out for real, which means the session ends on the server, not just in the browser.

## Decision

- On register or login, generate a random 32-byte token (`crypto.randomBytes`, base64url) and send it to the browser in a cookie named `sid`: `HttpOnly`, `Secure` in production, `SameSite=Lax`, `Path=/`, expiring after 7 days.
- Store only the **SHA-256 hash** of the token in the `sessions` table, together with `user_id` and `expires_at`. A leaked database backup therefore contains no usable session tokens.
- `loadUser` middleware hashes the cookie value and looks up the session joined to its user. `requireAuth` rejects requests without one.
- On login, any existing session from the request's cookie is deleted first (session fixation defence).
- Logout deletes the session row and clears the cookie.
- A cleanup timer deletes expired sessions hourly. It moves into the Postgres job queue in Phase 7.
- Passwords are hashed with **argon2id**. Login compares against a dummy hash when the email doesn't exist, so response time doesn't reveal which emails are registered.
- `POST /api/auth/register` and `/login` are rate-limited to 10 requests per 15 minutes per IP.

## Alternatives considered

| Option | Why not |
| --- | --- |
| JWT in an httpOnly cookie | No database lookup per request, but a JWT can't be revoked before it expires. Logout and "a password change ends other sessions" both need a denylist, which is a sessions table again. |
| JWT in `localStorage`, sent as `Authorization: Bearer` | Any XSS bug can read the token and steal the session |
| Access token + refresh token pair | More moving parts than an app with one user type needs |
| bcrypt for passwords | Fine, but argon2id is the current OWASP first choice and resists GPU cracking better |

## Consequences

- **Good:** sessions are instantly revocable (logout, password change, "log out everywhere" later). The token isn't readable by page scripts, and a stolen database dump holds no usable tokens.
- **Bad:** one indexed database query per authenticated request. That's negligible at this scale, and the primary-key lookup on `id_hash` is fast.
- **CSRF:** `SameSite=Lax` stops the cookie being sent on cross-site `POST`, `PATCH` and `DELETE`. On top of that, `checkOrigin` middleware rejects writes whose `Origin` header isn't `APP_ORIGIN`.
- **Multi-tenancy:** `users` and `sessions` are global tables without Row-Level Security, because the session lookup has to run before the tenant is known. The user's `tenant_id` from that lookup then sets `app.tenant_id` for the rest of the request (see [ADR-0003](0003-row-level-security-for-tenancy.md)).
