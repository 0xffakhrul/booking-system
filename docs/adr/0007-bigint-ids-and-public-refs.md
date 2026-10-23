# ADR-0007: BIGINT identity keys, with random references for customers

- **Status:** Accepted
- **Date:** 2026-10-23

## Context

The existing `users` table uses `BIGINT GENERATED ALWAYS AS IDENTITY` primary keys. The rest of the schema needs a consistent choice. Sequential IDs are compact and fast to index, but they're guessable and reveal volume: booking #1042 tells a customer roughly how many bookings exist.

## Decision

- Every table uses `id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY`.
- IDs travel as **strings** in JSON. `pg` already returns `BIGINT` as a string, and JavaScript numbers lose precision above 2^53.
- Anything shown to a customer gets a separate random reference instead of its ID. For bookings that's `ref`: 8 characters from an unambiguous alphabet (no `0/O`, `1/I/L`), generated with `crypto.randomInt`, `UNIQUE` per tenant, with a retry on the rare collision.
- Owner routes may use IDs in URLs (`PATCH /api/bookings/:id`), because Row-Level Security and the 404 rule already stop cross-tenant guessing.

## Alternatives considered

| Option | Why not |
| --- | --- |
| UUID primary keys everywhere | Unguessable, but twice the size of `BIGINT` in every index and foreign key, and harder to read in logs and `psql`. Only bookings are shown to customers, so a `ref` column covers that one need. |
| Expose sequential IDs to customers | Leaks booking volume and invites guessing |

## Consequences

- **Good:** matches the existing code, uses small fast indexes, and keeps IDs readable while debugging.
- **Bad:** one extra column and a collision retry for bookings.
- **Watch out:** never `Number()` an ID. Keep IDs as strings end to end.
