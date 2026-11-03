import { describe, expect, it } from "vitest";
import { calendarFile } from "./calendar";

describe("calendarFile", () => {
  it("writes the booking as a UTC event a calendar app can open", () => {
    const ics = calendarFile(
      {
        uid: "K7XQ9MPA@tempah",
        title: "Haircut & wash, Kedai Gunting Ali",
        description: "Booking ref K7XQ9MPA; with Ali",
        start: "2026-11-03T06:00:00.000Z",
        end: "2026-11-03T06:45:00.000Z",
      },
      new Date("2026-11-02T12:00:00Z"),
    );

    const lines = ics.split("\r\n");
    expect(lines[0]).toBe("BEGIN:VCALENDAR");
    expect(lines).toContain("DTSTART:20261103T060000Z"); // 2:00 PM in Kuala Lumpur
    expect(lines).toContain("DTEND:20261103T064500Z");
    expect(lines).toContain("SUMMARY:Haircut & wash\\, Kedai Gunting Ali");
    expect(lines).toContain("DESCRIPTION:Booking ref K7XQ9MPA\\; with Ali");
    expect(ics.endsWith("END:VCALENDAR\r\n")).toBe(true);
  });
});
