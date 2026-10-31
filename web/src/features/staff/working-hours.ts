import { z } from "zod";

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
