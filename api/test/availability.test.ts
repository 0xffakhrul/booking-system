import { beforeEach, describe, expect, it } from "vitest";
import { pool } from "../src/db/pool.js";
import { findAvailableSlots } from "../src/modules/availability/availability.repository.js";
import { generateRef } from "../src/modules/bookings/refs.js";

// A fixed Monday far away, and `earliest` passed in explicitly, so these never depend on today.
const MONDAY = "2030-01-07";
const TZ = "Asia/Kuala_Lumpur";
const kl = (time: string) => new Date(`${MONDAY}T${time}:00+08:00`);
const LONG_AGO = new Date("2000-01-01T00:00:00Z");

let tenantId: string;
let aina: string;
let ben: string;
let haircut: string; // 45 minutes
let colour: string; // 60 minutes

beforeEach(async () => {
  tenantId = await insertId(
    "INSERT INTO tenants (name, slug) VALUES ('Kedai Ali', 'kedai-ali') RETURNING id",
  );
  aina = await insertId(
    "INSERT INTO staff (tenant_id, name) VALUES ($1, 'Aina') RETURNING id",
    [tenantId],
  );
  ben = await insertId(
    "INSERT INTO staff (tenant_id, name) VALUES ($1, 'Ben') RETURNING id",
    [tenantId],
  );
  haircut = await insertId(
    "INSERT INTO services (tenant_id, name, duration_min, price_cents) VALUES ($1, 'Haircut', 45, 2800) RETURNING id",
    [tenantId],
  );
  colour = await insertId(
    "INSERT INTO services (tenant_id, name, duration_min, price_cents) VALUES ($1, 'Colour', 60, 9000) RETURNING id",
    [tenantId],
  );
});

async function insertId(sql: string, params: unknown[] = []) {
  const { rows } = await pool.query<{ id: string }>(sql, params);
  return rows[0]!.id;
}

/** weekday 1 = Monday */
function hours(staffId: string, start: string, end: string, weekday = 1) {
  return pool.query(
    "INSERT INTO working_hours (tenant_id, staff_id, weekday, start_time, end_time) VALUES ($1, $2, $3, $4, $5)",
    [tenantId, staffId, weekday, start, end],
  );
}

function book(staffId: string, from: string, to: string, status = "confirmed") {
  return pool.query(
    `INSERT INTO bookings (tenant_id, ref, staff_id, service_id, customer_name, customer_phone, during, status, source)
     VALUES ($1, $2, $3, $4, 'Customer', '+60123456789', tstzrange($5, $6), $7, 'online')`,
    [tenantId, generateRef(), staffId, haircut, kl(from), kl(to), status],
  );
}

/** the free slots as local "HH:MM" start times, which is how a person reads a schedule */
async function startTimes(
  serviceId: string,
  { earliest = LONG_AGO, staffId }: { earliest?: Date; staffId?: string } = {},
) {
  const slots = await findAvailableSlots({
    tenantId,
    serviceId,
    date: MONDAY,
    timezone: TZ,
    earliest,
    staffId,
  });
  return slots.map((s) =>
    s.start.toLocaleTimeString("en-GB", {
      timeZone: TZ,
      hour: "2-digit",
      minute: "2-digit",
    }),
  );
}

describe("findAvailableSlots", () => {
  it("steps by the service's length from the start of the range (the PRD example)", async () => {
    await hours(aina, "10:00", "13:00");

    const slots = await findAvailableSlots({
      tenantId,
      serviceId: haircut,
      date: MONDAY,
      timezone: TZ,
      earliest: LONG_AGO,
    });

    expect(slots).toEqual([
      { start: kl("10:00"), end: kl("10:45"), staffIds: [aina] },
      { start: kl("10:45"), end: kl("11:30"), staffIds: [aina] },
      { start: kl("11:30"), end: kl("12:15"), staffIds: [aina] },
      { start: kl("12:15"), end: kl("13:00"), staffIds: [aina] },
    ]);
    // stored as real instants: 10:00 in Kuala Lumpur is 02:00 UTC
    expect(slots[0]!.start.toISOString()).toBe("2030-01-07T02:00:00.000Z");
  });

  it("never crosses a break, and never runs past the end of a range", async () => {
    await hours(aina, "10:00", "13:00");
    await hours(aina, "14:00", "16:30");

    // 60 minutes: 12:00–13:00 fits, 13:00 is the break, 16:00–17:00 would run past 16:30
    expect(await startTimes(colour)).toEqual([
      "10:00",
      "11:00",
      "12:00",
      "14:00",
      "15:00",
    ]);
  });

  it("removes slots that overlap a live booking, but not a cancelled one", async () => {
    await hours(aina, "10:00", "13:00");
    await book(aina, "10:30", "11:15"); // overlaps both 10:00–10:45 and 10:45–11:30
    await book(aina, "12:15", "13:00", "cancelled");

    expect(await startTimes(haircut)).toEqual(["11:30", "12:15"]);
  });

  it("merges staff free at the same time, and can be limited to one person", async () => {
    await hours(aina, "10:00", "11:30");
    await hours(ben, "10:00", "11:30");
    await book(ben, "10:00", "10:45");

    const slots = await findAvailableSlots({
      tenantId,
      serviceId: haircut,
      date: MONDAY,
      timezone: TZ,
      earliest: LONG_AGO,
    });
    expect(slots.map((s) => s.staffIds)).toEqual([[aina], [aina, ben]]);

    expect(await startTimes(haircut, { staffId: ben })).toEqual(["10:45"]);
  });

  it("leaves out slots before `earliest`, removed staff, and other weekdays", async () => {
    await hours(aina, "10:00", "13:00");
    await hours(ben, "10:00", "13:00");
    await hours(aina, "14:00", "15:00", 2); // Tuesday: must not show up on a Monday
    await pool.query("UPDATE staff SET active = false WHERE id = $1", [ben]);

    const slots = await findAvailableSlots({
      tenantId,
      serviceId: haircut,
      date: MONDAY,
      timezone: TZ,
      earliest: kl("11:00"),
    });
    // whole slots, not just times: Ben's would fall at the same times as Aina's
    expect(slots).toEqual([
      { start: kl("11:30"), end: kl("12:15"), staffIds: [aina] },
      { start: kl("12:15"), end: kl("13:00"), staffIds: [aina] },
    ]);
  });
});
