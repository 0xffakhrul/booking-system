---
version: 1
slug: "src-features-dashboard-dashboardpage-tsx"
primary_target: "src/features/dashboard/DashboardPage.tsx"
related_targets: ["src/components/AppLayout.tsx"]
---

# Owner dashboard and app frame (`/app`)

Mode: Operate. The owner, on a phone between clients or a laptop at the counter, checks who is coming, who is busy or free right now, and adds, moves or cancels bookings. Several glances a day.

Scope: the app frame (AppLayout: top bar, tabs, booking link, account menu) and the dashboard (day header, day totals, per-staff status strip for today, day timeline, setup checklist, booking and new-booking dialogs keep their behaviour). No API changes. Services, staff and hours pages are out of scope but must still sit correctly inside the new frame.

Approved structure: decision sketch `web/.impeccable/mocks/decision/now-next.html` (code-led, user locked it). System: `web/DESIGN.md`.

## Direction contract

THESIS: The day as a working instrument: who is busy, who is free and until when, answered before the owner reads the grid. Refuses the hero-metric tile row and the bare grid-only calendar.

OWN-WORLD: DESIGN.md unchanged: neutral greys, white surfaces, #e8e8e8 hairlines, one blue #1556e0 for primary action, selection, the active tab underline and online bookings (tint #eef4ff, edge #c9daff, ink #0d3a9e); walk-in/phone bookings in neutral grey; red only for the now line and errors; green only for "booked". Onest, 6px controls, 8px panels. Off-hours drawn as a light diagonal hatch.

STORY: Owner opens the app, sees today's date, the day's totals in one line, then one card per staff member saying what they are doing now and what is next, then the timeline with the red now line; taps a booking to move or cancel it, taps an empty slot or New booking to add one.

FIRST VIEWPORT: 56px white top bar: monogram + shop name, Schedule / Services / Staff tabs with a blue underline on the active one, Copy booking link and an account menu at the right. Below on #fafafa: "Today" over "Monday 9 November", prev / Today / next, a one-line totals sentence, New booking (blue) at the far right. A three-up strip of staff status cards. The timeline card: hour gutter, one column per staff, now line labelled with the time. Phone: tabs drop to their own row, totals wrap under the date, status cards stack, the timeline scrolls sideways.

FORM: Structure "Now & next" (surface round, dealt lead; my list position 7). seed:d3afc6c9112b65de

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
