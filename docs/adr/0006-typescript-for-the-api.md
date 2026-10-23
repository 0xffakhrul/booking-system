# ADR-0006: TypeScript in strict mode

- **Status:** Accepted (already in place in `api/`)
- **Date:** 2026-10-23

## Context

Most mid-level Node.js and React job postings in Malaysia list TypeScript as required or preferred. Raw SQL ([ADR-0001](0001-raw-sql-with-pg.md)) means database rows don't come with generated types, so the types have to be written by hand.

## Decision

- The API is TypeScript with `strict`, `noUncheckedIndexedAccess` and `verbatimModuleSyntax`, using native ES modules (`"module": "NodeNext"`).
- `tsx watch` runs the API in development. `tsc` builds it, and `npm run typecheck` (`tsc --noEmit`) runs in CI and in the Docker build.
- Request types come from zod schemas via `z.infer`. Row types are plain interfaces written next to each repository module.
- The React app is TypeScript too (`.tsx`), type-checked with `tsc --noEmit` (see [ADR-0008](0008-react-spa-for-the-frontend.md)).
- Keep types simple: plain interfaces and unions, no advanced type-level tricks.

## Alternatives considered

| Option | Why not |
| --- | --- |
| Plain JavaScript | Faster to start, but a weaker hiring signal and no compiler help when refactoring |
| JavaScript with JSDoc types and `checkJs` | Shows type awareness, but it's an unusual choice to defend in interviews |

## Consequences

- **Good:** refactors are safer, editor autocomplete works across modules, and the code matches what job postings ask for.
- **Bad:** a little extra setup, especially for the React app on Day 15.
- **Watch out:** `pg` returns `BIGINT` columns as strings, so IDs are typed as `string` in TypeScript (see [ADR-0007](0007-bigint-ids-and-public-refs.md)).
