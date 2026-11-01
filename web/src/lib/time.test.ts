import { describe, expect, it } from "vitest";
import {
  addDays,
  bookableDates,
  describeDate,
  formatTime,
  isCalendarDate,
  todayIn,
} from "./time";

describe("time helpers", () => {
  it("shows API instants as clock times in the business's timezone", () => {
    expect(formatTime("2026-11-02T01:00:00Z", "Asia/Kuala_Lumpur")).toBe(
      "9:00 AM",
    );
    expect(formatTime("2026-11-02T06:45:00Z", "Asia/Kuala_Lumpur")).toBe(
      "2:45 PM",
    );
    // same instant, different shop: the visitor's own timezone never matters
    expect(formatTime("2026-11-02T01:00:00Z", "Europe/London")).toBe("1:00 AM");
  });

  it("knows 'today' is the business's today", () => {
    const now = new Date("2026-11-01T17:00:00Z"); // 01:00 on 2 Nov in Kuala Lumpur
    expect(todayIn("Asia/Kuala_Lumpur", now)).toBe("2026-11-02");
    expect(todayIn("Europe/London", now)).toBe("2026-11-01");
  });

  it("lists today plus 30 days, across a month end", () => {
    const dates = bookableDates(
      "Asia/Kuala_Lumpur",
      new Date("2026-11-20T04:00:00Z"),
    );
    expect(dates).toHaveLength(31);
    expect(dates[0]).toBe("2026-11-20");
    expect(dates.at(-1)).toBe("2026-12-20");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
  });

  it("describes a date without shifting it a day", () => {
    expect(describeDate("2026-11-03")).toEqual({
      weekday: "Tue",
      day: 3,
      month: "November 2026",
      long: "Tuesday 3 November",
    });
  });

  it("only accepts real dates", () => {
    expect(isCalendarDate("2028-02-29")).toBe(true);
    expect(isCalendarDate("2026-02-30")).toBe(false);
    expect(isCalendarDate("tomorrow")).toBe(false);
  });
});
