import { describe, expect, it } from "vitest";
import { summarizeWeek } from "./working-hours";

const week = (days: number[], start: string, end: string) =>
  days.map((weekday) => ({ weekday, start, end }));

describe("summarizeWeek", () => {
  it("groups neighbouring days with the same hours, one line each, Monday first", () => {
    expect(
      summarizeWeek([
        ...week([1, 2, 3, 4, 5], "10:00", "13:00"),
        ...week([1, 2, 3, 4, 5], "14:00", "19:00"),
        ...week([6], "10:00", "16:00"),
      ]),
    ).toEqual([
      { days: "Mon–Fri", hours: ["10:00–13:00", "14:00–19:00"] },
      { days: "Sat", hours: ["10:00–16:00"] },
    ]);
  });

  it("joins back-to-back ranges, so a split day can match the rest of the week", () => {
    expect(
      summarizeWeek([
        { weekday: 1, start: "09:00", end: "16:00" },
        { weekday: 1, start: "16:00", end: "17:00" },
        { weekday: 1, start: "17:00", end: "18:00" },
        ...week([2, 3, 4, 5, 6, 0], "09:00", "18:00"),
      ]),
    ).toEqual([{ days: "Every day", hours: ["09:00–18:00"] }]);
  });

  it("doesn't join days across a day off", () => {
    expect(summarizeWeek(week([1, 2, 4, 5], "09:00", "18:00"))).toEqual([
      { days: "Mon–Tue", hours: ["09:00–18:00"] },
      { days: "Thu–Fri", hours: ["09:00–18:00"] },
    ]);
  });

  it("puts Sunday last", () => {
    expect(summarizeWeek(week([0, 6], "10:00", "14:00"))).toEqual([
      { days: "Sat–Sun", hours: ["10:00–14:00"] },
    ]);
  });

  it("is empty when there are no hours", () => {
    expect(summarizeWeek([])).toEqual([]);
  });
});
