// The day timeline's layout, kept out of React so it can be tested without a browser.
// Everything is in "minutes since local midnight" in the business's timezone;
// the component only multiplies by pixels per minute.

import type { Range } from "@/features/staff/useWorkingHours";
import { minutesIntoDay, minutesToTime } from "@/lib/time";
import type { Booking } from "./useBookings";

/** [start, end) in minutes since local midnight: 9:00–9:45 AM is { start: 540, end: 585 } */
export type Span = { start: number; end: number };

export type Column = {
  staff: { id: string; name: string };
  /** removed from the staff list, but has bookings that day */
  removed: boolean;
  /** not working: before, between (breaks) and after their hours. Empty if hours are unknown. */
  off: Span[];
  bookings: (Span & { booking: Booking })[];
};

export type Timeline = Span & {
  /** the hour lines to label: 600, 660, … */
  hours: number[];
  columns: Column[];
};

/** shown when nobody works that day and nothing is booked */
const DEFAULT_DAY: Span = { start: 9 * 60, end: 18 * 60 };
const MIDNIGHT = 24 * 60;

/** "09:30" → 570 */
const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h! * 60 + m!;
};

export function buildTimeline(input: {
  weekday: number; // 0 = Sunday, like the API's working hours
  timezone: string;
  staff: { id: string; name: string }[];
  /** staff id → their weekly hours, or undefined while still loading */
  hours: Record<string, Range[] | undefined>;
  bookings: Booking[];
}): Timeline {
  const { weekday, timezone } = input;

  // A cancelled booking frees its slot (the constraint ignores it), so another booking
  // may sit in the same place. Only live bookings go on the grid.
  const placed = input.bookings
    .filter((b) => b.status !== "cancelled")
    .map((booking) => {
      const start = minutesIntoDay(booking.start, timezone);
      const length =
        (Date.parse(booking.end) - Date.parse(booking.start)) / 60_000;
      // a booking late at night can run past midnight; the grid stops at the end of the day
      return { booking, start, end: Math.min(start + length, MIDNIGHT) };
    });

  // Staff with bookings that day get a column even if they were removed since,
  // so no booking is ever hidden. They go after the current staff.
  const current = new Set(input.staff.map((s) => s.id));
  const staff = [...input.staff];
  for (const { booking } of placed) {
    if (!staff.some((s) => s.id === booking.staff.id))
      staff.push(booking.staff);
  }

  const workingBy = new Map(
    staff.map((s) => [
      s.id,
      input.hours[s.id]
        ?.filter((r) => r.weekday === weekday)
        .map((r) => ({ start: toMinutes(r.start), end: toMinutes(r.end) }))
        .sort((a, b) => a.start - b.start),
    ]),
  );

  // The visible window covers everyone's hours and every booking, rounded out to whole hours
  const spans = [...[...workingBy.values()].flatMap((w) => w ?? []), ...placed];
  const window =
    spans.length === 0
      ? DEFAULT_DAY
      : {
          start: Math.floor(Math.min(...spans.map((s) => s.start)) / 60) * 60,
          end: Math.min(
            Math.ceil(Math.max(...spans.map((s) => s.end)) / 60) * 60,
            MIDNIGHT,
          ),
        };

  const hours: number[] = [];
  for (let m = window.start; m <= window.end; m += 60) hours.push(m);

  return {
    ...window,
    hours,
    columns: staff.map((s) => ({
      staff: { id: s.id, name: s.name },
      removed: !current.has(s.id),
      off: offTime(window, workingBy.get(s.id)),
      bookings: placed.filter((p) => p.booking.staff.id === s.id),
    })),
  };
}

/** The gaps in the working spans within the window. Unknown hours → no shading at all. */
function offTime(window: Span, working: Span[] | undefined): Span[] {
  if (!working) return [];
  const off: Span[] = [];
  let cursor = window.start;
  for (const w of working) {
    if (w.start > cursor) off.push({ start: cursor, end: w.start });
    cursor = Math.max(cursor, w.end);
  }
  if (cursor < window.end) off.push({ start: cursor, end: window.end });
  return off;
}

/** The numbers above the timeline. Cancelled bookings only count as cancelled. */
export function summarizeDay(bookings: Booking[]) {
  const live = bookings.filter((b) => b.status !== "cancelled");
  return {
    count: live.length,
    bookedMinutes: live.reduce(
      (sum, b) => sum + (Date.parse(b.end) - Date.parse(b.start)) / 60_000,
      0,
    ),
    online: live.filter((b) => b.source === "online").length,
    cancelled: bookings.length - live.length,
  };
}

/** 255 → "4h 15m", 45 → "45m", 120 → "2h", 0 → "0m" */
export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (!h) return `${m}m`;
  return m ? `${h}h ${m}m` : `${h}h`;
}

/** What one staff member is doing at `now` (minutes into today), for the status strip */
export type StaffStatus =
  | { kind: "busy"; booking: Booking; until: number }
  | { kind: "free"; until: number; next: (Span & { booking: Booking }) | null }
  | { kind: "starts"; at: number } // before their first hours today
  | { kind: "break"; until: number } // between two of today's ranges
  | { kind: "done" } // their last range today has ended
  | { kind: "off" }; // no hours today

export function staffStatus(
  timeline: Timeline,
  column: Column,
  now: number,
): StaffStatus {
  const live = [...column.bookings].sort((a, b) => a.start - b.start);
  const current = live.find((b) => b.start <= now && now < b.end);
  // a booking outside working hours (a manual one, say) still makes them busy
  if (current)
    return { kind: "busy", booking: current.booking, until: current.end };

  const working = workingTime(timeline, column.off);
  if (working.length === 0) return { kind: "off" };
  const range = working.find((w) => w.start <= now && now < w.end);
  if (!range) {
    const later = working.find((w) => w.start > now);
    if (!later) return { kind: "done" };
    return now < working[0]!.start
      ? { kind: "starts", at: later.start }
      : { kind: "break", until: later.start };
  }
  const next = live.find((b) => b.start >= now) ?? null;
  return {
    kind: "free",
    until: Math.min(next?.start ?? range.end, range.end),
    next,
  };
}

/** The window minus the off spans: when this person works on the timeline's day */
function workingTime(window: Span, off: Span[]): Span[] {
  const working: Span[] = [];
  let cursor = window.start;
  for (const o of off) {
    if (o.start > cursor) working.push({ start: cursor, end: o.start });
    cursor = Math.max(cursor, o.end);
  }
  if (cursor < window.end) working.push({ start: cursor, end: window.end });
  return working;
}

/** 870 → "14:30": the owner's screens use the 24-hour clock */
export function clockLabel(minutes: number): string {
  return minutesToTime(minutes % (24 * 60));
}
