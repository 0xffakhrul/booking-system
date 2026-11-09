---
version: 1
slug: "src-features-services-servicespage-tsx"
primary_target: "src/features/services/ServicesPage.tsx"
related_targets: ["src/features/staff/StaffPage.tsx","src/features/staff/WorkingHoursPage.tsx"]
---

# Settings pages: services, staff, working hours (`/app/services`, `/app/staff`, `/app/staff/:id/hours`)

Mode: Operate. The owner sets up and occasionally edits what customers can book: services (name, length, price), staff, and each person's weekly hours. Infrequent, careful edits, mostly on a laptop, sometimes a phone.

Scope: an extension inside the established world (web/DESIGN.md), not a new direction. No API changes. Service and staff form dialogs keep their behaviour.

User decisions (2026-11-09): "Aligned list" layout: content left-aligned with the app frame, max 880px; each page a title row with one blue action, then one bordered list with column headings from md up (Services: name · length · price; Staff: name · week summary · Hours button). Times are fixed 24-hour everywhere they are typed (hours editor, New booking and Move dialogs), regardless of the computer's locale; dates are dd/mm/yyyy (earlier request).

What would make it wrong: centred narrow column off the frame's grid; browser-locale time or date formats; cards for each row; a second accent colour.
