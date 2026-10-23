# ADR-0001: Raw SQL with `pg` and SQL migrations, no ORM

- **Status:** Accepted
- **Date:** 2026-10-23

## Context

The core features of Tempah depend on Postgres-specific behaviour: range types (`tstzrange`), an exclusion constraint, Row-Level Security with a per-transaction setting, and `generate_series` for availability. ORMs model tables and simple relations well, but these features either aren't supported or end up hidden in raw-SQL escape hatches anyway.

This is also a learning and portfolio project. Being able to read, write and explain the SQL is part of the goal.

## Decision

- Use the [`pg`](https://node-postgres.com/) driver directly, with one shared `Pool`.
- Write schema changes as SQL migrations with [`node-pg-migrate`](https://salsita.github.io/node-pg-migrate/), committed to the repo and run with `npm run migrate up`.
- `infra/postgres/init/` (Docker's `docker-entrypoint-initdb.d`) only creates **database roles and extensions**, which need a superuser. Those scripts only run when the data volume is empty, so all tables live in migrations, which run on every deploy.
- Group queries into a repository file per feature module (`modules/bookings/bookings.repository.ts`). Route handlers never build SQL.
- Use **parameterized queries only** (`$1, $2`). Never concatenate input into SQL.
- Map `snake_case` columns to `camelCase` in the repository layer.

## Alternatives considered

| Option | Why not |
| --- | --- |
| Prisma | Doesn't model exclusion constraints or range types natively. RLS needs a per-transaction `set_config`, which is awkward through its client. |
| Sequelize / TypeORM | Heavy abstraction, and the same problems with Postgres-specific features |
| Knex (query builder) | A reasonable middle ground, but it adds an API to learn without giving much over plain SQL for this schema |
| Drizzle | Closer to SQL and typed, but newer, and range types and RLS still need raw SQL |

## Consequences

- **Good:** every query is visible and explainable in an interview. Full access to Postgres features. Fewer dependencies.
- **Bad:** more boilerplate (row mapping, writing `INSERT`s by hand). No generated types (see [ADR-0006](0006-typescript-for-the-api.md)).
- **Risk:** SQL injection if someone concatenates a string. Mitigated by the parameterized-only rule, code review, and an ESLint rule or grep check in CI for template literals passed to `query()`.
- **Migration path:** the `users` and `sessions` tables currently created in `infra/postgres/init/001_init.sql` move into the first migration on Day 4. After that, the init script keeps only `CREATE EXTENSION` and `CREATE ROLE`.
