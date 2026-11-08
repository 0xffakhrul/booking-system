import type { Queryable } from "../../db/pool.js";
import { currentDb } from "../../db/tenant.js";

export interface Slot {
  start: Date;
  end: Date;
  /** everyone free for the whole slot, oldest staff first */
  staffIds: string[];
}

/**
 * The free start times for one service on one local date, in a single query:
 *
 * 1. ranges: each active staff member's working hours on that weekday, turned into real
 *    instants in the business's timezone (10:00 on 2030-01-07 in Asia/Kuala_Lumpur = 02:00Z)
 * 2. slots:  generate_series cuts each range into service-length pieces, starting at the
 *    range's start. A 45-minute service in 10:00–13:00 gives 10:00, 10:45, 11:30 and 12:15
 *    (PRD section 8), and the last piece always ends inside the range.
 * 3. drops slots that start before `earliest` (the 1-hour notice) or overlap a live booking
 * 4. merges staff who are free at the same start into one slot
 *
 * Returns [] when the service doesn't exist, is inactive, or nobody works that day.
 */
export async function findAvailableSlots(
  args: {
    tenantId: string;
    serviceId: string;
    /** local calendar date in the business's timezone, "YYYY-MM-DD" */
    date: string;
    timezone: string;
    /** no slot starts before this instant */
    earliest: Date;
    /** only this staff member; leave out for "anyone" */
    staffId?: string;
  },
  db: Queryable = currentDb(),
): Promise<Slot[]> {
  const { rows } = await db.query<Slot>(
    `WITH service AS (
       SELECT make_interval(mins => duration_min) AS length
         FROM services
        WHERE tenant_id = $1 AND id = $2 AND active
     ),
     ranges AS (
       -- date + time is a local timestamp; AT TIME ZONE turns it into an instant
       SELECT wh.staff_id,
              ($3::date + wh.start_time) AT TIME ZONE $4 AS range_start,
              ($3::date + wh.end_time)   AT TIME ZONE $4 AS range_end
         FROM working_hours wh
         JOIN staff s ON s.tenant_id = wh.tenant_id AND s.id = wh.staff_id
        WHERE wh.tenant_id = $1
          AND s.active
          AND wh.weekday = extract(dow FROM $3::date)
          AND ($6::bigint IS NULL OR wh.staff_id = $6)
     ),
     slots AS (
       SELECT r.staff_id, gs AS start, gs + service.length AS "end"
         FROM ranges r
        CROSS JOIN service
        CROSS JOIN generate_series(
          r.range_start,
          r.range_end - service.length, -- the last start that still ends inside the range
          service.length
        ) AS gs
     )
     SELECT slots.start, slots."end",
            array_agg(slots.staff_id::text ORDER BY slots.staff_id) AS "staffIds"
       FROM slots
      WHERE slots.start >= $5
        AND NOT EXISTS (
          SELECT 1 FROM bookings b
           WHERE b.tenant_id = $1
             AND b.staff_id = slots.staff_id
             AND b.status <> 'cancelled'
             AND b.during && tstzrange(slots.start, slots."end")
        )
      GROUP BY slots.start, slots."end"
      ORDER BY slots.start`,
    [
      args.tenantId,
      args.serviceId,
      args.date,
      args.timezone,
      args.earliest,
      args.staffId ?? null,
    ],
  );
  return rows;
}
