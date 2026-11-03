// An .ics file (iCalendar, RFC 5545) that phones and Google/Outlook calendars can open.
// Times are written in UTC ("…Z"), so the calendar app shows them in the reader's own timezone.

type CalendarEvent = {
  uid: string;
  title: string;
  description: string;
  start: string; // ISO instant from the API
  end: string;
};

/** "2026-11-03T06:00:00.000Z" → "20261103T060000Z" */
function icsTime(iso: string) {
  return new Date(iso)
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
}

/** commas, semicolons and backslashes mean something in .ics text, so they're escaped */
function icsText(text: string) {
  return text.replace(/[\\;,]/g, (c) => `\\${c}`).replace(/\n/g, "\\n");
}

export function calendarFile(event: CalendarEvent, now = new Date()): string {
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Tempah//Booking//EN",
    "BEGIN:VEVENT",
    `UID:${event.uid}`,
    `DTSTAMP:${icsTime(now.toISOString())}`,
    `DTSTART:${icsTime(event.start)}`,
    `DTEND:${icsTime(event.end)}`,
    `SUMMARY:${icsText(event.title)}`,
    `DESCRIPTION:${icsText(event.description)}`,
    "END:VEVENT",
    "END:VCALENDAR",
    "", // the format wants a line break after the last line too
  ].join("\r\n");
}

/** A link target that downloads the file: <a href={…} download="booking.ics"> */
export function calendarHref(event: CalendarEvent): string {
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(calendarFile(event))}`;
}
