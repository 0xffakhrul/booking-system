# Tempah: Working Conventions

How work gets done in this repo. The rules are kept short so they actually get followed.

## Daily workflow

1. Pick the day's issue from the GitHub Project board (one issue per roadmap day).
2. Create a branch from `main`: `day-14-working-hours-api`.
3. Commit as you go (see the commit format below).
4. Open a PR that says `Closes #14`, then fill in the template.
5. CI must be green. Read your own diff once, top to bottom, before merging.
6. **Squash merge** into `main`, so `main` gets one clean commit per day.
7. Tick the day off in the roadmap.

`main` is protected: no direct pushes, PRs only, and CI must pass. Do this even working alone. It's the habit employers want to see.

## Commit messages: Conventional Commits

```
<type>(<scope>): <what changed, imperative, lowercase>

feat(bookings): reject overlapping bookings with 409
fix(availability): exclude slots that cross a break
test(bookings): add 20-way concurrency test
docs(adr): record decision on row-level security
chore(ci): run migrations before tests
refactor(db): move booking queries into repository module
```

| Type | Use for |
| --- | --- |
| `feat` | New behaviour a user or API client can see |
| `fix` | Bug fix |
| `test` | Tests only |
| `docs` | Docs only |
| `refactor` | Code change with no behaviour change |
| `chore` | Tooling, CI, dependencies, config |

Scopes: `api`, `web`, `db`, `auth`, `services`, `staff`, `hours`, `bookings`, `availability`, `ci`, `adr`.

## Definition of Done

A day's module is done when:

- [ ] The issue's "done when" line from the roadmap is true
- [ ] New behaviour has at least one test (API) or has been checked by hand on a phone-width screen (UI)
- [ ] `npm run lint` and `npm test` pass locally and in CI
- [ ] Schema changes are a migration with a working `down`
- [ ] No secrets, `console.log` debugging or commented-out code left in the diff
- [ ] Docs updated if the API contract, schema or a decision changed
- [ ] Merged to `main`

## Code style

- **ESLint + Prettier**, run on save and in CI. Don't argue with the formatter.
- **Naming:** `snake_case` in the database, `camelCase` in JavaScript and JSON, `PascalCase` for React components and their files (`BookingCard.tsx`).
- **SQL:** parameterized only. Keep queries in the feature's `*.repository.ts`, never inside route handlers or services.
- **Errors:** throw an `AppError` subclass carrying an HTTP status and a [`code`](api.md#error-format) (`ConflictError("SLOT_TAKEN", …)`). `error-handler.ts` turns every error into the standard shape. Never send stack traces to clients.
- **Config:** read all environment variables in `config/env.ts`, validated with zod at startup. Commit `.env.example` with every variable listed. Never commit `.env`.
- **Types:** strict TypeScript. IDs are `string` (see [ADR-0007](adr/0007-bigint-ids-and-public-refs.md)). Never `Number()` an ID.
- **Manual API testing:** add a Bruno request (`bruno/<module>/`) with tests for every new route, alongside the automated tests.

## API folder layout

This follows the structure already in the repo: shared plumbing at the top level, and one folder per feature under `modules/`.

```
api/src/
├── index.ts                 starts the server, graceful shutdown
├── app.ts                   Express app: middleware + routes
├── config/env.ts            env vars, validated with zod
├── db/
│   ├── pool.ts              shared pg Pool + Queryable type
│   ├── transaction.ts       withTransaction(fn)
│   └── tenant.ts            withTenant(tenantId, fn): transaction + set_config (Phase 5)
├── lib/                     errors, logger, password, time helpers
├── middleware/              auth, check-origin, error-handler, http-logger, validate
├── modules/
│   ├── auth/                auth.routes.ts · auth.schemas.ts · auth.service.ts
│   ├── sessions/
│   ├── users/               users.repository.ts
│   ├── tenants/
│   ├── services/            *.routes.ts · *.schemas.ts · *.service.ts · *.repository.ts
│   ├── staff/
│   ├── bookings/
│   └── public/              the customer-facing routes
└── types/express.d.ts       req.user, req.tenantId
```

Inside a module: **routes** parse input and shape the response, **services** hold business rules and transactions, and **repositories** run SQL. Dependencies only point downward: routes → services → repositories.

## Web folder layout

React + Vite + TypeScript ([ADR-0008](adr/0008-react-spa-for-the-frontend.md)), organised by feature like the API.

```
web/src/
├── main.tsx                 React root, QueryClient, router
├── routes.tsx               route table: /book/:slug/*, /login, /app/*
├── lib/
│   ├── api.ts               fetch wrapper: JSON, credentials, throws ApiError(code)
│   └── time.ts              format times in the tenant's timezone
├── components/
│   ├── ui/                  shadcn/ui components (generated, then owned by us)
│   └── …                    app-specific shared components: PageHeader, EmptyState
└── features/
    ├── auth/                LoginPage.tsx · useMe.ts · RequireAuth.tsx
    ├── booking/             BookingPage.tsx · SlotGrid.tsx · useAvailability.ts
    ├── dashboard/           DayTimeline.tsx · useBookings.ts
    ├── services/
    └── staff/
```

- Every API call goes through a hook in its feature (`useAvailability`, `useCreateBooking`), built on TanStack Query. Components never call `fetch` directly.
- Use shadcn/ui components from `components/ui/` before writing your own. Edit them there to restyle; don't wrap them in extra layers.
- Branch on `ApiError.code` (`SLOT_TAKEN`, `VALIDATION_FAILED`), never on message text.

## Recording decisions

When you make a choice someone might later ask "why?" about, add an ADR: copy [`adr/0000-template.md`](adr/0000-template.md), give it the next number, and keep it under one page. Don't edit an accepted ADR to change a decision. Write a new one that says `Supersedes ADR-000X`.
