import pg from "pg";
import { bookingRules } from "../../config/booking.js";
import { withTransaction } from "../../db/transaction.js";
import { ConflictError, NotFoundError, RuleError } from "../../lib/errors.js";
import { addDays, localDate } from "../../lib/time.js";
import { findService } from "../services/services.repository.js";
import { findStaff, staffExists } from "../staff/staff.repository.js";
import type { Tenant } from "../tenants/tenants.repository.js";
import {
  cancelBooking as cancelBookingRow,
  findBooking,
  findCandidates,
  insertBooking,
  moveBooking as moveBookingRow,
  type Booking,
  type NewBooking,
} from "./bookings.repository.js";
import type {
  CreateBookingInput,
  UpdateBookingInput,
} from "./bookings.schemas.js";
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
      return await insertWithRetries({
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

/** PATCH /api/bookings/:id: cancel or move. Owner-only, so the notice and window rules don't apply. */
export async function changeBooking(
  tenant: Tenant,
  id: string,
  change: UpdateBookingInput,
): Promise<Booking> {
  if (change.kind === "cancel") {
    const booking = await cancelBookingRow(tenant.id, id);
    if (!booking) throw new NotFoundError("booking not found");
    return booking;
  }
  return moveBooking(tenant, id, change.start, change.staffId);
}

async function moveBooking(
  tenant: Tenant,
  id: string,
  startText: string,
  newStaffId: string | undefined,
): Promise<Booking> {
  const booking = await findBooking(tenant.id, id);
  if (!booking) throw new NotFoundError("booking not found");
  if (booking.status === "cancelled") throw cancelledError();

  const staffId = newStaffId ?? booking.staff.id;
  const staff = await findStaff(tenant.id, staffId);
  if (!staff) throw new NotFoundError("staff member not found");
  if (!staff.active)
    throw new RuleError(
      "INACTIVE_RESOURCE",
      "this staff member is no longer taking bookings",
    );

  // It keeps the length it was booked with, even if the service's length has changed since
  const start = new Date(startText);
  const end = new Date(
    start.getTime() + (booking.end.getTime() - booking.start.getTime()),
  );

  const fits = await findCandidates({
    tenantId: tenant.id,
    start,
    end,
    timezone: tenant.timezone,
    staffId,
  });
  if (fits.length === 0)
    throw new RuleError(
      "OUTSIDE_WORKING_HOURS",
      `${staff.name} isn't working for the whole of that time`,
    );
  // `free` isn't checked here: moving 2:00 to 2:15 overlaps the booking's own old time, which
  // is fine. The exclusion constraint compares against OTHER rows, so it gets this right.

  try {
    const moved = await withTransaction(async (tx) => {
      // the same per-staff lock as inserts (ADR-0009), so racing writes fail fast with 23P01
      await staffExists(tenant.id, staffId, tx, { lock: true });
      return moveBookingRow(
        { tenantId: tenant.id, id, staffId, start, end },
        tx,
      );
    });
    if (!moved) throw cancelledError(); // cancelled while we were checking
    return moved;
  } catch (err) {
    if (isOverlap(err))
      throw new ConflictError(
        "SLOT_TAKEN",
        `${staff.name} already has a booking at that time`,
      );
    throw err;
  }
}

function cancelledError() {
  return new RuleError(
    "BOOKING_CANCELLED",
    "a cancelled booking can't be moved; make a new one instead",
  );
}

async function insertWithRetries(booking: Omit<NewBooking, "ref">) {
  for (let attempt = 1; ; attempt++) {
    try {
      return await withTransaction(async (tx) => {
        // One insert at a time per staff member (ADR-0009). Without this, inserts racing for
        // the same slot deadlock inside the exclusion constraint check, and Postgres takes
        // deadlock_timeout (1 s) to break each one. The constraint is still what prevents
        // double-booking; the lock just makes the losers fail fast with a clean 23P01.
        await staffExists(booking.tenantId, booking.staffId, tx, {
          lock: true,
        });
        return insertBooking({ ...booking, ref: generateRef() }, tx);
      });
    } catch (err) {
      // Worth another go: a random ref that this business already has (very rare), or a
      // deadlock with some other code path that writes bookings without taking the lock
      if ((isRefCollision(err) || isDeadlock(err)) && attempt < 3) continue;
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

function isDeadlock(err: unknown) {
  return err instanceof pg.DatabaseError && err.code === "40P01";
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
