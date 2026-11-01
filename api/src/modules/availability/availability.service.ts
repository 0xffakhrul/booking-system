import { bookingRules } from "../../config/booking.js";
import { NotFoundError, RuleError } from "../../lib/errors.js";
import { addDays, localDate } from "../../lib/time.js";
import { findService } from "../services/services.repository.js";
import { findStaff } from "../staff/staff.repository.js";
import type { Tenant } from "../tenants/tenants.repository.js";
import { findAvailableSlots } from "./availability.repository.js";
import type { AvailabilityQuery } from "./availability.schemas.js";

/** Free slots for a customer: same rules as booking, so every slot shown can actually be booked */
export async function getAvailability(
  tenant: Tenant,
  query: AvailabilityQuery,
  now = new Date(),
) {
  // between today and windowDays ahead, counted in the business's own calendar
  const today = localDate(now, tenant.timezone);
  const lastDay = addDays(today, bookingRules.windowDays);
  if (query.date < today || query.date > lastDay)
    throw new RuleError(
      "OUTSIDE_BOOKING_WINDOW",
      `pick a date from ${today} to ${lastDay}`,
    );

  // removed services and staff are hidden from customers, so they're simply "not found" here
  const service = await findService(tenant.id, query.serviceId);
  if (!service?.active) throw new NotFoundError("service not found");
  if (query.staffId) {
    const staff = await findStaff(tenant.id, query.staffId);
    if (!staff?.active) throw new NotFoundError("staff member not found");
  }

  const slots = await findAvailableSlots({
    tenantId: tenant.id,
    serviceId: service.id,
    date: query.date,
    timezone: tenant.timezone,
    earliest: new Date(now.getTime() + bookingRules.minNoticeMinutes * 60_000),
    staffId: query.staffId,
  });
  return { date: query.date, timezone: tenant.timezone, slots };
}
