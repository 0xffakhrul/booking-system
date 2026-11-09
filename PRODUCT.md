# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Owner.** Runs a small appointment-based business in Malaysia (barber, salon, tuition centre, physio clinic). Sets up services, staff and weekly working hours, then manages the day's bookings: sees who is coming, cancels, reschedules, adds walk-ins and phone bookings. Device is mixed or unknown: treat phone and laptop/tablet at the counter as equally first-class.
- **Customer.** Opens the business's public booking link, almost always on a phone, picks a service, staff (or "anyone") and a free time, and books with name and phone number. No account. Target: a first-time customer books in under 60 seconds.
- **Reviewer.** Tempah is a portfolio and learning project. Engineers and recruiters evaluating the build are a real audience: they read the README and ADRs, click through the demo, and judge both the engineering and the product craft.

## Product Purpose

Replace WhatsApp-DM and phone-call booking for small shops. Each business gets a public link (`tempah.app/book/<slug>`); owners get a daily dashboard. The core promise: a staff member can never be double-booked, even when two customers click the same slot at the same moment.

Success (from the PRD): no double-bookings under 20 concurrent requests, tenant isolation across every route, sub-60-second phone booking, live at a public HTTPS URL with green CI, and an architecture the README explains.

## Positioning

Correctness enforced by the database, not by hope: a Postgres exclusion constraint makes overlapping bookings impossible, and Row-Level Security keeps each business's data separate even when a query forgets its `WHERE`. As a portfolio piece, the product exists to show that a simple-looking booking flow is backed by real concurrency and multi-tenancy engineering.

## Operating Context

- Customer flow: service picker, date strip (today to 30 days ahead), free time slots, details form, confirmation; a "slot just taken" screen on a 409 that keeps the customer's name and phone.
- Owner app: login/register, dashboard (setup checklist, day timeline with one column per staff member, booking dialog for cancel/reschedule, new-booking dialog), services, staff, per-staff working hours with multiple ranges per day.
- Times shown in the business's IANA timezone (default `Asia/Kuala_Lumpur`). Prices in MYR. Phone numbers in E.164 (`+60…`).
- Business names are often Malay (e.g. "Kedai Gunting Ali"); UI language is English only.

## Capabilities and Constraints

- Business rules: start times step by the service's own duration from the start of each working range; a booking must fit inside one range; customers need 1 hour minimum notice and can book at most 30 calendar days ahead; owner manual bookings are exempt from both limits; back-to-back bookings are allowed.
- "Anyone" assigns the first free staff member in a stable order. Every staff member performs every service in the MVP.
- Out of scope for the MVP: payments/deposits, reminders, live dashboard updates, audit history, customer self-cancel/reschedule (the "Reschedule or cancel" button is a placeholder), staff logins, multiple locations, recurring bookings, waitlists, holidays, customer accounts, languages other than English.
- Stack in place: React SPA (Vite, React Router, TanStack Query, react-hook-form + zod, Tailwind v4, shadcn/ui, lucide icons). Each route is its own lazy chunk so a customer opening a booking link does not download the owner app.
- UI revamp (issue #66) is visual only: no API changes. Done when every screen is redone, it still works at phone width, and `npm run check && npm test` pass.

## Brand Commitments

- The name **Tempah** (Malay for "to book / reserve") is binding.
- The current look is shadcn defaults with a teal-on-off-white theme, vibe coded; the revamp may replace it freely.
- Standing preference (user, 2026-11-09): Tempah takes the category standard on purpose, played straight and SaaS-clean. Quality bar: Cal.com and Stripe. No purple or violet anywhere in the app, and nothing that reads as the generic AI-generated look.
- Businesses have no logo field; the public page currently represents a business by its initials.

## Evidence on Hand

- Product docs: [docs/prd.md](docs/prd.md), [docs/erd.md](docs/erd.md), [docs/api.md](docs/api.md), ADRs in [docs/adr/](docs/adr/).
- Seeded demo data only. There are no real businesses, customers, testimonials, usage numbers or press. Future work must not invent them.
- The mockup referenced in `web/src/index.css` is not in the repo and is not a reference for the revamp.

## Product Principles

1. **The booking can't go wrong.** Every screen should make the guarantee legible: only genuinely free times appear, and a lost race is explained calmly with alternatives, never a dead end.
2. **The customer's minute is sacred.** The public flow is phone-first, one-handed, and fast enough to finish in under 60 seconds with no account.
3. **The owner's day at a glance.** The dashboard answers "who is coming, with whom, and who is free" without hunting, on a phone or at the counter.
4. **Show the engineering honestly.** As a portfolio piece, polish and correctness are the pitch; demo content is clearly demo, never fake proof.

## Accessibility & Inclusion

- Public booking pages work at 360 px wide; touch targets are at least 44 px.
- Customers include non-technical users on mid-range phones; flows must stay understandable to them in plain English.
