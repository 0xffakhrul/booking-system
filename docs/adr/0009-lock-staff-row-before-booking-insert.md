# ADR-0009: Lock the staff row before inserting a booking

- **Status:** Accepted
- **Date:** 2026-11-01

## Context

The concurrency test (20 customers booking one slot at once) showed that the exclusion constraint from [ADR-0002](0002-exclusion-constraint-for-double-booking.md) never allows a double booking, but under contention concurrent inserts **deadlock**. Each INSERT adds its row to the constraint's GiST index first and then checks for conflicts, so two inserts each find the other's uncommitted row and wait for each other. Postgres breaks the cycle after `deadlock_timeout` (1 s) by aborting one with `40P01`:

- the customer got a **500** instead of `409 SLOT_TAKEN`, because only `23P01` was handled
- requests took a second or more per deadlock, and with 20 racers sharing a 10-connection pool, the test timed out
- retrying on `40P01` alone made it worse: the retried insert went back into the pile-up

## Decision

Each booking insert runs in a short transaction that first locks the staff member's row:

```sql
BEGIN;
SELECT 1 FROM staff WHERE tenant_id = $1 AND id = $2 FOR UPDATE;
INSERT INTO bookings (...) VALUES (...);  -- 23P01 if the slot is taken
COMMIT;
```

Inserts for the same staff member now happen one at a time, so the losers fail fast with a clean `23P01` (409). The exclusion constraint is still what guarantees no double booking; the lock only removes the deadlocks. `40P01` stays retryable (up to 3 attempts) as a safety net for any code path that writes bookings without the lock.

## Alternatives considered

| Option | Why not |
| --- | --- |
| Retry on `40P01` only | Tried first. Each retry re-entered the same contention and waited another `deadlock_timeout`; the 20-way test regularly took over 30 s. |
| Lower `deadlock_timeout` | Superuser-only setting, applies to the whole server, and only makes the pile-up cheaper rather than removing it |
| `pg_advisory_xact_lock(staff_id)` | Works the same way, but advisory lock keys are one shared number space for the whole database, so a row lock is clearer |
| Lock the slot instead of the staff member | There's no row for a slot to lock. Bookings for one person are a handful an hour, so locking the person costs nothing measurable. |

## Consequences

- **Good:** 20 concurrent requests for one slot: exactly 1 succeeds and 19 get `409`, with 0 deadlocks over 100 races in testing, at about 0.2 s per race.
- **Good:** correctness still lives in the schema. A code path that forgets the lock can't double-book; at worst it deadlocks and retries.
- **Bad:** booking inserts for one staff member are serialized, and they also wait for a working-hours update of that person (which takes the same lock). Both are short.
- **Note:** ADR-0002 rejected `SELECT … FOR UPDATE` as the way to *prevent* overlaps. This uses it only to keep the constraint check from deadlocking, which is a different job, so ADR-0002 still stands.
