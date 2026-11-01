import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { pool } from "../src/db/pool.js";
import { loggedInOwner } from "./helpers.js";

const app = createApp();
const url = "/api/public/kedai-ali/bookings";

// Two days ahead: always past the 1-hour notice and inside the 30-day window.
// Times carry +08:00, the shop's timezone (Asia/Kuala_Lumpur).
const day = new Date(Date.now() + 2 * 86_400_000).toISOString().slice(0, 10);
const at = (time: string) => `${day}T${time}:00+08:00`;

describe("POST /api/public/:slug/bookings", () => {
  let serviceId: string;
  let aina: string;
  let ben: string;

  beforeEach(async () => {
    const owner = await loggedInOwner(app, "kedai-ali");
    const service = await owner
      .post("/api/services")
      .send({ name: "Haircut", durationMin: 45, price: 2800 });
    serviceId = service.body.service.id;

    [aina, ben] = (await Promise.all(
      ["Aina", "Ben"].map(async (name) => {
        const { body } = await owner.post("/api/staff").send({ name });
        // 09:00–18:00 every day, so the test doesn't depend on which weekday it runs
        const hours = [0, 1, 2, 3, 4, 5, 6].map((weekday) => ({
          weekday,
          start: "09:00",
          end: "18:00",
        }));
        await owner.put(`/api/staff/${body.staff.id}/hours`).send({ hours });
        return body.staff.id as string;
      }),
    )) as [string, string];
  });

  const book = (fields: Record<string, unknown>) =>
    request(app)
      .post(url)
      .send({
        serviceId,
        customerName: "Amir",
        customerPhone: "012-345 6789",
        ...fields,
      });

  it("201: books the slot and returns the ref, not the id or phone", async () => {
    const res = await book({ staffId: aina, start: at("10:00") });

    expect(res.status).toBe(201);
    expect(res.body.booking).toEqual({
      ref: expect.stringMatching(/^[A-HJKMNP-Z2-9]{8}$/),
      service: { id: serviceId, name: "Haircut", durationMin: 45 },
      staff: { id: aina, name: "Aina" },
      customerName: "Amir",
      start: new Date(at("10:00")).toISOString(),
      end: new Date(at("10:45")).toISOString(), // + the service's 45 minutes
      status: "confirmed",
      source: "online",
    });

    const { rows } = await pool.query("SELECT customer_phone FROM bookings");
    expect(rows[0].customer_phone).toBe("+60123456789"); // stored as E.164
  });

  it("409: the same staff member at an overlapping time", async () => {
    await book({ staffId: aina, start: at("10:00") }).expect(201);

    const res = await book({ staffId: aina, start: at("10:30") });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("SLOT_TAKEN");

    // back-to-back is fine
    await book({ staffId: aina, start: at("10:45") }).expect(201);
  });

  it('"anyone" gets the next free staff member, then 409 when nobody is left', async () => {
    await book({ staffId: aina, start: at("10:00") }).expect(201);

    const second = await book({ start: at("10:00") });
    expect(second.status).toBe(201);
    expect(second.body.booking.staff.id).toBe(ben);

    const third = await book({ start: at("10:00") });
    expect(third.status).toBe(409);
    expect(third.body.error.code).toBe("SLOT_TAKEN");
  });

  it("422: must fit inside working hours", async () => {
    const res = await book({ staffId: aina, start: at("17:30") }); // would end 18:15
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe("OUTSIDE_WORKING_HOURS");
  });

  it("422: at least 1 hour ahead, at most 30 days ahead", async () => {
    const soon = new Date(Date.now() + 30 * 60_000).toISOString();
    const tooSoon = await book({ staffId: aina, start: soon });
    expect(tooSoon.body.error.code).toBe("TOO_SOON");

    const far = new Date(Date.now() + 40 * 86_400_000).toISOString();
    const tooFar = await book({ staffId: aina, start: far });
    expect(tooFar.body.error.code).toBe("OUTSIDE_BOOKING_WINDOW");
  });

  it("400 for bad input, 404 for an unknown business", async () => {
    const bad = await book({ start: "tomorrow", customerPhone: "abc" });
    expect(bad.status).toBe(400);
    expect(Object.keys(bad.body.error.fields).sort()).toEqual([
      "customerPhone",
      "start",
    ]);

    const unknown = await request(app)
      .post("/api/public/nobody-here/bookings")
      .send({});
    expect(unknown.status).toBe(404);
  });
});
