import express from "express";
import { NotFoundError } from "../../lib/errors.js";
import { currentTenantId, requireRole } from "../../middleware/auth.js";
import { findTenantById } from "../tenants/tenants.repository.js";
import { listBookingsForDay } from "./bookings.repository.js";
import {
  bookingIdParams,
  createBookingSchema,
  listBookingsQuery,
  updateBookingSchema,
} from "./bookings.schemas.js";
import { changeBooking, createBooking } from "./bookings.service.js";

const router = express.Router();

// every route in this file is for logged-in owners only
router.use(requireRole("owner"));

// The dashboard's day: GET /api/bookings?date=2026-11-03, a date in the business's calendar
router.get("/", async (req, res) => {
  const { date } = listBookingsQuery.parse(req.query);
  const tenant = await findTenantById(currentTenantId(req));
  if (!tenant) throw new NotFoundError("business not found");

  res.json({
    bookings: await listBookingsForDay(tenant.id, date, tenant.timezone),
  });
});

// A walk-in or phone booking. Same rules and same constraint as online bookings, except
// the notice and window limits (PRD section 8), so a walk-in can be recorded after it started.
router.post("/", async (req, res) => {
  const input = createBookingSchema.parse(req.body);
  const tenant = await findTenantById(currentTenantId(req));
  if (!tenant) throw new NotFoundError("business not found");

  const booking = await createBooking(tenant, input, "manual");
  req.log.info(
    { tenantId: tenant.id, ref: booking.ref, source: "manual" },
    "booking created",
  );
  res.status(201).json({ booking });
});

// Cancel ({ status: "cancelled" }) or move ({ start, staffId? }) one booking
router.patch("/:id", async (req, res) => {
  const { id } = bookingIdParams.parse(req.params);
  const change = updateBookingSchema.parse(req.body);
  const tenant = await findTenantById(currentTenantId(req));
  if (!tenant) throw new NotFoundError("business not found");

  const booking = await changeBooking(tenant, id, change);
  req.log.info(
    { tenantId: tenant.id, ref: booking.ref, change: change.kind },
    "booking changed",
  );
  res.json({ booking });
});

export default router;
