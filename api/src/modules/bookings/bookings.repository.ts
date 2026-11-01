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
     SELECT b.id, b.ref,
            json_build_object('id', sv.id::text, 'name', sv.name, 'durationMin', sv.duration_min) AS service,
            json_build_object('id', st.id::text, 'name', st.name) AS staff,
            b.customer_name AS "customerName", b.customer_phone AS "customerPhone",
            lower(b.during) AS start, upper(b.during) AS "end",
            b.status, b.source
       FROM b
       JOIN services sv ON sv.id = b.service_id
       JOIN staff st ON st.id = b.staff_id`,
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
