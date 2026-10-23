# Tempah: Product Requirements (MVP)

| | |
| --- | --- |
| **Status** | Draft |
| **Owner** | Fakhrul |
| **Last updated** | 2026-10-23 |
| **Related** | [ERD](erd.md) · [API contract](api.md) · [ADRs](adr/) · [Conventions](conventions.md) |

## 1. Problem

Small appointment-based businesses in Malaysia (barbers, salons, tuition centres, physio clinics) mostly take bookings through WhatsApp DMs and phone calls. That causes three problems:

- **Double-bookings.** Two customers get told "2 PM is free" by different staff, or the owner forgets a booking made over the phone.
- **Back-and-forth.** Settling on one time takes several messages, often outside business hours.
- **No overview.** The owner has no single view of who is coming today and which staff member is free.

## 2. Solution

Tempah gives each business a public booking link (`tempah.app/book/<slug>`) that customers open on their phone to pick a service and an open time slot. Owners manage services, staff and working hours, and see every booking in a daily dashboard. The system guarantees that **a staff member can never be booked twice for overlapping times**, even when two customers click the same slot at the same moment.

## 3. Users

| User | Description | Needs an account? |
| --- | --- | --- |
| **Owner** | Runs the business. Sets up services, staff and hours, and manages bookings. | Yes (email + password) |
| **Customer** | Books an appointment from the public link, usually on a phone. | No (name + phone only) |

Staff logins are out of scope for the MVP. Staff exist as records that the owner manages, not as users.

## 4. User stories

### Owner

| ID | Story | Acceptance criteria |
| --- | --- | --- |
| O1 | As an owner, I can sign up with my business name and email, so that I get my own booking page. | Signup creates the business and the owner account together, or neither. The slug is unique. |
| O2 | As an owner, I can log in, stay logged in, and log out. | A session survives a page refresh. A wrong password shows an error. Logging out ends the session on the server. |
| O3 | As an owner, I can add, edit and remove services (name, duration, price). | Duration is a positive multiple of 5 minutes. Removing a service hides it from customers but keeps past bookings intact. |
| O4 | As an owner, I can add, edit and remove staff. | Removing a staff member hides them from new bookings but keeps past bookings intact. |
| O5 | As an owner, I can set each staff member's weekly working hours, including breaks. | A day can have several time ranges (for example 10:00–13:00 and 14:00–18:00). An end time must be after its start time. |
| O6 | As an owner, I can see today's bookings on a timeline, one column per staff member. | Times are shown in the business's timezone. |
| O7 | As an owner, I can cancel or reschedule a booking. | A cancelled slot becomes bookable again. Rescheduling into a taken slot fails with a clear message. |
| O8 | As an owner, I can add a booking manually for walk-ins and phone calls. | Manual bookings follow the same overlap rules as online ones. |
| O9 | As an owner, I can copy my public booking link. | One click copies the full URL. |

### Customer

| ID | Story | Acceptance criteria |
| --- | --- | --- |
| C1 | As a customer, I can open a business's booking link and see its services with prices and durations. | Works without logging in. Inactive services are hidden. |
| C2 | As a customer, I can pick a date and see only times that are actually free. | Only dates from today up to 30 days ahead can be picked. Times less than 1 hour away, times outside working hours and times that overlap existing bookings are not shown. |
| C3 | As a customer, I can book a slot with my name and phone number. | I see a confirmation screen with the service, date, time and staff name. |
| C4 | As a customer, if someone books my slot a moment before me, I'm told clearly and shown other times. | The API returns 409, and the UI shows the "slot just taken" screen without losing my name and phone. |
| C5 | As a customer, I can choose a specific staff member or "anyone". | With "anyone", the system assigns a free staff member. |

## 5. Scope

### In scope (MVP, roadmap days 1–40)

- Owner signup, login, logout
- Services, staff and weekly working hours management
- Public booking page with live availability
- Booking creation with database-enforced overlap prevention
- Owner dashboard: daily timeline, cancel, reschedule, manual booking
- Multi-tenant isolation enforced by Postgres Row-Level Security
- Deployed at a public HTTPS URL, with nightly backups and seeded demo data

### Out of scope for the MVP (candidates for Phase 7 or later)

- Payments and deposits, and holding a slot during payment (Phase 7)
- Reminder emails or messages (Phase 7)
- Live dashboard updates without refresh (Phase 7)
- Booking audit history (Phase 7)
- Customers cancelling or rescheduling their own booking. The "Reschedule or cancel" button in the mockup is a placeholder.
- Staff logins and staff-specific permissions
- Restricting which staff can perform which service (the MVP assumes every staff member does every service)
- Multiple locations per business
- Recurring bookings, waitlists, holidays and one-off closures
- Customer accounts and booking history
- Languages other than English

## 6. Success criteria

The MVP is done when all of these are true:

1. **No double-bookings.** An automated test fires 20 simultaneous bookings at the same slot, and exactly 1 succeeds every run.
2. **Tenant isolation.** An automated test shows that business A cannot read or change business B's data through any route.
3. **Fast booking.** A first-time customer can book on a phone in under 60 seconds.
4. **Live and reproducible.** The app runs at a public HTTPS URL, CI is green on `main`, and `docker compose up` starts it locally.
5. **Explained.** The README describes the architecture and how double-booking is prevented.

## 7. Non-functional requirements

| Area | Requirement |
| --- | --- |
| Performance | Availability endpoint p95 under 300 ms with seeded demo data |
| Security | Passwords hashed with argon2id. Server-side sessions with a hashed token in an httpOnly, Secure, SameSite=Lax cookie. Origin check on writes. Login and register rate-limited. Parameterized SQL only. Secrets only in environment variables. |
| Time handling | All timestamps stored as `timestamptz` (UTC). Each business has an IANA timezone (default `Asia/Kuala_Lumpur`), and conversion happens at the edges. |
| Mobile | Public booking pages work at 360 px wide. Touch targets are at least 44 px. |
| Reliability | Nightly `pg_dump` backup copied off the server, restore tested at least once |
| Observability | Structured JSON logs (pino) with a request ID on each line. `GET /health` checks the database. |

## 8. Business rules

- A booking's length is the service's duration at the time of booking.
- Available start times are generated from the start of each working-hours range, stepping by the service's duration. For example, a 45-minute service in a 10:00–13:00 range offers 10:00, 10:45, 11:30 and 12:15.
- A booking must fit entirely inside one working-hours range of its staff member.
- **Minimum notice:** customers can only book times starting at least **1 hour** from now. For example, at 1:20 PM the earliest bookable start is 2:20 PM or later.
- **Booking window:** customers can book up to **30 days** ahead, counted in calendar days in the business's timezone. On 1 November, the last bookable day is 1 December.
- Owners adding manual bookings are exempt from both limits, so walk-ins and far-ahead phone bookings still work.
- Two non-cancelled bookings for the same staff member may never overlap. Back-to-back bookings (one ends at 10:45, the next starts at 10:45) are allowed.
- With "anyone", the server tries free staff members in a stable order and assigns the first one that succeeds.
- Phone numbers are stored in E.164 format (`+60123456789`).

## 9. Decisions log

| Date | Decision |
| --- | --- |
| 2026-10-23 | Start times step by each service's own length, not a fixed grid. A 15-minute grid may come later. |
| 2026-10-23 | Minimum notice for customer bookings is 1 hour. |
| 2026-10-23 | Customers can book up to 30 days ahead. |
| 2026-10-23 | Both limits are constants in `config` for the MVP. Per-business settings may come later. |
