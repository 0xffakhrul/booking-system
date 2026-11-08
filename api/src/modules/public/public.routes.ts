import express from "express";
import type { Response } from "express";
import { NotFoundError } from "../../lib/errors.js";
import { tenantTransaction } from "../../middleware/tenant-transaction.js";
import { availabilityQuery } from "../availability/availability.schemas.js";
import * as availability from "../availability/availability.service.js";
import type { Booking } from "../bookings/bookings.repository.js";
import { createBookingSchema } from "../bookings/bookings.schemas.js";
import * as bookings from "../bookings/bookings.service.js";
import { listServices } from "../services/services.repository.js";
import { listStaff } from "../staff/staff.repository.js";
import {
  findTenantBySlug,
  type Tenant,
} from "../tenants/tenants.repository.js";

// Customer-facing routes: no login, the business comes from the slug in the URL
const router = express.Router();
type Params = { slug: string };

// Every route here starts by finding the business from :slug (tenants has no RLS, so this works
// before we know the tenant), then runs in that business's transaction like owner routes do
router.use<"/:slug", Params>(
  "/:slug",
  async (req, res, next) => {
    const tenant = await findTenantBySlug(req.params.slug);
    if (!tenant) throw new NotFoundError("business not found");
    res.locals.tenant = tenant;
    req.tenantId = tenant.id;
    next();
  },
  tenantTransaction,
);

const tenantOf = (res: Response) => res.locals.tenant as Tenant;

// The booking page's first request: who the business is and what can be booked
router.get<"/:slug", Params>("/:slug", async (req, res) => {
  const tenant = tenantOf(res);
  // one after the other: both use the request's single connection
  const services = await listServices(false); // active only: removed ones are hidden
  const staff = await listStaff(tenant.id, false);

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
    const tenant = tenantOf(res);
    const query = availabilityQuery.parse(req.query); // throws ZodError → 400
    res.json(await availability.getAvailability(tenant, query));
  },
);

router.post<"/:slug/bookings", Params>("/:slug/bookings", async (req, res) => {
  const tenant = tenantOf(res);
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
