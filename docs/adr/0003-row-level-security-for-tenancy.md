# ADR-0003: Shared tables with Row-Level Security for multi-tenancy

- **Status:** Accepted (implemented in Phase 5; until then, every query filters by `tenant_id` in code)
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

Per request, the API:

1. Works out the tenant: from the logged-in user's `tenant_id` for owner routes (the session lookup in [ADR-0004](0004-server-side-sessions.md)), or from `:slug` for public routes.
2. Opens a transaction and runs `SELECT set_config('app.tenant_id', $1, true)`. The `true` makes it transaction-local, like `SET LOCAL`. `SET LOCAL` itself can't take a `$1` parameter, which is why `set_config` is used.
3. Runs the route's queries in that transaction, then commits.

Because the setting is transaction-local, it can't leak to the next request that reuses the same pooled connection.

### Roles

| Role | Used by | Notes |
| --- | --- | --- |
| `tempah_owner` | Migrations | Owns the tables. Table owners bypass RLS unless `FORCE ROW LEVEL SECURITY` is set. |
| `tempah_app` | The API at runtime (`DATABASE_URL`) | Not a superuser, not the table owner, no `BYPASSRLS`. Only has `SELECT/INSERT/UPDATE/DELETE` grants. |

Both roles are created once per environment by a small setup script, since creating roles needs a superuser. So the API needs two connection strings: `MIGRATION_DATABASE_URL` for `tempah_owner` and `DATABASE_URL` for `tempah_app`.

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
- **Risk:** connecting as a superuser or the table owner silently disables RLS. Mitigated by separate roles, a startup check (`SELECT rolsuper, rolbypassrls FROM pg_roles WHERE rolname = current_user` must be false for both), and the isolation tests.
- Application code keeps its `tenant_id` filters as defence in depth.
