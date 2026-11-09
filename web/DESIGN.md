---
name: Tempah
description: Appointment booking for small shops, the category standard played straight at Cal.com / Stripe craft.
colors:
  primary: "#1556e0"
  primary-hover: "#0f47bf"
  primary-foreground: "#ffffff"
  accent: "#eef4ff"
  accent-foreground: "#0d3a9e"
  accent-border: "#c9daff"
  background: "#fafafa"
  card: "#ffffff"
  foreground: "#0a0a0a"
  muted: "#f1f1f1"
  muted-foreground: "#5c5c5c"
  border: "#e8e8e8"
  input: "#d6d6d6"
  destructive: "#b42318"
  destructive-tint: "#fef3f2"
  destructive-border: "#f6cfca"
  success: "#0f7b55"
  success-tint: "#ecfaf3"
  hatch-light: "#f7f7f7"
typography:
  display:
    fontFamily: "Onest Variable, system-ui, sans-serif"
    fontSize: "24px"
    fontWeight: 600
    lineHeight: 1.33
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Onest Variable, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 600
    lineHeight: 1.375
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Onest Variable, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 600
    lineHeight: 1.5
  option:
    fontFamily: "Onest Variable, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 600
    lineHeight: 1.375
  section-label:
    fontFamily: "Onest Variable, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 600
    lineHeight: 1.43
  body:
    fontFamily: "Onest Variable, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.43
  meta:
    fontFamily: "Onest Variable, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.4
  caption:
    fontFamily: "Onest Variable, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 500
    lineHeight: 1.33
  ref-mono:
    fontFamily: "JetBrains Mono Variable, ui-monospace, monospace"
    fontSize: "15px"
    fontWeight: 500
    letterSpacing: "0.08em"
rounded:
  segment: "4px"
  block: "4.8px"
  control: "6px"
  panel: "8.4px"
  full: "9999px"
spacing:
  hairline-gap: "2px"
  day-gap: "6px"
  item-gap: "8px"
  row-gap: "10px"
  field-gap: "20px"
  gutter-phone: "18px"
  section-phone: "22px"
  pane: "24px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    typography: "{typography.option}"
    rounded: "{rounded.control}"
    height: "48px"
    width: "100%"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  button-primary-disabled:
    backgroundColor: "{colors.muted}"
    textColor: "{colors.muted-foreground}"
  button-secondary:
    backgroundColor: "{colors.card}"
    textColor: "{colors.foreground}"
    typography: "{typography.option}"
    rounded: "{rounded.control}"
    height: "48px"
  option-tile:
    backgroundColor: "{colors.card}"
    textColor: "{colors.foreground}"
    typography: "{typography.option}"
    rounded: "{rounded.control}"
    padding: "10px 14px"
    height: "56px"
  option-tile-selected:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.foreground}"
  time-slot:
    backgroundColor: "{colors.card}"
    textColor: "{colors.foreground}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    height: "44px"
  time-slot-selected:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
  time-slot-picked-list:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.accent-foreground}"
  segmented-control:
    backgroundColor: "{colors.muted}"
    rounded: "{rounded.control}"
    padding: "3px"
  segment:
    textColor: "{colors.foreground}"
    typography: "{typography.meta}"
    rounded: "{rounded.segment}"
    height: "44px"
    padding: "0 12px"
  segment-selected:
    backgroundColor: "{colors.card}"
    textColor: "{colors.foreground}"
  date-chip:
    backgroundColor: "{colors.card}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.control}"
    width: "52px"
    height: "62px"
  date-chip-selected:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
  calendar-day-bookable:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.accent-foreground}"
    rounded: "{rounded.control}"
  calendar-day-selected:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
  input-field:
    backgroundColor: "{colors.card}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.control}"
    height: "46px"
    padding: "0 14px"
  panel:
    backgroundColor: "{colors.card}"
    rounded: "{rounded.panel}"
  alert-taken:
    backgroundColor: "{colors.destructive-tint}"
    textColor: "{colors.destructive}"
    rounded: "{rounded.panel}"
    padding: "16px"
  monogram:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.accent-foreground}"
    rounded: "{rounded.control}"
    size: "40px"
  app-bar:
    backgroundColor: "{colors.card}"
    height: "56px"
  app-monogram:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.accent-foreground}"
    typography: "{typography.caption}"
    rounded: "{rounded.control}"
    size: "32px"
  app-tab:
    textColor: "{colors.muted-foreground}"
    typography: "{typography.body}"
    padding: "0 12px"
    height: "56px"
  app-tab-active:
    textColor: "{colors.foreground}"
  account-avatar:
    backgroundColor: "{colors.muted}"
    textColor: "{colors.foreground}"
    typography: "{typography.caption}"
    rounded: "{rounded.full}"
    size: "36px"
  button-toolbar:
    backgroundColor: "{colors.card}"
    textColor: "{colors.foreground}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    height: "36px"
    padding: "0 12px"
  button-primary-compact:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    typography: "{typography.section-label}"
    rounded: "{rounded.control}"
    height: "36px"
    padding: "0 14px"
  dropdown-menu:
    backgroundColor: "{colors.card}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.panel}"
    padding: "4px"
    width: "224px"
  dropdown-item:
    textColor: "{colors.foreground}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    height: "36px"
    padding: "0 10px"
  dropdown-item-highlighted:
    backgroundColor: "{colors.muted}"
  status-card:
    backgroundColor: "{colors.card}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.panel}"
    padding: "12px 16px"
  status-dot-busy:
    backgroundColor: "{colors.primary}"
    rounded: "{rounded.full}"
    size: "8px"
  status-dot-free:
    backgroundColor: "{colors.card}"
    rounded: "{rounded.full}"
    size: "8px"
  status-dot-idle:
    backgroundColor: "{colors.input}"
    rounded: "{rounded.full}"
    size: "8px"
  schedule-panel:
    backgroundColor: "{colors.card}"
    rounded: "{rounded.panel}"
    padding: "16px 20px"
  timeline-block-online:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.accent-foreground}"
    typography: "{typography.meta}"
    rounded: "{rounded.block}"
    padding: "0 10px"
  timeline-block-walk-in:
    backgroundColor: "{colors.muted}"
    textColor: "{colors.foreground}"
    typography: "{typography.meta}"
    rounded: "{rounded.block}"
    padding: "0 10px"
  timeline-block-past:
    backgroundColor: "{colors.card}"
    textColor: "{colors.muted-foreground}"
  timeline-off-hours:
    backgroundColor: "{colors.hatch-light}"
  timeline-now-line:
    backgroundColor: "{colors.destructive}"
    height: "2px"
  button-icon-ghost:
    textColor: "{colors.foreground}"
    rounded: "{rounded.control}"
    size: "36px"
  input-field-owner:
    backgroundColor: "{colors.card}"
    textColor: "{colors.foreground}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    height: "36px"
    padding: "0 10px"
  time-input:
    backgroundColor: "{colors.card}"
    textColor: "{colors.foreground}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    height: "36px"
    width: "96px"
  date-picker-panel:
    backgroundColor: "{colors.card}"
    rounded: "{rounded.panel}"
    padding: "12px"
    width: "288px"
  date-picker-day:
    textColor: "{colors.foreground}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    height: "36px"
  date-picker-day-selected:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
  settings-list:
    backgroundColor: "{colors.card}"
    rounded: "{rounded.panel}"
  settings-list-header:
    backgroundColor: "{colors.background}"
    textColor: "{colors.muted-foreground}"
    typography: "{typography.caption}"
    padding: "10px 16px"
  settings-row:
    backgroundColor: "{colors.card}"
    textColor: "{colors.foreground}"
    typography: "{typography.body}"
    padding: "12px 16px"
    height: "56px"
  save-bar:
    backgroundColor: "{colors.background}"
    textColor: "{colors.muted-foreground}"
    typography: "{typography.body}"
    padding: "12px 0"
---

# Design System: Tempah

## Overview

**Creative North Star: "The Category Standard, Played Straight"**

Tempah looks like the booking tool you already trust: neutral greys, white surfaces, hairline edges, and one confident blue that marks what you can press and what you've chosen. It refuses ornament on purpose. The quality is in the craft (exact radii, borders that never shift layout, thumb-sized targets, a calm loss screen) rather than in any brand flourish. The bar is Cal.com and Stripe.

The business leads; Tempah does not. A shop's page opens on the shop's name and initials, and Tempah appears only as a small "Bookings by Tempah" credit at the foot of the page. Density is moderate and phone-first: one column at the thumb on a phone, a bordered booker card from tablet up.

Confirmed rejections: purple or violet anywhere, the shadcn-default stacked-card look with a tinted brand, and the generic AI-generated aesthetic (gradients as decoration, glass, glow).

**Key Characteristics:**
- One blue for action, selection and focus; everything else neutral.
- Status colour is single-purpose: red means a slot was taken (or marks "now" on the owner timeline), green means booked.
- Borders are inset shadows, so a 2px selected edge never moves a pixel of content.
- Every public-page target is at least 44px tall.
- Owner screens tell time on the 24-hour clock; the customer's booking page keeps 12-hour.
- Motion is nearly absent: 150ms colour and edge fades, one slide-in, a quick fade-and-zoom on menus and dialogs.

## Colors

A neutral grey field with a single blue voice and two single-purpose status colours.

### Primary
- **Booking Blue** (primary): the one colour that means "act" or "chosen". Fills the main button, the selected date, the selected time on a phone, the 2px edge of a chosen option, the 2px underline of the active app tab, the text caret, and every focus ring. In the owner app it also fills the "busy" status dot, rings the "free" one, and ticks finished setup steps.
- **Pressed Blue** (primary-hover): the hover fill of primary buttons. Never used at rest.
- **Clear Sky Tint** (accent) with **Sky Edge** (accent-border) and **Deep Ink Blue** (accent-foreground): the quiet form of the blue. Fills chosen option tiles, bookable calendar days, the picked time in the desktop list, the shop monogram, and online bookings on the owner timeline (tint fill, Sky Edge inset, Deep Ink Blue text). Sky Edge is also the text-selection highlight and the resting underline of text links.

### Secondary
- **Taken Red** (destructive) on **Taken Tint** (destructive-tint) with **Taken Edge** (destructive-border): only the "slot was just booked" alert, form/server errors, and the owner timeline's 2px now line with its dot and time label.
- **Booked Green** (success) on **Booked Tint** (success-tint): only the confirmation check mark.

### Neutral
- **Paper Grey** (background): the page field behind the booker.
- **White** (card): panels, option tiles, time slots, inputs, the bottom bar.
- **Ink** (foreground): all primary text.
- **Mist** (muted): segmented-control track, disabled Continue, skeletons, ghost hovers.
- **Slate Text** (muted-foreground): secondary text, metadata, labels in summary rows, the credit.
- **Hairline** (border): 1px panel and tile edges, dividers.
- **Field Edge** (input): input borders, hover edge on tiles, dashed note and ticket perforation, the inset edge of walk-in and phone bookings, and the grey "not working now" status dot.
- **Hatch Light** (hatch-light): the pale stripe of the off-hours hatch, alternating 6px with Mist at 135deg. Used nowhere else.

### Named Rules
**The One Blue Rule.** Blue means "press this", "you chose this" or "you are here" (the active tab), nothing else, with one owner-side extension: in the owner app it also marks the shop's own online bookings (the quiet tint), a staff member working right now (the status dots) and a finished setup step. No blue decoration, no blue headings, no second accent hue.

**The Single-Purpose Status Rule.** Red appears only when something was lost or rejected (slot taken, error) and as the owner timeline's now line, the one place red marks time rather than loss. Green appears only when a booking succeeded; done setup steps tick in blue, not green. Neither is borrowed for emphasis.

**The No-Purple Rule.** No purple or violet in any token, illustration, chart or state. This is a standing brand commitment.

## Typography

**Body Font:** Onest Variable (with system-ui, sans-serif)
**Label/Mono Font:** JetBrains Mono Variable (with ui-monospace), for the booking ref only

**Character:** One friendly geometric sans carries every role through weight (400/500/600) and small size steps; the mono appears once, so the ref reads as a code you can read down a phone line.

### Hierarchy
- **Display** (600, 24px, -0.02em): the outcome headline, "You're booked in", and the owner app's page date heading ("Monday 9 November", with "Tomorrow"/"Yesterday" inline at 16px regular in Slate Text), and the settings page titles ("Services", "Staff", "Ali's hours"). One per screen at most.
- **Headline** (600, 17px, -0.01em): the shop name in the public header, and every dialog title app-wide.
- **Title** (600, 16px): pane titles such as the calendar month and "Your details".
- **Option** (600, 15px): service names, prices, big-button labels, the desktop day heading, the shop name in the owner top bar.
- **Section label** (600, 14px): the plain section headings "Service", "With", "Date", "Time".
- **Body** (400-500, 14px): summary rows, notes, alert copy, time-slot labels, app tabs (500), menu items, staff names on status cards and timeline column heads (600), settings page descriptions in Slate Text, row names in settings lists and day names in the hours editor (600).
- **Meta** (400, 13px): durations, "29 free", the bottom-bar summary, hints, segment labels, the owner totals sentence, status-card detail lines, booking names on the timeline (600), the staff week summary on phones (14px from 768px).
- **Caption** (500, 12px): the Tempah credit and weekday labels; calendar weekday column heads are uppercase with 0.04em tracking. In the owner app: timeline hour labels, the now-line time (600, red), booking service lines, monogram and avatar initials (600), settings list column headings (500, Slate Text), date picker weekday heads (uppercase, 0.04em).
- **Ref mono** (500, 15px, 0.08em): the booking ref, nowhere else.

### Named Rules
**The Proportional Figures Rule.** Times, prices and dates use Onest's default proportional figures. Do not turn on tabular figures: Onest's tabular "1" reads badly. (The direction contract asked for tabular figures; the build overruled it.)

**The Two Clocks Rule.** Every time the owner app shows or takes is on the 24-hour clock ("14:30", "13:00–19:00"): the timeline gutter, booking blocks, the now label, status cards, dialogs, the staff week summary and every time field. The customer's booking page keeps the 12-hour clock ("2:00 PM"). Typed dates read dd/mm/yyyy. Neither follows the computer's locale.

**The Plain Heading Rule.** Sections are headed by a plain sentence-case word at the section-label size. No kicker, eyebrow or overline above a heading.

## Layout

One component tree, three layouts:
- **Phone (< 768px):** a single column. The shop header spans the top on white with a bottom hairline; sections follow with an 18px side gutter and 22px between sections. A sticky white bottom bar (top hairline, safe-area padding) holds a one-line summary with price, the 48px primary button, and the Tempah credit.
- **Tablet (768px+):** one bordered booker card, max 1100px wide, at least 580px tall, 48px from the top. Left pane 300px (shop, services, facts) with a right hairline; right pane stacks date strip, staff and times. Panes pad 24px.
- **Desktop (1024px+):** a three-pane booker in the Cal.com mould: shop and services (320px), month calendar (fluid), staff and a vertical time list (300px). The time list scrolls inside its pane (max 440px), snaps rows and fades its top and bottom edges.

Short screens (details, taken, confirmed) narrow the card: details is a two-pane card max 880px (320px summary + form); taken and confirmed are an unbordered column max 440px whose alert or ticket is the only card.

Rhythm: 8px between list items, 6px between days, 10px between summary rows, 20px between form fields, 24px pane padding.

Owner app (signed-in pages): a 56px white top bar with a bottom hairline spans the page; its content and the schedule share a 1280px max width with 16px side padding on phones and 32px from 768px. Settings pages (services, staff, hours) are at most 880px wide and stay left-aligned inside the 1280px frame, so their left edge lines up with the shop name above; they never centre a narrow column. Content sits 20px below the bar on phones, 24px from 768px, with 20px between dashboard blocks. On a phone the tabs drop to their own full-bleed row (44px tall) under the shop name and scroll sideways; the Copy booking link button collapses to its icon. Status cards auto-fit at a 240px minimum with 12px gaps, so three staff share a row on a tablet and stack on a phone. The day timeline scrolls sideways rather than squeezing: a 3.5rem sticky hour gutter, staff columns at least 10rem wide, 10px column gap, 64px per hour.

Owner controls are denser than public ones: every owner button, icon button, input, time field, date field and menu item is 36px (the default control size of the shared Button and Input); the public booking page overrides to 46px inputs and 48px buttons, and the Thumb Rule below governs it.

Settings pages: the page header sits 20px above one bordered list. From 768px the list shows a column header and its rows share one grid with it; on a phone each row stacks its data in a column beside the actions. The staff Hours button drops its label below 640px. The hours editor puts each day's switch and name in a 10rem column beside its times from 640px and stacks them on a phone; its save bar sticks to the bottom of the screen.

**The Thumb Rule.** On public pages every tappable target is at least 44px tall; the main action is 48px and lives at the bottom of a phone screen.

## Elevation & Depth

Nearly flat. Depth comes from white surfaces on a paper-grey field and 1px hairlines. Shadows are soft, low and few, and outlines are inset shadows so state changes never reflow.

### Shadow Vocabulary
- **Panel lift** (`box-shadow: 0 1px 2px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.05)`): the booker card from tablet up and the confirmation ticket.
- **Button weight** (`box-shadow: 0 1px 2px rgba(13,58,158,0.25)`): under primary buttons only (the 48px public button, and the owner's 36px New booking, settings page actions and Save hours).
- **Segment lift** (`box-shadow: 0 1px 2px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04)`): the selected segment inside a segmented control.
- **Inset edge** (`box-shadow: inset 0 0 0 1px var(--border)`; hover `var(--input)`; selected `inset 0 0 0 2px var(--primary)`): the drawn border of tiles, slots, date chips.
- **Focus ring** (`box-shadow: 0 0 0 3px rgb(21 86 224 / 0.4)`): keyboard focus on every custom control.
- **Card rest** (`box-shadow: 0 1px 2px rgba(0,0,0,0.04)`): the owner schedule panel, settings lists and the hours editor card. Status cards carry the hairline alone.
- **Menu lift** (`box-shadow: 0 1px 2px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.08)`): dropdown menus and the date picker popover.
- **Block hover** (`box-shadow: 0 2px 8px rgba(0,0,0,0.08)`): a timeline booking under the pointer.

### Named Rules
**The Inset Edge Rule.** Selectable tiles draw their border as an inset box-shadow, never a CSS border, so the 2px selected edge does not shift text.

## Shapes

Gently squared corners, two steps: 6px on every control (buttons, tiles, slots, inputs, days, monogram, menu items, timeline columns) and about 8px on containers (booker card, ticket, alerts, status cards, schedule panel, dropdown menus, dialogs). Inner segments of the segmented control step down to 4px to nest inside the 3px-padded track; timeline booking blocks step down to 4.8px to sit inside their 6px column. Circles appear only for the success badge, the today dot, the account avatar and the status dots. The off-hours hatch (135deg stripes, 6px each) is the one patterned fill and means "not working". Dashed edges mean "not content": the empty-state note and the ticket's perforation under the booking ref.

## Components

### Buttons
Confident and plain.
- **Shape:** gently squared (6px).
- **Primary:** Booking Blue fill, white 15px semibold label, 48px tall and full width on public pages, with Button weight shadow. Hover moves to Pressed Blue. In the owner app it is 36px with a 14px semibold label and 14px side padding (New booking, "Add service", "Add staff", "Save hours").
- **Disabled Continue:** goes grey (Mist fill, Slate Text label, no shadow), never pale blue. "Save hours" with nothing to save does the same.
- **Secondary ("Book another"):** white fill with a 1px Field Edge inset edge, same 48px size.
- **Ghost / link:** ghost for "Change time" (44px, Mist on hover); link with a Sky Edge underline that turns blue on hover. Owner row actions (edit, remove) are 36px square ghost icon buttons with a 16px icon.
- **Focus:** 3px blue ring at 40-50%.

### Option tiles (service, nearest times)
- **Style:** white, 56px min height, 6px corners, 1px Hairline inset edge, name and price at 15px semibold, duration at 13px with a 14px clock icon.
- **State:** hover deepens the edge to Field Edge; selected fills Clear Sky Tint with a 2px Booking Blue inset edge. Colour and edge fade over 150ms.

### Segmented control (staff)
- **Style:** Mist track, 3px padding, 6px corners; 44px segments, 13px medium label at 75% ink.
- **State:** selected segment turns white with Segment lift and semibold label. Segments grow from their own width and wrap when crowded.

### Time slots
- **Phone:** a 3-column grid of 44px white slots with Hairline inset edges; hover edge goes blue; selected fills Booking Blue. Continue lives in the bottom bar.
- **Desktop list:** full-width 44px rows with Field Edge inset edges. The picked time splits into two halves: the time in Clear Sky Tint and a blue Continue that slides in from the left (200ms ease-out, off under reduced motion).

### Dates
- **Date strip (phone, tablet):** 52 x 62px chips, weekday at 12px over the day at 18px semibold, scrolling sideways and bleeding to the screen edge so the next day peeks in. Selected chip is solid Booking Blue.
- **Month calendar (desktop):** Monday-first 7-column grid of square 6px-corner days. Days inside the 30-day window are Clear Sky Tint with Deep Ink Blue numbers; the selected day is solid blue; today carries a small dot; days outside the window are shown but disabled. Month arrows are 32px outlined squares.

### Inputs / Fields
- **Style:** white, 46px tall, 6px corners, 1px Field Edge border, 16px text on phones (prevents iOS zoom), 15px from tablet up. Labels above, a 13px hint below.
- **Focus:** border turns blue with a 3px blue ring at 50%; the caret is blue.
- **Error:** red border and ring at 20%, message replaces the hint.
- **Owner fields:** the same look at 36px with 10px side padding (16px text on phones, 14px from 768px).
- **Time field:** a typed 24-hour "HH:MM" box, never the browser's time input, with "09:00" as placeholder; on blur it tidies what was typed ("930" becomes "09:30", "9" becomes "09:00"). 96px wide in the hours editor; also in the New booking and booking dialogs.
- **Date field:** a 36px button that reads dd/mm/yyyy (placeholder "dd/mm/yyyy") with a 16px Slate Text calendar icon at the right; it opens a 288px popover (white, ~8px corners, Hairline border, Menu lift, 12px padding) holding a Monday-first month: month name at 14px semibold, two 32px outlined arrow squares, uppercase 12px weekday heads, 36px days with 6px corners that go Mist on hover; the picked day is solid Booking Blue and semibold, today carries a small dot. Used in the New booking and booking dialogs.

### Cards / Containers
- **Booker panel:** white, ~8px corners, 1px Hairline border, Panel lift, panes split by hairlines. On a phone the panel dissolves into the page.
- **Summary rows:** label left in Slate Text, value right in medium ink; the last row (price) sits under a hairline like a receipt total.
- **Note:** dashed Field Edge box, 16px padding, Slate Text, for empty and failed states, with an outline button when there's a next step.

### Slot-taken alert
Calm, not alarming: Taken Tint fill, Taken Edge border, ~8px corners, a 20px alert icon and a 15px semibold red headline over ink body copy; followed by the three nearest free times as option tiles and the 48px "Book [time]" button.

### Confirmation ticket
A centred 56px Booked Tint circle with a green check, the display headline, then a white ticket card (Panel lift) whose header row holds the booking ref in JetBrains Mono above a dashed perforation, followed by summary rows. "Add to calendar" is the primary button.

### Shop header
A 40px monogram (initials in Deep Ink Blue on Clear Sky Tint with a Sky Edge inset ring) beside the shop name at headline size and "Book an appointment" in meta.

### App frame
The owner app's chrome: quiet, white, one blue mark for where you are.
- **Top bar:** 56px, white, bottom Hairline. Left: a 32px monogram (initials at 12px semibold in Deep Ink Blue on Clear Sky Tint, Sky Edge inset ring, 6px corners) beside the shop name at 15px semibold, truncating.
- **Tabs:** Schedule / Services / Staff, 14px medium, 12px side padding, full bar height. Resting tabs are Slate Text and darken to Ink on hover; the active tab is Ink with a 2px Booking Blue underline flush with the bar's bottom edge. On a phone the tabs take their own 44px row under the shop name.
- **Right side:** a 36px outline "Copy booking link" button (link icon, swaps to a check and "Copied" for 2s; icon-only on phones), then the account avatar: a 36px Mist circle with two uppercase initials at 12px semibold that opens the account dropdown.

### Day header
- **Date:** display size (24px semibold, -0.02em); "Tomorrow" or "Yesterday" sits inline at 16px regular in Slate Text. Today needs no label because the Today button beside it is disabled.
- **Day controls:** previous / Today / next as 36px outline buttons, 6px apart.
- **Totals sentence:** one 13px Slate Text line ("9 bookings · 5h booked · 5 online · 1 cancelled") with each number in Ink semibold; parts never break inside and are joined by " · ". It wraps under the date on narrower screens. No metric tiles.
- **New booking:** a 36px primary button with a plus icon and Button weight, pushed to the far right.

### Status cards
One card per working staff member, today only, answering "busy or free, and until when".
- **Card:** white, ~8px corners, 1px Hairline border, 12px by 16px padding, no shadow.
- **Row 1:** an 8px status dot, the staff name at 14px semibold, and an aside at 13px medium pushed right ("until 11:15", "16m free").
- **Row 2:** 13px Slate Text detail indented to the name, parts joined by " · " and each kept on one line ("With Lim Wei Ming · Cut + wash").
- **Dot:** filled Booking Blue = busy; a hollow 2px Booking Blue ring on white = free; Field Edge grey = starts later, on a break, done or off.

### Day timeline
The day as a grid: one column per staff member, bookings placed by time.
- **Frame:** sits in the schedule panel (white, ~8px corners, Hairline border, Card rest). Column heads at 14px semibold with a Slate Text note (" · from 13:00", " · off", " (removed)").
- **Grid:** 64px per hour; hour labels ("09:00", "10:00") at 12px Slate Text in a sticky 3.5rem gutter; a 1px Hairline at every hour. Empty space is tappable to start a booking at that quarter hour.
- **Off-hours:** a light diagonal hatch (135deg, Mist and Hatch Light alternating every 6px) over hours a staff member isn't working.
- **Bookings:** 4.8px-corner blocks inset 4px from the column sides, 10px side padding. Online bookings are Clear Sky Tint with a Sky Edge inset edge and Deep Ink Blue text; walk-in and phone bookings are Mist with a Field Edge inset edge and Ink text. Bookings already over today go quiet: white, Hairline inset edge, Slate Text. Name at 13px semibold, then service and time at 12px ("Cut + wash · 11:00 – 11:45"); under 40px tall the service moves beside the name. No coloured side stripe. Hover adds Block hover; focus shows the blue ring.
- **Now line:** today only, a 2px Taken Red line across the columns with an 8px red dot at its left end and the time ("10:44", 12px semibold red on white) over the hour gutter. It is drawn under the booking blocks so an appointment in progress never looks struck through.

### Dropdown menu
- **Panel:** white, ~8px corners, 1px Hairline border, Menu lift, 4px padding, at least 224px wide, aligned to the trigger's end 6px below it; fades and zooms in from 95%.
- **Content:** an optional 13px Slate Text label (the account email), a Hairline separator, then 36px items at 14px with a 16px Slate Text icon, 6px corners, Mist when highlighted, half opacity when disabled.

### Dialogs
Titles are headline size (17px semibold, -0.01em) everywhere in the app.

### Page header
The title row of every settings page.
- **Text:** the title at display size (24px semibold, -0.02em) over one 14px Slate Text line saying what the page is for, 4px apart.
- **Action:** one 36px blue primary with a plus icon and Button weight ("Add service", "Add staff"), pinned right and bottom-aligned with the text. Only the text wraps; the action never drops below it. When the list is empty the action moves into the empty state instead.

### Settings list
One list per settings page, never a card per row.
- **Frame:** one white card, ~8px corners, 1px Hairline border, Card rest.
- **Column header (768px+):** on Paper Grey with a bottom hairline, 12px medium Slate Text names, 10px by 16px padding, sharing the rows' grid so columns line up.
- **Rows:** split by hairlines, 12px by 16px padding, at least 56px tall from 768px. The name is 14px semibold and truncates; details are 14px in their columns. On a phone the details fold into one 13px Slate Text line under the name ("45 min · RM 35.00"), with the actions kept to the right.
- **Loading:** three placeholder rows of rounded Mist bars that pulse, and hold still under reduced motion.
- **Empty:** a white bordered card with an icon, a title, one sentence and the page's blue action.

### Staff week summary
A staff member's week, readable at a glance in the list.
- **Lines:** one line per run of neighbouring days with the same hours, Monday first ("Mon–Fri", "Sat"); ranges that touch are joined, so 09:00–16:00 plus 16:00–18:00 reads 09:00–18:00; days off are left out; "Every day" when all seven match; "No hours set" in Slate Text when empty.
- **Type:** days in Slate Text in their own 4.5rem column, ranges in Ink, 13px on phones and 14px from 768px. Each range stays whole on one line; a long day wraps between ranges.
- **Action:** a 36px outline "Hours" button with a clock icon beside the edit and remove icons; below 640px it shows the icon alone.

### Hours editor
One staff member's week as seven rows in a white card (~8px corners, Hairline border, Card rest), split by hairlines.
- **Day row:** a switch (blue when the day is open) and the day name at 14px semibold in a 10rem column; a closed day shows "Closed" in Slate Text.
- **Ranges:** two 96px time fields joined by a Slate Text en dash, then a 36px ghost icon button to remove the range; field errors sit under the pair. A ghost "Add hours" button with a plus icon sits under the last range, its icon lined up with the fields' left edge.
- **Save bar:** sticks to the bottom of the screen on a solid Paper Grey ground with a top hairline and safe-area bottom padding. Left, a 14px Slate Text note ("Unsaved changes", then "Saved"); right, a ghost Discard (only while there are changes) and the 36px "Save hours" primary, grey while there is nothing to save.

## Do's and Don'ts

### Do:
- **Do** use Booking Blue (#1556e0) for the primary action, the chosen state (including the active tab underline) and focus; in the owner app also for online bookings (as the tint), the working-now status dots and finished setup steps.
- **Do** mark chosen options with Clear Sky Tint (#eef4ff) plus a 2px blue inset edge, and bookable days with the tint alone.
- **Do** draw selectable borders as inset box-shadows so selection never shifts layout.
- **Do** keep every public-page target at least 44px tall and the main action 48px at the bottom of the phone screen.
- **Do** limit motion to 150ms background/edge colour transitions, the one Continue slide-in, and the quick fade-and-zoom of menus and dialogs, and turn the slide-in off under reduced motion.
- **Do** let the business lead: shop name and monogram at the top, "Bookings by Tempah" as a small credit at the foot.
- **Do** keep the ref in JetBrains Mono and everything else in Onest with default proportional figures.
- **Do** show and take every owner-app time on the 24-hour clock ("14:30") and every typed date as dd/mm/yyyy; keep "2:00 PM" for the customer's booking page.
- **Do** keep owner controls at 36px and settings pages left-aligned on the frame, at most 880px wide.

### Don't:
- **Don't** use purple or violet anywhere.
- **Don't** use red for anything but a lost slot, an error or the owner timeline's now line, or green for anything but a completed booking.
- **Don't** add kicker, eyebrow or overline labels above headings.
- **Don't** use gradients, glass, glow or tinted-brand card stacks as decoration. Gradients are allowed only where they do a job: the edge fade mask on the scrolling time list, the off-hours hatch on the timeline, and the timeline's hourly 1px hairlines.
- **Don't** enable tabular figures in Onest.
- **Don't** show a disabled primary button in pale blue; it goes grey.
- **Don't** promote Tempah's own name into the page header or hero.
- **Don't** use the browser's own time or date inputs, or format times and dates by the computer's locale.
- **Don't** give each settings row its own card, or centre a settings page off the frame's left edge.
