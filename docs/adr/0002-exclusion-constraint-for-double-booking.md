# ADR-0002: Prevent double-booking with a Postgres exclusion constraint

- **Status:** Accepted
- **Date:** 2026-10-23

## Context

The most important guarantee in Tempah is that one staff member is never booked twice for overlapping times. Customers book concurrently from their phones, and the owner adds manual bookings at the same time. A check done only in application code has a race condition:

```
Request A: SELECT … overlapping bookings?  → none
Request B: SELECT … overlapping bookings?  → none
Request A: INSERT booking                  → ok
Request B: INSERT booking                  → ok   ← double-booked
```

Bookings also have different lengths (15, 30 or 45 minutes), so "same start time" isn't the same thing as "overlapping".

## Decision

Store each booking's time as a `tstzrange` and let Postgres reject overlaps:

```sql
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE bookings
  ADD CONSTRAINT bookings_no_overlap
  EXCLUDE USING gist (
    staff_id WITH =,
    during   WITH &&
  ) WHERE (status <> 'cancelled');
```

- Ranges are half-open, `[start, end)`, so back-to-back bookings (10:00–10:45 and 10:45–11:30) don't overlap.
- Cancelled bookings are excluded by the `WHERE` clause, so cancelling a booking frees its slot.
- The API catches Postgres error `23P01` (`exclusion_violation`) and returns `409 SLOT_TAKEN`.
- An integration test fires 20 concurrent inserts for one slot and asserts exactly 1 succeeds.

## Alternatives considered

| Option | Why not |
| --- | --- |
| Check in application code, then insert | Race condition, as shown above |
| `UNIQUE (staff_id, start_time)` | Only catches identical start times. A 10:00 (45 min) booking and a 10:30 booking would both be accepted. |
| `SELECT … FOR UPDATE` on the staff row, then check and insert | Works, but serializes every booking for that staff member, and every code path that inserts bookings has to remember to take the lock |
| Advisory locks per staff member and day | Works, but the same "everyone must remember" problem, and it's harder to explain |
| `SERIALIZABLE` isolation | Works, but needs retry loops on every serialization failure, and the rule stays implicit instead of declared |

## Consequences

- **Good:** the rule is declared once in the schema and holds for every code path, including manual bookings, reschedules, future features and someone running SQL by hand. No locks in application code.
- **Good:** the GiST index the constraint creates also speeds up the availability query.
- **Bad:** needs the `btree_gist` extension, and the error shows up as an exception rather than a normal return value.
- **Later:** Phase 7 adds a `pending` status for payment holds. Pending bookings must still block the slot, so the `WHERE` clause stays `status <> 'cancelled'`, and expired holds get cancelled by a background job.
