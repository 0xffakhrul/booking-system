import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { loggedInOwner } from "./helpers.js";

const app = createApp();

// Two days ahead, so online bookings are allowed too (1-hour notice, 30-day window).
// Times carry +08:00, the shop's timezone (Asia/Kuala_Lumpur).
const day = new Date(Date.now() + 2 * 86_400_000).toISOString().slice(0, 10);
const at = (time: string, date = day) => `${date}T${time}:00+08:00`;
const iso = (time: string, date = day) =>
  new Date(at(time, date)).toISOString();

describe("POST /api/bookings (manual)", () => {
  let ali: Awaited<ReturnType<typeof loggedInOwner>>;
  let serviceId: string;
  let aina: string;
  let ben: string;

  beforeEach(async () => {
    ali = await loggedInOwner(app, "kedai-ali");
    serviceId = (
      await ali
        .post("/api/services")
        .send({ name: "Haircut", durationMin: 45, price: 2800 })
    ).body.service.id;
    [aina, ben] = (await Promise.all(
      ["Aina", "Ben"].map(async (name) => {
        const id: string = (await ali.post("/api/staff").send({ name })).body
          .staff.id;
        // 09:00–18:00 every day, so the test doesn't depend on which weekday it runs
        const hours = [0, 1, 2, 3, 4, 5, 6].map((weekday) => ({
          weekday,
          start: "09:00",
          end: "18:00",
        }));
        await ali.put(`/api/staff/${id}/hours`).send({ hours });
        return id;
      }),
    )) as [string, string];
  });

  const fields = { customerName: "Pak Long", customerPhone: "012-345 6789" };
  const manual = (body: Record<string, unknown>) =>
    ali.post("/api/bookings").send({ serviceId, ...fields, ...body });
  const online = (body: Record<string, unknown>) =>
    request(app)
      .post("/api/public/kedai-ali/bookings")
      .send({ serviceId, ...fields, ...body });

  it("creates a manual booking, with the length from the service", async () => {
    const res = await manual({ staffId: aina, start: at("10:00") });

    expect(res.status).toBe(201);
    expect(res.body.booking).toMatchObject({
      staff: { id: aina, name: "Aina" },
      customerName: "Pak Long",
      customerPhone: "+60123456789",
      start: iso("10:00"),
      end: iso("10:45"),
      status: "confirmed",
      source: "manual",
    });
    // and it's on the owner's day
    const list = await ali.get(`/api/bookings?date=${day}`);
    expect(list.body.bookings).toHaveLength(1);
  });

  it("collides with an online booking, both ways", async () => {
    // online first, then a manual one on top of it
    await online({ staffId: aina, start: at("10:00") }).expect(201);
    const clash = await manual({ staffId: aina, start: at("10:15") });
    expect(clash.status).toBe(409);
    expect(clash.body.error.code).toBe("SLOT_TAKEN");

    // manual first, then an online one on top of it
    await manual({ staffId: aina, start: at("14:00") }).expect(201);
    const taken = await online({ staffId: aina, start: at("14:00") });
    expect(taken.status).toBe(409);

    // "anyone" online skips Aina's manual booking and gets Ben
    const anyone = await online({ start: at("14:00") });
    expect(anyone.status).toBe(201);
    expect(anyone.body.booking.staff.name).toBe("Ben");

    // back-to-back is fine
    await manual({ staffId: aina, start: at("14:45") }).expect(201);
  });

  it("skips the notice and window limits, for walk-ins and far-ahead phone bookings", async () => {
    // yesterday at 10:00: already started, so online it's TOO_SOON, but an owner can record it
    const yesterday = new Date(Date.now() - 86_400_000)
      .toISOString()
      .slice(0, 10);
    expect(
      (await online({ staffId: aina, start: at("10:00", yesterday) })).body
        .error.code,
    ).toBe("TOO_SOON");
    expect(
      (await manual({ staffId: aina, start: at("10:00", yesterday) })).status,
    ).toBe(201);

    // 60 days ahead: online refuses, manual is fine
    const far = new Date(Date.now() + 60 * 86_400_000)
      .toISOString()
      .slice(0, 10);
    expect(
      (await online({ staffId: aina, start: at("10:00", far) })).body.error
        .code,
    ).toBe("OUTSIDE_BOOKING_WINDOW");
    expect(
      (await manual({ staffId: aina, start: at("10:00", far) })).status,
    ).toBe(201);
  });

  it("still checks working hours and removed services or staff", async () => {
    const late = await manual({ staffId: aina, start: at("17:30") }); // runs past 18:00
    expect(late.status).toBe(422);
    expect(late.body.error.code).toBe("OUTSIDE_WORKING_HOURS");

    await ali.delete(`/api/staff/${ben}`);
    const removed = await manual({ staffId: ben, start: at("10:00") });
    expect(removed.status).toBe(422);
    expect(removed.body.error.code).toBe("INACTIVE_RESOURCE");
  });

  it("needs an owner login, its own business's ids and a full body", async () => {
    expect(
      (
        await request(app)
          .post("/api/bookings")
          .send({ serviceId, staffId: aina, start: at("10:00"), ...fields })
      ).status,
    ).toBe(401);

    const other = await loggedInOwner(app, "kedai-lain");
    const theirs = await other
      .post("/api/bookings")
      .send({ serviceId, staffId: aina, start: at("10:00"), ...fields });
    expect(theirs.status).toBe(404); // Ali's service isn't theirs

    const bad = await manual({
      staffId: aina,
      start: at("10:00"),
      customerPhone: "123",
    });
    expect(bad.status).toBe(400);
    expect(Object.keys(bad.body.error.fields)).toEqual(["customerPhone"]);
  });
});
