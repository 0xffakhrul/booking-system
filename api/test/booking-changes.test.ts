import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { admin } from "./db.js";
import { generateRef } from "../src/modules/bookings/refs.js";
import { loggedInOwner } from "./helpers.js";

const app = createApp();

// A fixed Monday far ahead. Owners aren't bound by the booking window, so this is fine.
const MONDAY = "2030-01-07";
const kl = (time: string, date = MONDAY) => `${date}T${time}:00+08:00`;
const iso = (time: string, date = MONDAY) =>
  new Date(kl(time, date)).toISOString();

describe("PATCH /api/bookings/:id", () => {
  let ali: Awaited<ReturnType<typeof loggedInOwner>>;
  let tenantId: string;
  let serviceId: string;
  let aina: string;
  let ben: string;

  beforeEach(async () => {
    ali = await loggedInOwner(app, "kedai-ali"); // Asia/Kuala_Lumpur
    serviceId = (
      await ali
        .post("/api/services")
        .send({ name: "Haircut", durationMin: 45, price: 2800 })
    ).body.service.id;
    [aina, ben] = (await Promise.all(
      ["Aina", "Ben"].map(async (name) => {
        const id: string = (await ali.post("/api/staff").send({ name })).body
          .staff.id;
        // Mondays 9:00–13:00 and 14:00–18:00
        await ali.put(`/api/staff/${id}/hours`).send({
          hours: [
            { weekday: 1, start: "09:00", end: "13:00" },
            { weekday: 1, start: "14:00", end: "18:00" },
          ],
        });
        return id;
      }),
    )) as [string, string];
    tenantId = (
      await admin.query<{ id: string }>(
        "SELECT id FROM tenants WHERE slug = 'kedai-ali'",
      )
    ).rows[0]!.id;
  });

  /** a 45-minute booking written straight into the table, returning its id */
  async function book(staffId: string, time: string, status = "confirmed") {
    const { rows } = await admin.query<{ id: string }>(
      `INSERT INTO bookings (tenant_id, ref, staff_id, service_id, customer_name, customer_phone, during, status, source)
       VALUES ($1, $2, $3, $4, 'Amir', '+60123456789',
               tstzrange($5::timestamptz, $5::timestamptz + interval '45 minutes'), $6, 'online')
       RETURNING id::text`,
      [tenantId, generateRef(), staffId, serviceId, kl(time), status],
    );
    return rows[0]!.id;
  }

  const move = (id: string, time: string, staffId?: string) =>
    ali.patch(`/api/bookings/${id}`).send({ start: kl(time), staffId });
  const cancel = (id: string) =>
    ali.patch(`/api/bookings/${id}`).send({ status: "cancelled" });

  it("cancels a booking, and the slot can be booked again", async () => {
    const first = await book(aina, "10:00");
    const other = await book(aina, "15:00");

    const res = await cancel(first);
    expect(res.status).toBe(200);
    expect(res.body.booking).toMatchObject({ id: first, status: "cancelled" });

    // the constraint's WHERE (status <> 'cancelled') frees 10:00 for someone else
    const moved = await move(other, "10:00");
    expect(moved.status).toBe(200);
    expect(moved.body.booking).toMatchObject({
      start: iso("10:00"),
      status: "confirmed",
    });

    // cancelling again changes nothing and isn't an error
    expect((await cancel(first)).body.booking.status).toBe("cancelled");
  });

  it("moves a booking to a free time, keeping its length", async () => {
    const id = await book(aina, "10:00");

    const res = await move(id, "15:30");

    expect(res.status).toBe(200);
    expect(res.body.booking).toMatchObject({
      id,
      staff: { id: aina, name: "Aina" },
      start: iso("15:30"),
      end: iso("16:15"),
      status: "confirmed",
    });
  });

  it("refuses to move into a taken slot with 409, and leaves the booking alone", async () => {
    await book(aina, "15:00");
    const id = await book(aina, "10:00");

    const res = await move(id, "15:30"); // 15:30–16:15 overlaps 15:00–15:45

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("SLOT_TAKEN");
    const day = await ali.get(`/api/bookings?date=${MONDAY}`);
    expect(
      day.body.bookings.find((b: { id: string }) => b.id === id).start,
    ).toBe(iso("10:00"));
  });

  it("can move a booking a little, overlapping its own old time", async () => {
    const id = await book(aina, "10:00");
    expect((await move(id, "10:15")).status).toBe(200); // 10:15–11:00 overlaps 10:00–10:45
  });

  it("moves to another staff member, keeping the booked length even if the service changed", async () => {
    const id = await book(aina, "10:00");
    await ali.patch(`/api/services/${serviceId}`).send({ durationMin: 60 });

    const res = await move(id, "11:00", ben);

    expect(res.status).toBe(200);
    expect(res.body.booking).toMatchObject({
      staff: { id: ben, name: "Ben" },
      start: iso("11:00"),
      end: iso("11:45"), // still 45 minutes: that's what the customer booked
    });
  });

  it("only lets one of two racing moves take a slot", async () => {
    const a = await book(aina, "09:00");
    const b = await book(aina, "16:00");

    const results = await Promise.all([move(a, "11:00"), move(b, "11:00")]);

    expect(results.map((r) => r.status).sort()).toEqual([200, 409]);
  });

  it("checks working hours, removed staff and cancelled bookings", async () => {
    const id = await book(aina, "10:00");

    const lunch = await move(id, "12:30"); // 12:30–13:15 runs into the 13:00 break
    expect(lunch.status).toBe(422);
    expect(lunch.body.error.code).toBe("OUTSIDE_WORKING_HOURS");

    await ali.delete(`/api/staff/${ben}`);
    const removed = await move(id, "10:00", ben);
    expect(removed.status).toBe(422);
    expect(removed.body.error.code).toBe("INACTIVE_RESOURCE");

    const gone = await book(aina, "16:00", "cancelled");
    const res = await move(gone, "17:00");
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe("BOOKING_CANCELLED");
  });

  it("can't touch another business's booking", async () => {
    const id = await book(aina, "10:00");
    const other = await loggedInOwner(app, "kedai-lain");

    expect(
      (await other.patch(`/api/bookings/${id}`).send({ status: "cancelled" }))
        .status,
    ).toBe(404);
    expect(
      (await other.patch(`/api/bookings/${id}`).send({ start: kl("11:00") }))
        .status,
    ).toBe(404);
    expect((await cancel("999999")).status).toBe(404);

    // and it's untouched
    const day = await ali.get(`/api/bookings?date=${MONDAY}`);
    expect(day.body.bookings[0]).toMatchObject({
      start: iso("10:00"),
      status: "confirmed",
    });
  });

  it("rejects bodies that aren't one of the two shapes", async () => {
    const id = await book(aina, "10:00");
    const send = (body: object) => ali.patch(`/api/bookings/${id}`).send(body);

    for (const body of [
      {},
      { status: "confirmed" },
      { status: "cancelled", start: kl("11:00") },
      { status: "cancelled", staffId: ben },
      { start: "tomorrow at 3" },
      { start: kl("11:00"), customerName: "Someone else" },
    ]) {
      const res = await send(body);
      expect(res.status, JSON.stringify(body)).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_FAILED");
    }
    expect(
      (await ali.patch("/api/bookings/abc").send({ status: "cancelled" }))
        .status,
    ).toBe(400);
    expect(
      (
        await request(app)
          .patch(`/api/bookings/${id}`)
          .send({ status: "cancelled" })
      ).status,
    ).toBe(401);
  });
});
