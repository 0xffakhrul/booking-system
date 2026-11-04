import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { pool } from "../src/db/pool.js";
import { generateRef } from "../src/modules/bookings/refs.js";
import { loggedInOwner } from "./helpers.js";

const app = createApp();

// A fixed Monday, with bookings written straight into the table so their times are exact
const MONDAY = "2030-01-07";
const kl = (date: string, time: string) => `${date}T${time}:00+08:00`;
const iso = (date: string, time: string) =>
  new Date(kl(date, time)).toISOString();

describe("GET /api/bookings?date=", () => {
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
    aina = (await ali.post("/api/staff").send({ name: "Aina" })).body.staff.id;
    ben = (await ali.post("/api/staff").send({ name: "Ben" })).body.staff.id;
    tenantId = (
      await pool.query<{ id: string }>(
        "SELECT id FROM tenants WHERE slug = 'kedai-ali'",
      )
    ).rows[0]!.id;
  });

  function book(
    staffId: string,
    date: string,
    time: string,
    { status = "confirmed", tenant = tenantId, service = serviceId } = {},
  ) {
    return pool.query(
      `INSERT INTO bookings (tenant_id, ref, staff_id, service_id, customer_name, customer_phone, during, status, source)
       VALUES ($1, $2, $3, $4, 'Amir', '+60123456789',
               tstzrange($5::timestamptz, $5::timestamptz + interval '45 minutes'), $6, 'online')`,
      [tenant, generateRef(), staffId, service, kl(date, time), status],
    );
  }

  it("returns the day's bookings, midnight to midnight in the business's timezone", async () => {
    await book(aina, MONDAY, "07:30"); // 23:30 UTC on Sunday, but Monday in KL
    await book(ben, MONDAY, "09:00");
    await book(aina, MONDAY, "09:00", { status: "cancelled" });
    await book(aina, "2030-01-06", "23:00"); // Sunday in KL
    await book(aina, "2030-01-08", "00:15"); // Tuesday in KL, though still Monday in UTC

    const res = await ali.get(`/api/bookings?date=${MONDAY}`);

    expect(res.status).toBe(200);
    // by start time; at the same time, by staff member
    expect(
      res.body.bookings.map(
        (b: { start: string; staff: { name: string }; status: string }) =>
          `${b.start} ${b.staff.name} ${b.status}`,
      ),
    ).toEqual([
      `${iso(MONDAY, "07:30")} Aina confirmed`,
      `${iso(MONDAY, "09:00")} Aina cancelled`, // cancelled ones are listed too
      `${iso(MONDAY, "09:00")} Ben confirmed`,
    ]);
    expect(res.body.bookings[0]).toEqual({
      id: expect.any(String),
      ref: expect.stringMatching(/^[A-HJKMNP-Z2-9]{8}$/),
      service: { id: serviceId, name: "Haircut", durationMin: 45 },
      staff: { id: aina, name: "Aina" },
      customerName: "Amir",
      customerPhone: "+60123456789", // owners do see the phone number
      start: iso(MONDAY, "07:30"),
      end: iso(MONDAY, "08:15"),
      status: "confirmed",
      source: "online",
    });
  });

  it("only shows this business's bookings", async () => {
    const other = await loggedInOwner(app, "kedai-lain");
    const otherService = (
      await other
        .post("/api/services")
        .send({ name: "Perm", durationMin: 90, price: 9000 })
    ).body.service.id;
    const otherStaff = (await other.post("/api/staff").send({ name: "Zul" }))
      .body.staff.id;
    const otherTenant = (
      await pool.query<{ id: string }>(
        "SELECT id FROM tenants WHERE slug = 'kedai-lain'",
      )
    ).rows[0]!.id;
    await book(otherStaff, MONDAY, "10:00", {
      tenant: otherTenant,
      service: otherService,
    });

    const res = await ali.get(`/api/bookings?date=${MONDAY}`);
    expect(res.body.bookings).toEqual([]);
  });

  it("needs an owner login and a real date", async () => {
    expect(
      (await request(app).get(`/api/bookings?date=${MONDAY}`)).status,
    ).toBe(401);

    const bad = await ali.get("/api/bookings?date=2030-02-30");
    expect(bad.status).toBe(400);
    expect(Object.keys(bad.body.error.fields)).toEqual(["date"]);
    expect((await ali.get("/api/bookings")).status).toBe(400);
  });
});
