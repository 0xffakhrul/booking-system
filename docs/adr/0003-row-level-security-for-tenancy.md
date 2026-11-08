# ADR-0003: Shared tables with Row-Level Security for multi-tenancy

- **Status:** Accepted and implemented. Every table with a `tenant_id` has the policy below, except the global ones listed further down. A test fails if a new tenant table doesn't (`row-level-security.test.ts`).
- **Date:** 2026-10-23

## Context

Many businesses (tenants) share one Tempah deployment. One shop must never see or change another shop's data. Filtering with `WHERE tenant_id = $1` in every query works, but a single forgotten clause leaks data, and that kind of bug is easy to miss in review.

## Decision

Use one database with shared tables, where every tenant-owned row has a `tenant_id`, and enforce isolation with Postgres **Row-Level Security**:

```sql
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON bookings
  USING      (tenant_id = current_setting('app.tenant_id')::bigint)
  WITH CHECK (tenant_id = current_setting('app.tenant_id')::bigint);
```

Per request, the API (`middleware/tenant-transaction.ts`, `db/tenant.ts`):

1. Works out the tenant: from the logged-in user's `tenant_id` for owner routes (the session lookup in [ADR-0004](0004-server-side-sessions.md)), or from `:slug` for public routes.
2. Opens a transaction and runs `SELECT set_config('app.tenant_id', $1, true)`. The `true` makes it transaction-local, like `SET LOCAL`. `SET LOCAL` itself can't take a `$1` parameter, which is why `set_config` is used.
3. Runs the route's queries in that transaction. `AsyncLocalStorage` carries it through the request, so repositories use it by default (`currentDb()`) without it being passed around. A `withTransaction` inside the request becomes a savepoint.
4. Commits **before** the response goes out, so a client never sees `201` for a change that was then lost. Any 4xx or 5xx response rolls back instead.

Because the setting is transaction-local, it can't leak to the next request that reuses the same pooled connection. Code that runs outside a request (tests, and background jobs later) uses `asTenant(tenantId, fn)`.

### Roles

| Role | Used by | Notes |
| --- | --- | --- |
| The admin (`POSTGRES_USER`) | Migrations and `npm run db:setup` (`MIGRATION_DATABASE_URL`) | Owns the tables, so it skips RLS. The API never connects as it. |
| `tempah_app` | The API at runtime (`DATABASE_URL`) | Not a superuser, owns nothing, no `BYPASSRLS`. Only has `SELECT/INSERT/UPDATE/DELETE`. |

`npm run db:setup` runs the migrations as the admin, then creates or updates `tempah_app` from `DATABASE_URL`'s user and password and grants it access to every table. `npm run dev` runs it every time, so new tables get their grants. It refuses to turn an admin user into the API's user. The API checks its own user when it starts and refuses to run if that user would skip RLS (`checkAppRole`).

An earlier version of this ADR had a separate non-superuser owner role for migrations. It was dropped: it means moving the ownership of every table and still needs the superuser for extensions, and it adds no protection for the API, which never uses that connection.

These tables have **no** RLS policy, because they're read before a tenant is known:

| Table | Why it's global |
| --- | --- |
| `tenants` | Public routes look up a tenant by slug |
| `users` | Login looks up a user by email |
| `sessions` | `loadUser` looks up the session on every request |

Their repository functions always filter explicitly (by slug, email or token hash), and they never return another tenant's business data.

## Alternatives considered

| Option | Why not |
| --- | --- |
| Application-level `WHERE tenant_id` only | One forgotten clause leaks data, with nothing else to catch it |
| Schema per tenant | Migrations have to run N times, connection setup is more complicated, and it scales poorly past a few hundred tenants |
| Database per tenant | Strongest isolation, but the most operational work for no benefit at this size |

## Consequences

- **Good:** isolation is enforced below the application, and an isolation test suite can prove it (tenant A tries every route against tenant B's IDs).
- **Good:** another tenant's row returns "not found" naturally, matching the API rule to return `404` for other tenants' IDs.
- **Good:** it fails closed. A query run outside the tenant transaction errors (`invalid input syntax for type bigint: ""`, or `unrecognized configuration parameter` on a fresh connection) instead of returning every tenant's rows.
- **Bad:** every request needs a transaction and a `set_config` call, so a request-scoped database client has to be passed around instead of calling the pool directly.
- **Risk:** connecting as a superuser or the table owner silently disables RLS. Mitigated by separate roles, the startup check, and the isolation tests.
- **Cost:** a request holds one pooled connection from start to finish, so the pool size (10) caps how many requests are inside the database at once.
- Application code keeps its `tenant_id` filters as defence in depth.
