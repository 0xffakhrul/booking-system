# ADR-0005: One repo with npm workspaces for API and web

- **Status:** Accepted
- **Date:** 2026-10-23

## Context

Tempah has two deployable parts, an Express API and a React app, built by one person, often changing both in the same day's work.

## Decision

Use one Git repository with npm workspaces:

```
tempah/
├── api/            Express 5 + TypeScript API (workspace)
├── web/            React + Vite + TypeScript app (workspace, added on Day 15)
├── infra/          Postgres init scripts (roles, extensions), later Caddy config
├── bruno/          Bruno collection for manual API testing
├── docs/           PRD, ERD, API contract, ADRs
├── .github/        CI workflows, PR template
├── docker-compose.yml
└── package.json    root: workspaces + shared scripts (lint, test, typecheck)
```

If the API and web later share code (for example zod schemas), it goes in a third workspace, `packages/shared/`.

## Alternatives considered

| Option | Why not |
| --- | --- |
| Two repositories | A feature that touches both sides needs two PRs and two CI runs, and the docs end up in one repo or duplicated |
| Turborepo or Nx | Build caching and task graphs only pay off with many packages. Too much tooling for two. |
| pnpm workspaces | Equally good. npm is used because it ships with Node and you already use it daily. |

## Consequences

- **Good:** one PR per feature, one CI pipeline, and docs next to the code. Reviewers see the whole project in one place.
- **Bad:** CI runs both test suites on every change. That's acceptable at this size, and path filters can be added later.
