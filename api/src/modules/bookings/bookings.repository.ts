import { pool, type Queryable } from "../../db/pool.js";

export interface Booking {
  id: string;
  ref: string;
  service: { id: string; name: string; durationMin: number };
  staff: { id: string; name: string };
  customerName: string;
  customerPhone: string;
  start: Date;
  end: Date;
  status: "confirmed" | "cancelled";
  source: "online" | "manual";
}

export interface NewBooking {
  tenantId: string;
  ref: string;
  staffId: string;
  serviceId: string;
  customerName: string;
  customerPhone: string;
  start: Date;
  end: Date;
  source: "online" | "manual";
}

// The API's Booking shape, from bookings `b` joined to their service `sv` and staff member `st`.
// Shared by every query that returns bookings, so they can't drift apart.
const BOOKING_COLUMNS = `
  b.id, b.ref,
  json_build_object('id', sv.id::text, 'name', sv.name, 'durationMin', sv.duration_min) AS service,
  json_build_object('id', st.id::text, 'name', st.name) AS staff,
  b.customer_name AS "customerName", b.customer_phone AS "customerPhone",
  lower(b.during) AS start, upper(b.during) AS "end",
  b.status, b.source`;
const BOOKING_JOINS = `
  JOIN services sv ON sv.id = b.service_id
  JOIN staff st ON st.id = b.staff_id`;

/**
 * Inserts and returns the booking with its service and staff names, in one round trip.
 * Throws Postgres errors as-is: 23P01 (overlap) and 23505 (ref collision) are the caller's to handle.
 */
export async function insertBooking(
  b: NewBooking,
  db: Queryable = pool,
): Promise<Booking> {
  const { rows } = await db.query<Booking>(
    `WITH b AS (
       INSERT INTO bookings
         (tenant_id, ref, staff_id, service_id, customer_name, customer_phone, during, source)
       VALUES ($1, $2, $3, $4, $5, $6, tstzrange($7, $8), $9)
       RETURNING *
     )
     SELECT ${BOOKING_COLUMNS}
       FROM b
       ${BOOKING_JOINS}`,
    [
      b.tenantId,
      b.ref,
      b.staffId,
      b.serviceId,
      b.customerName,
      b.customerPhone,
      b.start,
      b.end,
      b.source,
    ],
  );
  return rows[0]!;
}

// Working hours are local wall-clock times, so the booking's instants are converted to the
// business's timezone first. The booking has to fit inside ONE range, on the same local day.
const FITS_WORKING_HOURS = `
  EXISTS (
    SELECT 1 FROM working_hours wh
     WHERE wh.tenant_id = $1
       AND wh.staff_id = s.id
       AND wh.weekday = extract(dow FROM $2::timestamptz AT TIME ZONE $4)
       AND ($2::timestamptz AT TIME ZONE $4)::date = ($3::timestamptz AT TIME ZONE $4)::date
       AND wh.start_time <= ($2::timestamptz AT TIME ZONE $4)::time
       AND wh.end_time >= ($3::timestamptz AT TIME ZONE $4)::time
  )`;

export interface Candidate {
  id: string;
  /** false when a live booking already overlaps this time */
  free: boolean;
}

/**
 * Active staff whose working hours cover [start, end), oldest first so "anyone" is stable.
 * Pass staffId to check just that one person.
 */
export async function findCandidates(
  args: {
    tenantId: string;
    start: Date;
    end: Date;
    timezone: string;
    staffId?: string;
  },
  db: Queryable = pool,
): Promise<Candidate[]> {
  const { rows } = await db.query<Candidate>(
    `SELECT s.id,
            NOT EXISTS (
              SELECT 1 FROM bookings b
               WHERE b.staff_id = s.id
                 AND b.status <> 'cancelled'
                 AND b.during && tstzrange($2, $3)
            ) AS free
       FROM staff s
      WHERE s.tenant_id = $1
        AND s.active
        AND ($5::bigint IS NULL OR s.id = $5)
        AND ${FITS_WORKING_HOURS}
      ORDER BY s.id`,
    [args.tenantId, args.start, args.end, args.timezone, args.staffId ?? null],
  );
  return rows;
}

/**
 * One local day's bookings, cancelled ones included, by start time.
 * "The day" is midnight to midnight in the business's timezone: in Kuala Lumpur, Monday
 * starts at 16:00 UTC on Sunday. The (tenant_id, lower(during)) index serves this range.
 */
export async function listBookingsForDay(
  tenantId: string,
  date: string, // "YYYY-MM-DD", the business's calendar
  timezone: string,
  db: Queryable = pool,
): Promise<Booking[]> {
  const { rows } = await db.query<Booking>(
    `SELECT ${BOOKING_COLUMNS}
       FROM bookings b
       ${BOOKING_JOINS}
      WHERE b.tenant_id = $1
        AND lower(b.during) >= ($2::date)::timestamp AT TIME ZONE $3
        AND lower(b.during) <  ($2::date + 1)::timestamp AT TIME ZONE $3
      ORDER BY lower(b.during), st.id`,
    [tenantId, date, timezone],
  );
  return rows;
}

/** One booking of this business, or null. Another business's id is "not found" too. */
export async function findBooking(
  tenantId: string,
  id: string,
  db: Queryable = pool,
): Promise<Booking | null> {
  const { rows } = await db.query<Booking>(
    `SELECT ${BOOKING_COLUMNS}
       FROM bookings b
       ${BOOKING_JOINS}
      WHERE b.tenant_id = $1 AND b.id = $2`,
    [tenantId, id],
  );
  return rows[0] ?? null;
}

/**
 * Cancels and returns the booking, or null if this business has no such booking.
 * Cancelling twice is fine. The exclusion constraint skips cancelled rows, so the slot frees up.
 */
export async function cancelBooking(
  tenantId: string,
  id: string,
  db: Queryable = pool,
): Promise<Booking | null> {
  const { rows } = await db.query<Booking>(
    `WITH b AS (
       UPDATE bookings SET status = 'cancelled'
        WHERE tenant_id = $1 AND id = $2
       RETURNING *
     )
     SELECT ${BOOKING_COLUMNS}
       FROM b
       ${BOOKING_JOINS}`,
    [tenantId, id],
  );
  return rows[0] ?? null;
}

/**
 * Moves a live booking to a new time and staff member, returning it, or null if it's
 * missing or cancelled. Throws 23P01 when the new time overlaps another booking.
 */
export async function moveBooking(
  b: { tenantId: string; id: string; staffId: string; start: Date; end: Date },
  db: Queryable = pool,
): Promise<Booking | null> {
  const { rows } = await db.query<Booking>(
    `WITH b AS (
       UPDATE bookings SET staff_id = $3, during = tstzrange($4, $5)
        WHERE tenant_id = $1 AND id = $2 AND status <> 'cancelled'
       RETURNING *
     )
     SELECT ${BOOKING_COLUMNS}
       FROM b
       ${BOOKING_JOINS}`,
    [b.tenantId, b.id, b.staffId, b.start, b.end],
  );
  return rows[0] ?? null;
}
