import express from "express";
import type { Request } from "express";
import { NotFoundError } from "../../lib/errors.js";
import { availabilityQuery } from "../availability/availability.schemas.js";
import * as availability from "../availability/availability.service.js";
import type { Booking } from "../bookings/bookings.repository.js";
import { createBookingSchema } from "../bookings/bookings.schemas.js";
import * as bookings from "../bookings/bookings.service.js";
import { listServices } from "../services/services.repository.js";
import { listStaff } from "../staff/staff.repository.js";
import { findTenantBySlug } from "../tenants/tenants.repository.js";

// Customer-facing routes: no login, the business comes from the slug in the URL
const router = express.Router();
type Params = { slug: string };

async function tenantFromSlug(req: Request<Params>) {
  const tenant = await findTenantBySlug(req.params.slug);
  if (!tenant) throw new NotFoundError("business not found");
  return tenant;
}

// The booking page's first request: who the business is and what can be booked
router.get<"/:slug", Params>("/:slug", async (req, res) => {
  const tenant = await tenantFromSlug(req);
  const [services, staff] = await Promise.all([
    listServices(tenant.id, false), // active only: removed ones are hidden
    listStaff(tenant.id, false),
  ]);

  res.json({
    business: {
      name: tenant.name,
      slug: tenant.slug,
      timezone: tenant.timezone,
    },
    services,
    staff: staff.map(({ id, name }) => ({ id, name })),
  });
});

router.get<"/:slug/availability", Params>(
  "/:slug/availability",
  async (req, res) => {
    const tenant = await tenantFromSlug(req);
    const query = availabilityQuery.parse(req.query); // throws ZodError → 400
    res.json(await availability.getAvailability(tenant, query));
  },
);

router.post<"/:slug/bookings", Params>("/:slug/bookings", async (req, res) => {
  const tenant = await tenantFromSlug(req);
  const input = createBookingSchema.parse(req.body); // throws ZodError → 400
  const booking = await bookings.createBooking(tenant, input, "online");

  req.log.info({ tenantId: tenant.id, ref: booking.ref }, "booking created");
  res.status(201).json({ booking: toPublicBooking(booking) });
});

/** Customers get the ref instead of the id, and the phone number is never sent back */
function toPublicBooking({
  id: _id,
  customerPhone: _phone,
  ...booking
}: Booking) {
  return booking;
}

export default router;
