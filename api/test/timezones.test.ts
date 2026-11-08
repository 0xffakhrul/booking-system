import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { asTenant } from "../src/db/tenant.js";
import { admin } from "./db.js";
import { addDays, localDate } from "../src/lib/time.js";
import { findAvailableSlots } from "../src/modules/availability/availability.repository.js";
import { getAvailability } from "../src/modules/availability/availability.service.js";
import { createBooking } from "../src/modules/bookings/bookings.service.js";
import type { Tenant } from "../src/modules/tenants/tenants.repository.js";
import { loggedInOwner } from "./helpers.js";

// The rule (docs/api.md): instants are stored as timestamptz and sent as UTC ISO 8601.
// Working hours and `date` are local to the business, and converted at the edges.

const app = createApp();

/** a business in `timezone`: one 60-minute service, one staff member working 09:00–12:00 every day */
async function business(timezone: string) {
  const { rows } = await admin.query<Tenant>(
    "INSERT INTO tenants (name, slug, timezone) VALUES ('Shop', 'shop', $1) RETURNING id, name, slug, timezone",
    [timezone],
  );
  const tenant = rows[0]!;
  const staffId = await insertId(
    "INSERT INTO staff (tenant_id, name) VALUES ($1, 'Aina') RETURNING id",
    [tenant.id],
  );
  const serviceId = await insertId(
    "INSERT INTO services (tenant_id, name, duration_min, price_cents) VALUES ($1, 'Haircut', $2, 2800) RETURNING id",
    [tenant.id, 60],
  );
  for (const weekday of [0, 1, 2, 3, 4, 5, 6]) {
    await admin.query(
      "INSERT INTO working_hours (tenant_id, staff_id, weekday, start_time, end_time) VALUES ($1, $2, $3, '09:00', '12:00')",
      [tenant.id, staffId, weekday],
    );
  }
  return { tenant, staffId, serviceId };
}

async function insertId(sql: string, params: unknown[]) {
  const { rows } = await admin.query<{ id: string }>(sql, params);
  return rows[0]!.id;
}

describe("timezones", () => {
  it("9:00 AM in Asia/Kuala_Lumpur is stored as 01:00 UTC", async () => {
    const owner = await loggedInOwner(app, "kedai-ali"); // Asia/Kuala_Lumpur by default
    const { body: s } = await owner
      .post("/api/services")
      .send({ name: "Haircut", durationMin: 45, price: 2800 });
    const { body: st } = await owner.post("/api/staff").send({ name: "Aina" });
    const hours = [0, 1, 2, 3, 4, 5, 6].map((weekday) => ({
      weekday,
      start: "08:00",
      end: "18:00",
    }));
    await owner.put(`/api/staff/${st.staff.id}/hours`).send({ hours });

    const day = addDays(localDate(new Date(), "Asia/Kuala_Lumpur"), 2);
    const book = (start: string) =>
      request(app).post("/api/public/kedai-ali/bookings").send({
        serviceId: s.service.id,
        staffId: st.staff.id,
        start,
        customerName: "Amir",
        customerPhone: "012-345 6789",
      });

    const res = await book(`${day}T09:00:00+08:00`);
    expect(res.status).toBe(201);
    expect(res.body.booking.start).toBe(`${day}T01:00:00.000Z`); // sent back in UTC

    // what Postgres actually holds: one instant, readable in any timezone
    const { rows } = await admin.query(
      `SELECT to_char(lower(during) AT TIME ZONE 'UTC', 'HH24:MI') AS utc,
              to_char(lower(during) AT TIME ZONE 'Asia/Kuala_Lumpur', 'HH24:MI') AS kl
         FROM bookings`,
    );
    expect(rows).toEqual([{ utc: "01:00", kl: "09:00" }]);

    // the same instant written in UTC is the same slot, so it collides
    expect((await book(`${day}T01:00:00Z`)).status).toBe(409);
    // no offset means no way to know which 09:00, so it's refused rather than guessed
    expect((await book(`${day}T09:00:00`)).status).toBe(400);
  });

  it("follows daylight saving: 09:00 in London is 09:00Z in winter, 08:00Z in summer", async () => {
    // UK clocks go forward on Sunday 2030-03-31
    const { tenant, serviceId } = await business("Europe/London");
    const firstSlot = async (date: string) =>
      (
        await asTenant(tenant.id, () =>
          findAvailableSlots({
            tenantId: tenant.id,
            serviceId,
            date,
            timezone: tenant.timezone,
            earliest: new Date(0),
          }),
        )
      )[0]!.start.toISOString();

    expect(await firstSlot("2030-03-29")).toBe("2030-03-29T09:00:00.000Z"); // Friday, GMT
    expect(await firstSlot("2030-04-01")).toBe("2030-04-01T08:00:00.000Z"); // Monday, BST
  });

  it("checks working hours in the business's local time, across a clock change", async () => {
    const { tenant, staffId, serviceId } = await business("Europe/London");
    const now = new Date("2030-03-30T12:00:00Z");
    const bookAt = (start: string) =>
      asTenant(tenant.id, () =>
        createBooking(
          tenant,
          {
            serviceId,
            staffId,
            start,
            customerName: "Amir",
            customerPhone: "+60123456789",
          },
          "online",
          now,
        ),
      );

    // 08:00Z on Monday 1 April is 09:00 BST: inside 09:00–12:00
    await expect(bookAt("2030-04-01T08:00:00Z")).resolves.toMatchObject({
      start: new Date("2030-04-01T08:00:00Z"),
    });
    // 07:00Z is 08:00 BST: before opening, even though it would be 09:00 in "GMT thinking"
    await expect(bookAt("2030-04-01T07:00:00Z")).rejects.toMatchObject({
      code: "OUTSIDE_WORKING_HOURS",
    });
  });

  it("counts 'today' in the business's calendar, not the server's", async () => {
    // Kiribati is UTC+14: at 12:00 UTC on 7 Jan it's already 02:00 on 8 Jan there
    const { tenant, serviceId } = await business("Pacific/Kiritimati");
    const now = new Date("2030-01-07T12:00:00Z");
    const check = (date: string) =>
      asTenant(tenant.id, () =>
        getAvailability(tenant, { serviceId, date }, now),
      );

    // still 7 Jan in UTC and in Kuala Lumpur, but yesterday for this business
    await expect(check("2030-01-07")).rejects.toMatchObject({
      code: "OUTSIDE_BOOKING_WINDOW",
    });
    await expect(check("2030-01-08")).resolves.toMatchObject({
      date: "2030-01-08",
    });
    await expect(check("2030-02-07")).resolves.toBeDefined(); // their today + 30
    await expect(check("2030-02-08")).rejects.toMatchObject({
      code: "OUTSIDE_BOOKING_WINDOW",
    });
  });
});
