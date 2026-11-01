import { z } from "zod";
import { isCalendarDate } from "../../lib/time.js";

const id = (what: string) =>
  z.string().regex(/^\d{1,18}$/, `not a valid ${what} id`);

// query strings are always strings, so no coercion needed
export const availabilityQuery = z.object({
  serviceId: id("service"),
  date: z.string().refine(isCalendarDate, "a date like 2026-11-02"),
  staffId: id("staff").optional(), // leave out for "anyone"
});

export type AvailabilityQuery = z.infer<typeof availabilityQuery>;
