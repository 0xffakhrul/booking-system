import { z } from "zod";
import type { Range } from "./useWorkingHours";

// Monday first, the way shops here read a week. The numbers are the API's: 0 = Sunday, like Date.getDay().
export const WEEK = [
  { weekday: 1, label: "Monday" },
  { weekday: 2, label: "Tuesday" },
  { weekday: 3, label: "Wednesday" },
  { weekday: 4, label: "Thursday" },
  { weekday: 5, label: "Friday" },
  { weekday: 6, label: "Saturday" },
  { weekday: 0, label: "Sunday" },
];

// Same rules as api/src/modules/working-hours/working-hours.schemas.ts.
// "HH:MM" strings compare correctly as text, so "09:30" < "13:00" works without parsing.
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

const rangeSchema = z
  .object({
    weekday: z.number().int().min(0).max(6),
    start: z.string().regex(TIME, "Pick a start time"),
    end: z.string().regex(TIME, "Pick an end time"),
  })
  .refine((r) => r.end > r.start, {
    message: "End must be after start",
    path: ["end"],
  });

export const weekSchema = z
  .object({ hours: z.array(rangeSchema).max(50) })
  .superRefine(({ hours }, ctx) => {
    const sorted = hours
      .map((range, index) => ({ ...range, index }))
      .sort((a, b) => a.weekday - b.weekday || a.start.localeCompare(b.start));

    for (let i = 1; i < sorted.length; i++) {
      const prev = sorted[i - 1]!;
      const cur = sorted[i]!;
      if (cur.weekday === prev.weekday && cur.start < prev.end) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["hours", cur.index, "start"],
          message: "Overlaps other hours on this day",
        });
      }
    }
  });

export type WeekForm = z.infer<typeof weekSchema>;

/** "17:00" + 60 → "18:00", stopping at 23:55 */
export function addMinutes(time: string, minutes: number) {
  const [h = 0, m = 0] = time.split(":").map(Number);
  const total = Math.min(h * 60 + m + minutes, 23 * 60 + 55);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(Math.floor(total / 60))}:${pad(total % 60)}`;
}

const SHORT = {
  0: "Sun",
  1: "Mon",
  2: "Tue",
  3: "Wed",
  4: "Thu",
  5: "Fri",
  6: "Sat",
};
const short = (weekday: number) => SHORT[weekday as keyof typeof SHORT];

/**
 * A week as a few lines, for the staff list: one line per run of neighbouring days with
 * the same hours, Monday first. Back-to-back ranges are joined, since 9–4 then 4–6 is
 * really 9–6. Days off are left out.
 *   [{ days: "Mon–Fri", hours: ["10:00–13:00", "14:00–19:00"] }, { days: "Sat", hours: ["10:00–16:00"] }]
 */
export function summarizeWeek(
  ranges: Range[],
): { days: string; hours: string[] }[] {
  const byDay = WEEK.map(({ weekday }) => ({
    weekday,
    hours: joinTouching(ranges.filter((r) => r.weekday === weekday))
      .map((r) => `${r.start}–${r.end}`)
      .join(", "),
  }));
  const groups: { from: number; to: number; hours: string }[] = [];
  for (const day of byDay) {
    const last = groups.at(-1);
    // only neighbouring days with the same hours share a line
    if (
      last &&
      day.hours &&
      last.hours === day.hours &&
      last.to === prev(day.weekday)
    )
      last.to = day.weekday;
    else if (day.hours)
      groups.push({ from: day.weekday, to: day.weekday, hours: day.hours });
  }
  const everyDay =
    groups.length === 1 && groups[0]!.from === 1 && groups[0]!.to === 0;
  return groups.map(({ from, to, hours }) => ({
    days: everyDay
      ? "Every day"
      : from === to
        ? short(from)
        : `${short(from)}–${short(to)}`,
    hours: hours.split(", "),
  }));
}

/** One day's ranges, sorted, with ranges that touch or overlap joined: 9–4 + 4–5 → 9–5 */
function joinTouching(day: Range[]): { start: string; end: string }[] {
  const joined: { start: string; end: string }[] = [];
  for (const r of [...day].sort((a, b) => a.start.localeCompare(b.start))) {
    const last = joined.at(-1);
    if (last && r.start <= last.end)
      last.end = r.end > last.end ? r.end : last.end;
    else joined.push({ start: r.start, end: r.end });
  }
  return joined;
}

/** The day before in the Monday-first week: Tue → Mon, Mon → none */
function prev(weekday: number) {
  const i = WEEK.findIndex((d) => d.weekday === weekday);
  return i > 0 ? WEEK[i - 1]!.weekday : -1;
}
