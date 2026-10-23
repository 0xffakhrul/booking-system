# Tempah: API Contract (MVP)

| | |
| --- | --- |
| **Status** | Draft |
| **Last updated** | 2026-10-23 |
| **Related** | [PRD](prd.md) · [ERD](erd.md) · [ADR-0004](adr/0004-server-side-sessions.md) · [ADR-0007](adr/0007-bigint-ids-and-public-refs.md) |

## Conventions

- **Base path:** `/api`. The React app and the API are served from the same origin by Caddy, so there is no CORS.
- **Format:** JSON request and response bodies, `camelCase` keys. Request bodies are limited to 10 KB.
- **Auth:** owner routes need the `sid` session cookie set by register or login ([ADR-0004](adr/0004-server-side-sessions.md)). Public routes need nothing.
- **CSRF:** writes (`POST`, `PUT`, `PATCH`, `DELETE`) with an `Origin` header other than `APP_ORIGIN` are rejected with `403 BAD_ORIGIN`.
- **IDs:** numeric database IDs sent as **strings** (`"42"`). Unknown IDs, and IDs that belong to another tenant, both return `404`, so the API never reveals that another tenant's record exists.
- **Times:** timestamps are ISO 8601 in UTC (`2026-10-28T06:00:00Z`). A `date` query parameter (`2026-10-28`) means that calendar day **in the business's timezone**.
- **Money:** integer sen (`price` of `2800` = RM 28.00).
- **Request IDs:** every response has an `x-request-id` header, which matches the `requestId` in logs and 500 responses.

### Error format

Every error response has the same shape:

```json
{
  "error": {
    "code": "SLOT_TAKEN",
    "message": "That time was just booked. Please pick another.",
    "fields": { "customerPhone": ["Must be a valid Malaysian phone number"] },
    "requestId": "8c1d…"
  }
}
```

`fields` appears only on validation errors (from zod's `flatten().fieldErrors`), and `requestId` only on 500s.

| HTTP | `code` | When |
| --- | --- | --- |
| 400 | `VALIDATION_FAILED` | Body or query fails schema validation (see `fields`) |
| 400 | `BAD_REQUEST` | Malformed JSON |
| 401 | `UNAUTHENTICATED` | Missing or expired session on an owner route |
| 401 | `INVALID_CREDENTIALS` | Wrong email or password at login |
| 403 | `BAD_ORIGIN` | Write request from another origin |
| 403 | `FORBIDDEN` | Logged in, but the role isn't allowed |
| 404 | `NOT_FOUND` | Unknown ID or slug, or another tenant's ID |
| 409 | `SLUG_TAKEN` | Register with a slug that already exists |
| 409 | `EMAIL_TAKEN` | Register with an email that already exists |
| 409 | `SLOT_TAKEN` | Booking overlaps another booking (Postgres error `23P01`) |
| 422 | `OUTSIDE_WORKING_HOURS` | Booking doesn't fit inside the staff member's hours |
| 422 | `TOO_SOON` | Booking starts less than 1 hour from now (includes the past) |
| 422 | `OUTSIDE_BOOKING_WINDOW` | Date or booking is more than 30 days ahead, or before today |
| 422 | `INACTIVE_RESOURCE` | Service or staff member has been removed |
| 429 | `RATE_LIMITED` | Too many requests. Already applied to register and login. |
| 500 | `INTERNAL` | Anything unexpected. Details are logged, never returned. |

The split is: **400** means the request is malformed, **422** means it's well-formed but breaks a business rule.

## Health

| Method | Path | Auth | Response |
| --- | --- | --- | --- |
| GET | `/api/health` | none | `200 { "ok": true, "db": "up" }`. A database failure returns 500. |

## Auth

| Method | Path | Auth | Request | Success | Errors |
| --- | --- | --- | --- | --- | --- |
| POST | `/api/auth/register` | none | `{ businessName, slug, timezone?, email, password }` | `201 { user, tenant }` and sets `sid` | 409 `SLUG_TAKEN`, 409 `EMAIL_TAKEN`, 400, 429 |
| POST | `/api/auth/login` | none | `{ email, password }` | `200 { user, tenant }` and sets `sid` | 401 `INVALID_CREDENTIALS`, 400, 429 |
| POST | `/api/auth/logout` | none | none | `204`, deletes the session and clears `sid` | none |
| GET | `/api/auth/me` | owner | none | `200 { user, tenant }` | 401 |

- Register creates the tenant, the owner user and the session in **one transaction**.
- Validation: `businessName` is 2–80 characters. `slug` is 3–40 characters of `a-z`, `0-9` and `-`. `password` is 12–128 characters. `timezone` must be a valid IANA name and defaults to `Asia/Kuala_Lumpur`.

```json
// user
{ "id": "1", "email": "ali@example.com", "role": "owner" }
// tenant
{ "id": "1", "name": "Kedai Gunting Ali", "slug": "kedai-gunting-ali", "timezone": "Asia/Kuala_Lumpur" }
```

## Services (owner)

| Method | Path | Request | Success |
| --- | --- | --- | --- |
| GET | `/api/services` | none | `200 { services: Service[] }`, active ones only (`?includeInactive=true` for all) |
| POST | `/api/services` | `{ name, durationMin, price }` | `201 { service }` |
| PATCH | `/api/services/:id` | any of `{ name, durationMin, price }` | `200 { service }` |
| DELETE | `/api/services/:id` | none | `204` (sets `active = false`) |

```json
// Service
{ "id": "7", "name": "Haircut & wash", "durationMin": 45, "price": 2800, "active": true }
```

Changing `durationMin` doesn't affect existing bookings, because each booking stores its own time range.

## Staff (owner)

| Method | Path | Request | Success |
| --- | --- | --- | --- |
| GET | `/api/staff` | none | `200 { staff: Staff[] }`, active ones only (`?includeInactive=true` for all) |
| POST | `/api/staff` | `{ name }` | `201 { staff }` |
| PATCH | `/api/staff/:id` | `{ name }` | `200 { staff }` |
| DELETE | `/api/staff/:id` | none | `204` (sets `active = false`) |

## Working hours (owner)

| Method | Path | Request | Success |
| --- | --- | --- | --- |
| GET | `/api/staff/:id/hours` | none | `200 { hours: Range[] }` |
| PUT | `/api/staff/:id/hours` | `{ hours: Range[] }` | `200 { hours: Range[] }` |

```json
// Range: local wall-clock time in the tenant's timezone
{ "weekday": 3, "start": "10:00", "end": "13:00" }
```

`PUT` **replaces the whole week** in one transaction. Ranges on the same weekday must not overlap each other (validated in the API). Changing hours doesn't cancel existing bookings.

## Bookings (owner)

| Method | Path | Request | Success | Errors |
| --- | --- | --- | --- | --- |
| GET | `/api/bookings?date=YYYY-MM-DD` | none | `200 { bookings: Booking[] }`, sorted by start time, cancelled included | 400 |
| POST | `/api/bookings` | `{ serviceId, staffId, start, customerName, customerPhone }` | `201 { booking }` with `source: "manual"` | 409 `SLOT_TAKEN`, 400, 422 |
| PATCH | `/api/bookings/:id` | `{ status: "cancelled" }` or `{ start, staffId? }` | `200 { booking }` | 404, 409 `SLOT_TAKEN`, 400, 422 |

Owner-created bookings skip the `TOO_SOON` and `OUTSIDE_BOOKING_WINDOW` checks (so a walk-in can be recorded after it started, and phone bookings can be made further ahead) but still obey the overlap constraint.

```json
// Booking
{
  "id": "1042",
  "ref": "K7XQ9MPA",
  "service": { "id": "7", "name": "Haircut & wash", "durationMin": 45 },
  "staff": { "id": "3", "name": "Ali" },
  "customerName": "Amir",
  "customerPhone": "+60123456789",
  "start": "2026-10-28T06:00:00Z",
  "end": "2026-10-28T06:45:00Z",
  "status": "confirmed",
  "source": "online"
}
```

`ref` is a random 8-character code that a customer can read out over the phone ([ADR-0007](adr/0007-bigint-ids-and-public-refs.md)).

## Public (no auth)

| Method | Path | Request | Success | Errors |
| --- | --- | --- | --- | --- |
| GET | `/api/public/:slug` | none | `200 { business: { name, slug, timezone }, services: Service[], staff: { id, name }[] }` | 404 |
| GET | `/api/public/:slug/availability?serviceId=&date=&staffId=` | `staffId` optional | `200 { date, timezone, slots: Slot[] }` | 404, 400, 422 `OUTSIDE_BOOKING_WINDOW` |
| POST | `/api/public/:slug/bookings` | `{ serviceId, start, staffId?, customerName, customerPhone }` | `201 { booking }` with `source: "online"` | 404, 409 `SLOT_TAKEN`, 400, 422 |

```json
// Slot: one start time, with the staff members free for the whole service
{ "start": "2026-10-28T06:00:00Z", "end": "2026-10-28T06:45:00Z", "staffIds": ["3", "5"] }
```

Availability only returns slots starting at least 1 hour from now, and `date` must be between today and 30 days ahead in the business's timezone. Both limits come from `config`.

The public booking response leaves out the booking `id`, `customerPhone` and internal fields. The customer gets the `ref`.

### How booking with "anyone" works

When `staffId` is omitted, the server:

1. Lists active staff who are free for that slot, in a stable order.
2. Tries to insert the booking for the first one.
3. If Postgres raises `23P01` (overlap), tries the next one.
4. Returns `409 SLOT_TAKEN` only when every candidate fails.

Each attempt is a separate small transaction, so a failed insert doesn't abort the others.

### Server-side checks the database can't do

The exclusion constraint only prevents overlaps. Before inserting, the API also checks that:

- the service and staff member are active (`INACTIVE_RESOURCE`)
- `end = start + service.durationMin`, computed on the server and never trusted from the client
- the booking fits inside one of the staff member's working-hours ranges for that local weekday (`OUTSIDE_WORKING_HOURS`)
- for public bookings, the start is at least 1 hour from now (`TOO_SOON`) and no more than 30 days ahead (`OUTSIDE_BOOKING_WINDOW`)

## Added later (Phase 7)

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/api/public/:slug/bookings/:ref/checkout` | Create a Stripe Checkout session for a pending booking's deposit |
| POST | `/api/webhooks/stripe` | Stripe webhook (signature-verified, idempotent) |
| GET | `/api/bookings/:id/events` | Booking audit history |
| GET | `/api/stream` | Server-Sent Events for live dashboard updates |
| (all public routes) | | Rate limiting, returning 429 `RATE_LIMITED` |
