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
 * "2026-11-03" → { weekday: "Tue", day: 3, month: "November 2026", long: "Tuesday 3 November" }.
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
  };
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
