# Booking System

A multi-tenant appointment booking app for small businesses such as barbers, salons and clinics. Each business gets a public booking link, customers book a free slot from their phone, and the owner manages services, staff, working hours and the day's bookings from a dashboard.

> **Status:** in active development. The API has auth; booking features are being built.

## Highlights

- **No double-booking, even under concurrent requests.** A Postgres exclusion constraint rejects overlapping bookings for the same staff member at the database level ([ADR-0002](docs/adr/0002-exclusion-constraint-for-double-booking.md)).
- **Tenant isolation enforced by Postgres.** Row-Level Security keeps each business's data separate, even if a query forgets a `WHERE` clause ([ADR-0003](docs/adr/0003-row-level-security-for-tenancy.md)).
- **Revocable sessions.** Server-side sessions with hashed tokens, argon2id passwords, Origin checks and rate-limited login ([ADR-0004](docs/adr/0004-server-side-sessions.md)).

## Stack

| Layer    | Tech                                                           |
| -------- | -------------------------------------------------------------- |
| API      | Node.js 24, Express 5, TypeScript (strict), zod, pino          |
| Database | PostgreSQL 17, raw SQL with `pg`                               |
| Frontend | React, Vite, TanStack Query, Tailwind, shadcn/ui (coming soon) |
| Tooling  | npm workspaces, ESLint, Prettier, Docker Compose, Bruno        |

## Getting started

Requirements: **Node.js 24** (see `.nvmrc`) and **Docker**.

```bash
cp .env.example .env    # adjust values if you like
npm install             # installs tooling + API dependencies
npm run dev             # starts Postgres + the API, runs migrations, hot reload
```

Then check it's up:

```bash
curl http://localhost:3009/api/health
# {"ok":true,"db":"up"}
```

To try the API by hand, open the `bruno/` folder in [Bruno](https://www.usebruno.com/) and pick the `local` environment.

## Scripts

Run from the repo root:

| Command                         | What it does                                                    |
| ------------------------------- | --------------------------------------------------------------- |
| `npm run dev`                   | Start Postgres and the API in Docker, with hot reload           |
| `npm run lint`                  | ESLint across the repo                                          |
| `npm run format`                | Format everything with Prettier                                 |
| `npm run typecheck`             | TypeScript check for every workspace                            |
| `npm run check`                 | Format check + lint + typecheck (what CI will run)              |
| `npm test`                      | Run the API integration tests (needs `npm run dev` running)     |
| `npm run migrate up`            | Apply pending database migrations (needs `npm run dev` running) |
| `npm run migrate down`          | Roll back the most recent migration                             |
| `npm run migrate create <name>` | Create a new SQL migration in `api/migrations/`                 |

## Project structure

```
api/              Express API (npm workspace)
api/migrations/   SQL migrations (node-pg-migrate)
web/              React app (coming soon)
bruno/            API requests for manual testing
docs/             Product requirements, data model, API contract, decisions
```

## Documentation

- [Product requirements](docs/prd.md)
- [Data model](docs/erd.md)
- [API contract](docs/api.md)
- [Architecture decisions](docs/README.md#decisions)
- [Working conventions](docs/conventions.md)
