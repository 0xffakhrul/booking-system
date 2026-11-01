// Calendar-date helpers. Dates here are plain "YYYY-MM-DD" strings, which compare correctly as
// text ("2026-11-09" < "2026-11-10"), so there's no Date object pretending to be a day.

/** The calendar date of an instant in a timezone: 2026-11-01T17:00Z in Kuala Lumpur → "2026-11-02" */
export function localDate(instant: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone }).format(instant); // en-CA writes YYYY-MM-DD
}

/** "2026-11-01" + 30 → "2026-12-01" */
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
