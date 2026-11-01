import express from "express";
import { NotFoundError } from "../../lib/errors.js";
import type { Booking } from "../bookings/bookings.repository.js";
import { createBookingSchema } from "../bookings/bookings.schemas.js";
import * as bookings from "../bookings/bookings.service.js";
import { findTenantBySlug } from "../tenants/tenants.repository.js";

// Customer-facing routes: no login, the business comes from the slug in the URL
const router = express.Router();
type Params = { slug: string };

router.post<"/:slug/bookings", Params>("/:slug/bookings", async (req, res) => {
  const tenant = await findTenantBySlug(req.params.slug);
  if (!tenant) throw new NotFoundError("business not found");

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
