import pg from "pg";
import { bookingRules } from "../../config/booking.js";
import { ConflictError, NotFoundError, RuleError } from "../../lib/errors.js";
import { findService } from "../services/services.repository.js";
import { findStaff } from "../staff/staff.repository.js";
import type { Tenant } from "../tenants/tenants.repository.js";
import {
  findCandidates,
  insertBooking,
  type Booking,
  type NewBooking,
} from "./bookings.repository.js";
import type { CreateBookingInput } from "./bookings.schemas.js";
import { generateRef } from "./refs.js";

/**
 * Creates a booking, or throws the API error that explains why not.
 * The checks here give friendly errors; the exclusion constraint is what actually prevents
 * double-booking, including when two requests pass these checks at the same moment.
 */
export async function createBooking(
  tenant: Tenant,
  input: CreateBookingInput,
  source: "online" | "manual",
  now = new Date(),
): Promise<Booking> {
  const service = await findService(tenant.id, input.serviceId);
  if (!service) throw new NotFoundError("service not found");
  if (!service.active)
    throw new RuleError(
      "INACTIVE_RESOURCE",
      "this service is no longer offered",
    );

  const start = new Date(input.start);
  // the length always comes from the service, never from the client
  const end = new Date(start.getTime() + service.durationMin * 60_000);

  // owners recording walk-ins and phone bookings skip these two (PRD section 8)
  if (source === "online") checkNoticeAndWindow(start, tenant.timezone, now);

  if (input.staffId) {
    const staff = await findStaff(tenant.id, input.staffId);
    if (!staff) throw new NotFoundError("staff member not found");
    if (!staff.active)
      throw new RuleError(
        "INACTIVE_RESOURCE",
        "this staff member is no longer taking bookings",
      );
  }

  const candidates = await findCandidates({
    tenantId: tenant.id,
    start,
    end,
    timezone: tenant.timezone,
    staffId: input.staffId,
  });
  if (candidates.length === 0)
    throw new RuleError(
      "OUTSIDE_WORKING_HOURS",
      "nobody is working for the whole of that time",
    );

  // One small insert per candidate. Each runs on its own, so a failed one doesn't affect the next.
  for (const candidate of candidates.filter((c) => c.free)) {
    try {
      return await insertWithNewRef({
        tenantId: tenant.id,
        staffId: candidate.id,
        serviceId: service.id,
        customerName: input.customerName,
        customerPhone: input.customerPhone,
        start,
        end,
        source,
      });
    } catch (err) {
      if (isOverlap(err)) continue; // someone else got this person first; try the next
      throw err;
    }
  }

  throw new ConflictError(
    "SLOT_TAKEN",
    "that time was just booked, please pick another",
  );
}

async function insertWithNewRef(booking: Omit<NewBooking, "ref">) {
  for (let attempt = 1; ; attempt++) {
    try {
      return await insertBooking({ ...booking, ref: generateRef() });
    } catch (err) {
      // a random ref matched one this business already has: very rare, just draw again
      if (isRefCollision(err) && attempt < 5) continue;
      throw err;
    }
  }
}

function isOverlap(err: unknown) {
  return (
    err instanceof pg.DatabaseError &&
    err.code === "23P01" &&
    err.constraint === "bookings_no_overlap"
  );
}

function isRefCollision(err: unknown) {
  return (
    err instanceof pg.DatabaseError &&
    err.code === "23505" &&
    err.constraint === "bookings_tenant_id_ref_key"
  );
}

function checkNoticeAndWindow(start: Date, timezone: string, now: Date) {
  const earliest = now.getTime() + bookingRules.minNoticeMinutes * 60_000;
  if (start.getTime() < earliest)
    throw new RuleError(
      "TOO_SOON",
      `bookings must start at least ${bookingRules.minNoticeMinutes} minutes from now`,
    );

  // calendar days in the business's timezone: on 1 Nov, the last bookable day is 1 Dec
  const lastDay = addDays(localDate(now, timezone), bookingRules.windowDays);
  if (localDate(start, timezone) > lastDay)
    throw new RuleError(
      "OUTSIDE_BOOKING_WINDOW",
      `bookings can be made up to ${bookingRules.windowDays} days ahead`,
    );
}

/** The calendar date of an instant in a timezone, as "YYYY-MM-DD" (the en-CA date format) */
function localDate(instant: Date, timeZone: string) {
  return new Intl.DateTimeFormat("en-CA", { timeZone }).format(instant);
}

function addDays(date: string, days: number) {
  return new Date(Date.parse(`${date}T00:00:00Z`) + days * 86_400_000)
    .toISOString()
    .slice(0, 10);
}
