// The API sends instants in UTC and takes dates as "YYYY-MM-DD" in the business's timezone
// (docs/api.md: Times). These helpers convert at that edge, always with the business's
// timezone passed in, so the visitor's own clock never leaks in: a customer opening a KL
// shop's page from London still sees KL times.

/** Today's date in a timezone, "YYYY-MM-DD" (en-CA formats dates that way) */
export function todayIn(timeZone: string, now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone }).format(now);
}

/** "2026-11-30" + 1 → "2026-12-01" */
export function addDays(date: string, days: number): string {
  return new Date(Date.parse(`${date}T00:00:00Z`) + days * 86_400_000)
    .toISOString()
    .slice(0, 10);
}

/** true for real dates only: "2026-02-28" yes, "2026-02-30" no */
export function isCalendarDate(text: string): boolean {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(text) &&
    !Number.isNaN(Date.parse(`${text}T00:00:00Z`)) &&
    addDays(text, 0) === text
  );
}

/** Same as the API's bookingRules.windowDays: today plus this many days can be booked */
export const BOOKING_WINDOW_DAYS = 30;

/** The dates a customer can pick, from today in the business's timezone */
export function bookableDates(timeZone: string, now = new Date()): string[] {
  const today = todayIn(timeZone, now);
  return Array.from({ length: BOOKING_WINDOW_DAYS + 1 }, (_, i) =>
    addDays(today, i),
  );
}

/**
 * "2026-11-03" → { weekday: "Tue", day: 3, month: "November 2026",
 *                  long: "Tuesday 3 November", short: "Tue 3 Nov" }.
 * A date has no timezone, so it's formatted as UTC midnight to keep it from shifting a day.
 */
export function describeDate(date: string) {
  const d = new Date(`${date}T00:00:00Z`);
  const format = (options: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", ...options }).format(d);
  return {
    weekday: format({ weekday: "short" }),
    day: d.getUTCDate(),
    month: format({ month: "long", year: "numeric" }),
    long: format({ weekday: "long", day: "numeric", month: "long" }),
    short: format({ weekday: "short", day: "numeric", month: "short" }),
  };
}

/** The business's calendar date of an API instant: "2026-11-02T17:00:00Z" in KL → "2026-11-03" */
export function dateOf(iso: string, timeZone: string): string {
  return todayIn(timeZone, new Date(iso));
}

/** An instant from the API, as a clock time in the business's timezone: "9:00 AM" */
export function formatTime(iso: string, timeZone: string): string {
  return (
    new Intl.DateTimeFormat("en-US", {
      timeZone,
      hour: "numeric",
      minute: "2-digit",
    })
      .format(new Date(iso))
      // newer browsers put a narrow no-break space before AM/PM; one kind of space is simpler
      .replace(/\s/g, " ")
  );
}

/** "2:00 – 2:45 PM", or "11:30 AM – 12:15 PM" when the range crosses noon */
export function formatTimeRange(
  startIso: string,
  endIso: string,
  timeZone: string,
): string {
  const start = formatTime(startIso, timeZone);
  const end = formatTime(endIso, timeZone);
  const sameHalf = start.slice(-2) === end.slice(-2);
  return `${sameHalf ? start.slice(0, -3) : start} – ${end}`;
}

/** How far `to` is from `from`: "45 min later", "1 h 30 min later", "2 h earlier" */
export function describeGap(fromIso: string, toIso: string): string {
  const minutes = Math.round(
    (Date.parse(toIso) - Date.parse(fromIso)) / 60_000,
  );
  const abs = Math.abs(minutes);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  const amount = [h && `${h} h`, (m || !h) && `${m} min`]
    .filter(Boolean)
    .join(" ");
  return `${amount} ${minutes < 0 ? "earlier" : "later"}`;
}

/** Minutes since local midnight in the business's timezone: "2026-11-02T06:45:00Z" in KL → 885 (2:45 PM) */
export function minutesIntoDay(iso: string, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23", // midnight is 00, never 24
  }).formatToParts(new Date(iso));
  const get = (type: string) =>
    Number(parts.find((p) => p.type === type)?.value);
  return get("hour") * 60 + get("minute");
}

/** "2026-11-05" → 4 (Thursday). 0 = Sunday, the same numbers as the API's working hours */
export function weekdayOf(date: string): number {
  return new Date(`${date}T00:00:00Z`).getUTCDay();
}
