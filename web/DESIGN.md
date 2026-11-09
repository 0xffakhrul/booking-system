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
---

# Design System: Tempah

## Overview

**Creative North Star: "The Category Standard, Played Straight"**

Tempah looks like the booking tool you already trust: neutral greys, white surfaces, hairline edges, and one confident blue that marks what you can press and what you've chosen. It refuses ornament on purpose. The quality is in the craft (exact radii, borders that never shift layout, thumb-sized targets, a calm loss screen) rather than in any brand flourish. The bar is Cal.com and Stripe.

The business leads; Tempah does not. A shop's page opens on the shop's name and initials, and Tempah appears only as a small "Bookings by Tempah" credit at the foot of the page. Density is moderate and phone-first: one column at the thumb on a phone, a bordered booker card from tablet up.

Confirmed rejections: purple or violet anywhere, the shadcn-default stacked-card look with a tinted brand, and the generic AI-generated aesthetic (gradients as decoration, glass, glow).

**Key Characteristics:**
- One blue for action, selection and focus; everything else neutral.
- Status colour is single-purpose: red means a slot was taken, green means booked.
- Borders are inset shadows, so a 2px selected edge never moves a pixel of content.
- Every public-page target is at least 44px tall.
- Motion is nearly absent: 150ms colour and edge fades, one slide-in.

## Colors

A neutral grey field with a single blue voice and two single-purpose status colours.

### Primary
- **Booking Blue** (primary): the one colour that means "act" or "chosen". Fills the main button, the selected date, the selected time on a phone, the 2px edge of a chosen option, the text caret, and every focus ring.
- **Pressed Blue** (primary-hover): the hover fill of primary buttons. Never used at rest.
- **Clear Sky Tint** (accent) with **Sky Edge** (accent-border) and **Deep Ink Blue** (accent-foreground): the quiet form of the blue. Fills chosen option tiles, bookable calendar days, the picked time in the desktop list and the shop monogram. Sky Edge is also the text-selection highlight and the resting underline of text links.

### Secondary
- **Taken Red** (destructive) on **Taken Tint** (destructive-tint) with **Taken Edge** (destructive-border): only the "slot was just booked" alert and form/server errors.
- **Booked Green** (success) on **Booked Tint** (success-tint): only the confirmation check mark.

### Neutral
- **Paper Grey** (background): the page field behind the booker.
- **White** (card): panels, option tiles, time slots, inputs, the bottom bar.
- **Ink** (foreground): all primary text.
- **Mist** (muted): segmented-control track, disabled Continue, skeletons, ghost hovers.
- **Slate Text** (muted-foreground): secondary text, metadata, labels in summary rows, the credit.
- **Hairline** (border): 1px panel and tile edges, dividers.
- **Field Edge** (input): input borders, hover edge on tiles, dashed note and ticket perforation.

### Named Rules
**The One Blue Rule.** Blue means "press this" or "you chose this", nothing else. No blue decoration, no blue headings, no second accent hue.

**The Single-Purpose Status Rule.** Red appears only when something was lost or rejected (slot taken, error). Green appears only when a booking succeeded. Neither is borrowed for emphasis.

**The No-Purple Rule.** No purple or violet in any token, illustration, chart or state. This is a standing brand commitment.

## Typography

**Body Font:** Onest Variable (with system-ui, sans-serif)
**Label/Mono Font:** JetBrains Mono Variable (with ui-monospace), for the booking ref only

**Character:** One friendly geometric sans carries every role through weight (400/500/600) and small size steps; the mono appears once, so the ref reads as a code you can read down a phone line.

### Hierarchy
- **Display** (600, 24px, -0.02em): the outcome headline, "You're booked in". One per screen at most.
- **Headline** (600, 17px, -0.01em): the shop name in the header.
- **Title** (600, 16px): pane titles such as the calendar month and "Your details".
- **Option** (600, 15px): service names, prices, big-button labels, the desktop day heading.
- **Section label** (600, 14px): the plain section headings "Service", "With", "Date", "Time".
- **Body** (400-500, 14px): summary rows, notes, alert copy, time-slot labels.
- **Meta** (400, 13px): durations, "29 free", the bottom-bar summary, hints, segment labels.
- **Caption** (500, 12px): the Tempah credit and weekday labels; calendar weekday column heads are uppercase with 0.04em tracking.
- **Ref mono** (500, 15px, 0.08em): the booking ref, nowhere else.

### Named Rules
**The Proportional Figures Rule.** Times, prices and dates use Onest's default proportional figures. Do not turn on tabular figures: Onest's tabular "1" reads badly. (The direction contract asked for tabular figures; the build overruled it.)

**The Plain Heading Rule.** Sections are headed by a plain sentence-case word at the section-label size. No kicker, eyebrow or overline above a heading.

## Layout

One component tree, three layouts:
- **Phone (< 768px):** a single column. The shop header spans the top on white with a bottom hairline; sections follow with an 18px side gutter and 22px between sections. A sticky white bottom bar (top hairline, safe-area padding) holds a one-line summary with price, the 48px primary button, and the Tempah credit.
- **Tablet (768px+):** one bordered booker card, max 1100px wide, at least 580px tall, 48px from the top. Left pane 300px (shop, services, facts) with a right hairline; right pane stacks date strip, staff and times. Panes pad 24px.
- **Desktop (1024px+):** a three-pane booker in the Cal.com mould: shop and services (320px), month calendar (fluid), staff and a vertical time list (300px). The time list scrolls inside its pane (max 440px), snaps rows and fades its top and bottom edges.

Short screens (details, taken, confirmed) narrow the card: details is a two-pane card max 880px (320px summary + form); taken and confirmed are an unbordered column max 440px whose alert or ticket is the only card.

Rhythm: 8px between list items, 6px between days, 10px between summary rows, 20px between form fields, 24px pane padding.

**The Thumb Rule.** On public pages every tappable target is at least 44px tall; the main action is 48px and lives at the bottom of a phone screen.

## Elevation & Depth

Nearly flat. Depth comes from white surfaces on a paper-grey field and 1px hairlines. Shadows are soft, low and few, and outlines are inset shadows so state changes never reflow.

### Shadow Vocabulary
- **Panel lift** (`box-shadow: 0 1px 2px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.05)`): the booker card from tablet up and the confirmation ticket.
- **Button weight** (`box-shadow: 0 1px 2px rgba(13,58,158,0.25)`): under the 48px primary button only.
- **Segment lift** (`box-shadow: 0 1px 2px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04)`): the selected segment inside a segmented control.
- **Inset edge** (`box-shadow: inset 0 0 0 1px var(--border)`; hover `var(--input)`; selected `inset 0 0 0 2px var(--primary)`): the drawn border of tiles, slots, date chips.
- **Focus ring** (`box-shadow: 0 0 0 3px rgb(21 86 224 / 0.4)`): keyboard focus on every custom control.

### Named Rules
**The Inset Edge Rule.** Selectable tiles draw their border as an inset box-shadow, never a CSS border, so the 2px selected edge does not shift text.

## Shapes

Gently squared corners, two steps: 6px on every control (buttons, tiles, slots, inputs, days, monogram) and about 8px on containers (booker card, ticket, alerts). Inner segments of the segmented control step down to 4px to nest inside the 3px-padded track. Circles appear only for the success badge and the today dot. Dashed edges mean "not content": the empty-state note and the ticket's perforation under the booking ref.

## Components

### Buttons
Confident and plain.
- **Shape:** gently squared (6px).
- **Primary:** Booking Blue fill, white 15px semibold label, 48px tall and full width on public pages, with Button weight shadow. Hover moves to Pressed Blue.
- **Disabled Continue:** goes grey (Mist fill, Slate Text label, no shadow), never pale blue.
- **Secondary ("Book another"):** white fill with a 1px Field Edge inset edge, same 48px size.
- **Ghost / link:** ghost for "Change time" (44px, Mist on hover); link with a Sky Edge underline that turns blue on hover.
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

## Do's and Don'ts

### Do:
- **Do** use Booking Blue (#1556e0) for exactly three jobs: the primary action, the chosen state, and focus.
- **Do** mark chosen options with Clear Sky Tint (#eef4ff) plus a 2px blue inset edge, and bookable days with the tint alone.
- **Do** draw selectable borders as inset box-shadows so selection never shifts layout.
- **Do** keep every public-page target at least 44px tall and the main action 48px at the bottom of the phone screen.
- **Do** limit motion to 150ms background/edge colour transitions and the one Continue slide-in, and turn the slide-in off under reduced motion.
- **Do** let the business lead: shop name and monogram at the top, "Bookings by Tempah" as a small credit at the foot.
- **Do** keep the ref in JetBrains Mono and everything else in Onest with default proportional figures.

### Don't:
- **Don't** use purple or violet anywhere.
- **Don't** use red for anything but a lost slot or an error, or green for anything but a completed booking.
- **Don't** add kicker, eyebrow or overline labels above headings.
- **Don't** use gradients, glass, glow or tinted-brand card stacks as decoration (the functional edge fade on the scrolling time list is the only gradient, and it is a mask, not a colour).
- **Don't** enable tabular figures in Onest.
- **Don't** show a disabled primary button in pale blue; it goes grey.
- **Don't** promote Tempah's own name into the page header or hero.
