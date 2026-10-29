import { z } from "zod";

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const time = z.string().regex(TIME, "must be a time like 09:30");

export const rangeSchema = z
  .object({
    weekday: z.number().int().min(0).max(6),
    start: time,
    end: time,
  })
  .refine((r) => !TIME.test(r.start) || !TIME.test(r.end) || r.end > r.start, {
    message: "must be after start",
    path: ["end"],
  });

export const putHoursSchema = z
  .object({
    hours: z.array(rangeSchema).max(50),
  })
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
          path: ["hours", cur.index],
          message: "overlaps another range on the same day",
        });
      }
    }
  });

export type Range = z.infer<typeof rangeSchema>;
