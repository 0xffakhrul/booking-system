import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { addDays, localDate } from "../src/lib/time.js";
import { loggedInOwner } from "./helpers.js";

// Every request here is a plain request(app): no cookie, like a customer opening the link
const app = createApp();
const TZ = "Asia/Kuala_Lumpur";
const today = localDate(new Date(), TZ);
const day = addDays(today, 2); // clear of the 1-hour notice whatever time the tests run
const iso = (time: string) => new Date(`${day}T${time}:00+08:00`).toISOString();

describe("public endpoints", () => {
  let haircut: string;
  let aina: string;
  let ben: string;
  let removedService: string;
  let removedStaff: string;

  beforeEach(async () => {
    const owner = await loggedInOwner(app, "kedai-ali");
    const add = async (path: string, body: object) =>
      (await owner.post(path).send(body)).body;

    haircut = (
      await add("/api/services", {
        name: "Haircut",
        durationMin: 45,
        price: 2800,
      })
    ).service.id;
    removedService = (
      await add("/api/services", { name: "Perm", durationMin: 90, price: 9000 })
    ).service.id;
    await owner.delete(`/api/services/${removedService}`);

    const hours = [0, 1, 2, 3, 4, 5, 6].map((weekday) => ({
      weekday,
      start: "09:00",
      end: "12:00",
    }));
    const addStaff = async (name: string) => {
      const { staff } = await add("/api/staff", { name });
      await owner.put(`/api/staff/${staff.id}/hours`).send({ hours });
      return staff.id as string;
    };
    aina = await addStaff("Aina");
    ben = await addStaff("Ben");
    removedStaff = await addStaff("Gone");
    await owner.delete(`/api/staff/${removedStaff}`);
  });

  const availability = (query: Record<string, string>) =>
    request(app).get("/api/public/kedai-ali/availability").query(query);

  it("GET /:slug shows the business with its active services and staff", async () => {
    const res = await request(app).get("/api/public/kedai-ali");

    expect(res.status).toBe(200);
    expect(res.body.business).toEqual({
      name: "Shop kedai-ali",
      slug: "kedai-ali",
      timezone: TZ,
    });
    expect(res.body.services.map((s: { name: string }) => s.name)).toEqual([
      "Haircut",
    ]);
    expect(res.body.staff).toEqual([
      { id: aina, name: "Aina" },
      { id: ben, name: "Ben" },
    ]);

    expect((await request(app).get("/api/public/nobody-here")).status).toBe(
      404,
    );
  });

  it("GET /:slug/availability lists free slots, and each one can be booked", async () => {
    const res = await availability({ serviceId: haircut, date: day });

    expect(res.status).toBe(200);
    expect(res.body.date).toBe(day);
    expect(res.body.timezone).toBe(TZ);
    expect(res.body.slots).toEqual(
      ["09:00", "09:45", "10:30", "11:15"].map((start, i) => ({
        start: iso(start),
        end: iso(["09:45", "10:30", "11:15", "12:00"][i]!),
        staffIds: [aina, ben],
      })),
    );

    // book the first slot with Aina, the way the booking page will
    const first = res.body.slots[0];
    const booked = await request(app)
      .post("/api/public/kedai-ali/bookings")
      .send({
        serviceId: haircut,
        staffId: aina,
        start: first.start,
        customerName: "Amir",
        customerPhone: "012-345 6789",
      });
    expect(booked.status).toBe(201);

    const after = await availability({ serviceId: haircut, date: day });
    expect(after.body.slots[0].staffIds).toEqual([ben]); // Aina is taken at 09:00

    const justAina = await availability({
      serviceId: haircut,
      date: day,
      staffId: aina,
    });
    expect(justAina.body.slots.map((s: { start: string }) => s.start)).toEqual([
      iso("09:45"),
      iso("10:30"),
      iso("11:15"),
    ]);
  });

  it("only allows dates from today to 30 days ahead, in the business's timezone", async () => {
    const check = async (date: string) =>
      (await availability({ serviceId: haircut, date })).status;

    expect(await check(addDays(today, -1))).toBe(422);
    expect(await check(today)).toBe(200);
    expect(await check(addDays(today, 30))).toBe(200);
    expect(await check(addDays(today, 31))).toBe(422);

    const res = await availability({
      serviceId: haircut,
      date: addDays(today, 31),
    });
    expect(res.body.error.code).toBe("OUTSIDE_BOOKING_WINDOW");
  });

  it("400 for a bad query, 404 for removed or unknown services and staff", async () => {
    const bad = await availability({ date: "2026-02-30" });
    expect(bad.status).toBe(400);
    expect(Object.keys(bad.body.error.fields).sort()).toEqual([
      "date",
      "serviceId",
    ]);

    expect(
      (await availability({ serviceId: removedService, date: day })).status,
    ).toBe(404);
    expect(
      (await availability({ serviceId: "999999", date: day })).status,
    ).toBe(404);
    expect(
      (
        await availability({
          serviceId: haircut,
          date: day,
          staffId: removedStaff,
        })
      ).status,
    ).toBe(404);
  });
});
