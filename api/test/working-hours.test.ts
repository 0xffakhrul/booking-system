import { beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { loggedInOwner } from "./helpers.js";

const app = createApp();

const week = [
  { weekday: 1, start: "14:00", end: "18:00" },
  { weekday: 1, start: "10:00", end: "13:00" }, // a lunch break between the two
  { weekday: 2, start: "10:00", end: "18:00" },
];

describe("working hours API", () => {
  let ali: Awaited<ReturnType<typeof loggedInOwner>>;
  let staffId: string;
  let url: string;

  beforeEach(async () => {
    ali = await loggedInOwner(app, "kedai-ali");
    const { body } = await ali.post("/api/staff").send({ name: "Ali" });
    staffId = body.staff.id;
    url = `/api/staff/${staffId}/hours`;
  });

  it("starts empty", async () => {
    const res = await ali.get(url);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ hours: [] });
  });

  it("saves a week and returns it sorted by day and time", async () => {
    const res = await ali.put(url).send({ hours: week });
    expect(res.status).toBe(200);
    const sorted = [week[1], week[0], week[2]];
    expect(res.body.hours).toEqual(sorted);
    expect((await ali.get(url)).body.hours).toEqual(sorted);
  });

  it("a new week fully replaces the old one", async () => {
    await ali.put(url).send({ hours: week });
    const friday = [{ weekday: 5, start: "09:00", end: "12:00" }];

    const res = await ali.put(url).send({ hours: friday });
    expect(res.body.hours).toEqual(friday);
    expect((await ali.get(url)).body.hours).toEqual(friday);
  });

  it("an empty list clears the week", async () => {
    await ali.put(url).send({ hours: week });
    const res = await ali.put(url).send({ hours: [] });
    expect(res.body.hours).toEqual([]);
  });

  it("rejects bad ranges", async () => {
    const bad = [
      { weekday: 1, start: "13:00", end: "10:00" }, // ends before it starts
      { weekday: 7, start: "10:00", end: "11:00" }, // no day 7
      { weekday: 2, start: "9:00", end: "11:00" }, // not zero-padded
    ];
    const res = await ali.put(url).send({ hours: bad });
    expect(res.status).toBe(400);
    expect(Object.keys(res.body.error.fields)).toEqual([
      "hours.0.end",
      "hours.1.weekday",
      "hours.2.start",
    ]);
  });

  it("rejects overlaps on the same day, but allows back-to-back and other days", async () => {
    const overlap = await ali.put(url).send({
      hours: [
        { weekday: 1, start: "10:00", end: "13:00" },
        { weekday: 1, start: "12:00", end: "15:00" },
      ],
    });
    expect(overlap.status).toBe(400);
    expect(overlap.body.error.fields).toHaveProperty("hours.1");

    const ok = await ali.put(url).send({
      hours: [
        { weekday: 1, start: "10:00", end: "13:00" },
        { weekday: 1, start: "13:00", end: "15:00" },
        { weekday: 2, start: "12:00", end: "15:00" },
      ],
    });
    expect(ok.status).toBe(200);
  });

  it("a rejected week leaves the saved one untouched", async () => {
    await ali.put(url).send({ hours: week });
    await ali
      .put(url)
      .send({ hours: [{ weekday: 1, start: "13:00", end: "10:00" }] });
    expect((await ali.get(url)).body.hours).toHaveLength(3);
  });

  it("saves at the same moment take turns instead of clashing", async () => {
    // five different Monday schedules, all overlapping each other
    const weeks = ["10:00", "10:15", "10:30", "10:45", "11:00"].map((start) => [
      { weekday: 1, start, end: "13:00" },
    ]);

    const results = await Promise.all(
      weeks.map((hours) => ali.put(url).send({ hours })),
    );
    expect(results.map((r) => r.status)).toEqual([200, 200, 200, 200, 200]);

    // whichever saved last wins, but it's one whole week, never a mix
    const saved = (await ali.get(url)).body.hours;
    expect(weeks).toContainEqual(saved);
  });

  it("404s for unknown or malformed staff ids", async () => {
    expect((await ali.get("/api/staff/999999/hours")).status).toBe(404);
    expect((await ali.get("/api/staff/abc/hours")).status).toBe(404);
    expect(
      (await ali.put("/api/staff/999999/hours").send({ hours: [] })).status,
    ).toBe(404);
  });

  it("keeps businesses apart: another owner can't read or change these hours", async () => {
    await ali.put(url).send({ hours: week });
    const siti = await loggedInOwner(app, "salon-siti");

    expect((await siti.get(url)).status).toBe(404);
    expect((await siti.put(url).send({ hours: [] })).status).toBe(404);
    expect((await ali.get(url)).body.hours).toHaveLength(3);
  });
});
