import { z } from "zod";
import { isCalendarDate } from "../../lib/time.js";

const id = (what: string) =>
  z.string().regex(/^\d{1,18}$/, `not a valid ${what} id`);

/**
 * Accepts what people actually type ("012-345 6789", "60123456789", "+60 12 345 6789")
 * and stores E.164 ("+60123456789"). Numbers without a country code are taken as Malaysian.
 */
export const phoneSchema = z
  .string()
  .transform((raw) => {
    const digits = raw.replace(/[\s\-().]/g, "");
    if (digits.startsWith("+")) return digits;
    if (digits.startsWith("60")) return `+${digits}`;
    if (digits.startsWith("0")) return `+6${digits}`;
    return digits;
  })
  .pipe(
    z
      .string()
      .regex(/^\+[1-9]\d{6,14}$/, "enter a phone number like 012-345 6789"),
  );

export const createBookingSchema = z.object({
  serviceId: id("service"),
  staffId: id("staff").optional(), // leave out for "anyone"
  // an instant with its offset: "2026-11-02T10:00:00+08:00" or "2026-11-02T02:00:00Z"
  start: z.string().datetime({ offset: true }),
  customerName: z.string().trim().min(1).max(80),
  customerPhone: phoneSchema,
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;

export const listBookingsQuery = z.object({
  date: z.string().refine(isCalendarDate, "a date like 2026-11-02"),
});
