---
version: 1
slug: "src-features-booking-bookingpage-tsx"
primary_target: "src/features/booking/BookingPage.tsx"
related_targets: []
---

# Booking page (`/book/:slug`)

Mode: Operate. Customer books a service in under 60 seconds on a phone, no account; reviewers open it on a laptop.

Scope: choose (service, staff, date, time), details, slot taken, confirmed, plus loading / wrong link / error / no services / no times. Adds the staff picker (PRD C5) on the existing `staffId` API. No API changes. URL keeps service, staff, date, time and step.

Approved reference: `web/.impeccable/mocks/booking-mock.html` (code-led; the chosen decision sketch was `web/.impeccable/mocks/decision/canon.html`, recoloured and retyped per the user).

## Direction contract

THESIS: The category standard played straight, at Cal.com / Stripe craft. Refuses the shadcn-default card stack with a tinted brand and the AI-default purple; the shop leads, Tempah is a footer credit.

OWN-WORLD: Neutral greys on #fafafa with white surfaces and 1px #e8e8e8 hairlines; near-black text; one blue #1556e0 for primary actions, selection and focus, light blue tint #eef4ff for chosen options and bookable calendar days; red only for "slot taken", green only for "booked". Onest throughout with tabular figures; JetBrains Mono only for the booking ref. Corners 6px controls, 8px panels. No purple, gradients, glass or glow.

STORY: Customer sees the shop's name, picks service, who, day and a free time, enters name and phone, books, and keeps the ref. If beaten to the slot, they are told calmly and offered the three nearest times without retyping.

FIRST VIEWPORT: Phone: shop header (monogram + name), Service options, With segmented control, horizontal date strip, 3-column time grid, sticky bottom bar with summary, price and blue Continue at thumb. Desktop ≥1024: one bordered booker, left pane shop + service list + facts, centre month calendar (30-day window, rest disabled), right pane staff segmented control + vertical time list where the picked time splits into time + Continue.

FORM: Canon (the category standard, user-chosen standing exit), steered "more SaaS, no purple"; position: outside the ordered list. seed:d0aa8540b1cdf9f8

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
