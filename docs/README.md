# Tempah docs

| Doc | What it answers |
| --- | --- |
| [PRD](prd.md) | What are we building, for whom, and what's out of scope? |
| [Data model](erd.md) | Which tables exist, and which rules does the database enforce? |
| [API contract](api.md) | Which routes exist, and what do they accept and return? |
| [Conventions](conventions.md) | How is work done here: branches, commits, Definition of Done? |
| [Architecture decisions](adr/) | Why was it built this way? |

## Decisions

| ADR | Decision | Status |
| --- | --- | --- |
| [0001](adr/0001-raw-sql-with-pg.md) | Raw SQL with `pg` and SQL migrations, no ORM | Accepted |
| [0002](adr/0002-exclusion-constraint-for-double-booking.md) | Prevent double-booking with a Postgres exclusion constraint | Accepted |
| [0003](adr/0003-row-level-security-for-tenancy.md) | Shared tables with Row-Level Security for multi-tenancy | Accepted |
| [0004](adr/0004-server-side-sessions.md) | Server-side sessions with hashed opaque tokens | Accepted |
| [0005](adr/0005-monorepo-npm-workspaces.md) | One repo with npm workspaces | Accepted |
| [0006](adr/0006-typescript-for-the-api.md) | TypeScript in strict mode | Accepted |
| [0007](adr/0007-bigint-ids-and-public-refs.md) | BIGINT identity keys, with random references for customers | Accepted |
| [0008](adr/0008-react-spa-for-the-frontend.md) | React single-page app with Vite for the frontend | Accepted |
