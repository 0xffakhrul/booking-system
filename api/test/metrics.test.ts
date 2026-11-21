import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { createMetricsServer } from "../src/metrics-server.js";
import { loggedInOwner } from "./helpers.js";

const app = createApp();
const metricsServer = createMetricsServer();
const url = "/api/public/kedai-ali/bookings";
const day = new Date(Date.now() + 2 * 86_400_000).toISOString().slice(0, 10);
const at = (time: string) => `${day}T${time}:00+08:00`;

/** Scrapes /metrics like Prometheus does and parses the text format */
async function scrape() {
  const res = await request(metricsServer).get("/metrics").expect(200);
  const samples = res.text
    .split("\n")
    .filter((line) => line && !line.startsWith("#"))
    .map((line) => {
      const [, name, labelText = "", value] =
        /^([a-zA-Z_:][\w:]*)(?:\{(.*)\})? (\S+)$/.exec(line)!;
      const labels = Object.fromEntries(
        [...labelText.matchAll(/(\w+)="((?:[^"\\]|\\.)*)"/g)].map((m) => [
          m[1],
          m[2],
        ]),
      );
      return { name, labels, value: Number(value) };
    });

  /** the value of the one series with exactly these labels, or undefined */
  const get = (name: string, labels: Record<string, string> = {}) =>
    samples.find(
      (s) =>
        s.name === name &&
        Object.keys(s.labels).length === Object.keys(labels).length &&
        Object.entries(labels).every(([k, v]) => s.labels[k] === v),
    )?.value;

  return { samples, get };
}

/** How much each series changed while `action` ran */
async function delta(
  action: () => Promise<unknown>,
  ...series: [string, Record<string, string>][]
) {
  const before = await scrape();
  await action();
  const after = await scrape();
  return series.map(
    ([name, labels]) =>
      (after.get(name, labels) ?? 0) - (before.get(name, labels) ?? 0),
  );
}

describe("GET /metrics", () => {
  it("serves the Prometheus text format, with every booking series starting at 0", async () => {
    const res = await request(metricsServer).get("/metrics").expect(200);
    expect(res.headers["content-type"]).toContain("text/plain");

    const { get } = await scrape();
    expect(get("bookings_created_total", { source: "online" })).toBe(0);
    expect(get("bookings_created_total", { source: "manual" })).toBe(0);
    for (const caught_by of ["check", "constraint"])
      expect(
        get("booking_conflicts_total", { operation: "create", caught_by }),
      ).toBe(0);
    expect(
      get("booking_conflicts_total", {
        operation: "move",
        caught_by: "constraint",
      }),
    ).toBe(0);
    expect(get("process_resident_memory_bytes")).toBeGreaterThan(0); // the defaults are on
  });

  it("serves only GET /metrics on its own port", async () => {
    await request(metricsServer).get("/").expect(404);
    await request(metricsServer).post("/metrics").expect(404);
  });

  it("isn't served by the public app", async () => {
    const res = await request(app).get("/metrics");
    expect(res.status).toBe(404);
    expect(res.text).not.toContain("bookings_created_total");
  });
});

describe("booking metrics", () => {
  let owner: Awaited<ReturnType<typeof loggedInOwner>>;
  let serviceId: string;
  let staffId: string;

  beforeEach(async () => {
    owner = await loggedInOwner(app, "kedai-ali");
    const service = await owner
      .post("/api/services")
      .send({ name: "Haircut", durationMin: 45, price: 2800 });
    serviceId = service.body.service.id;
    const staff = await owner.post("/api/staff").send({ name: "Aina" });
    staffId = staff.body.staff.id;
    const hours = [0, 1, 2, 3, 4, 5, 6].map((weekday) => ({
      weekday,
      start: "09:00",
      end: "18:00",
    }));
    await owner.put(`/api/staff/${staffId}/hours`).send({ hours }).expect(200);
  });

  const booking = (start: string) => ({
    serviceId,
    staffId,
    start,
    customerName: "Amir",
    customerPhone: "012-345 6789",
  });
  const book = (start: string) => request(app).post(url).send(booking(start));

  it("counts online and manual bookings by source", async () => {
    const [online, manual] = await delta(
      async () => {
        await book(at("10:00")).expect(201);
        await owner
          .post("/api/bookings")
          .send(booking(at("11:00")))
          .expect(201);
      },
      ["bookings_created_total", { source: "online" }],
      ["bookings_created_total", { source: "manual" }],
    );
    expect([online, manual]).toEqual([1, 1]);
  });

  it("counts a slot that already looked taken as caught by the check", async () => {
    await book(at("10:00")).expect(201);
    const [check, created] = await delta(
      () => book(at("10:30")).expect(409),
      ["booking_conflicts_total", { operation: "create", caught_by: "check" }],
      ["bookings_created_total", { source: "online" }],
    );
    expect([check, created]).toEqual([1, 0]);
  });

  it("counts every loser of a race, and one winner", async () => {
    const racers = 10;
    const [created, check = 0, constraint = 0] = await delta(
      async () => {
        const results = await Promise.all(
          Array.from({ length: racers }, () => book(at("14:00"))),
        );
        expect(results.filter((r) => r.status === 201)).toHaveLength(1);
      },
      ["bookings_created_total", { source: "online" }],
      ["booking_conflicts_total", { operation: "create", caught_by: "check" }],
      [
        "booking_conflicts_total",
        { operation: "create", caught_by: "constraint" },
      ],
    );
    expect(created).toBe(1);
    // which layer stops each loser depends on timing; together they're every loser
    expect(check + constraint).toBe(racers - 1);
  });

  it("counts a move into a taken slot", async () => {
    await book(at("10:00")).expect(201);
    const later = await book(at("12:00")).expect(201);
    const { body } = await owner.get(`/api/bookings?date=${day}`).expect(200);
    const id = body.bookings.find(
      (b: { ref: string }) => b.ref === later.body.booking.ref,
    ).id;

    const [moves] = await delta(
      () =>
        owner
          .patch(`/api/bookings/${id}`)
          .send({ start: at("10:15") })
          .expect(409),
      [
        "booking_conflicts_total",
        { operation: "move", caught_by: "constraint" },
      ],
    );
    expect(moves).toBe(1);
  });
});

describe("request metrics", () => {
  it("labels requests with the route pattern, never the real URL", async () => {
    const routes: [string, string, string][] = [
      ["POST", "/api/auth/register", "201"],
      ["PUT", "/api/staff/:staffId/hours", "200"],
      ["GET", "/api/public/:slug", "200"],
      ["POST", "/api/public/:slug/bookings", "400"], // an error thrown inside the route
      ["GET", "/api/bookings/*", "401"], // stopped by requireRole, before any route
      ["GET", "(unmatched)", "404"],
    ];
    let staffId = "";
    const counts = await delta(
      async () => {
        const owner = await loggedInOwner(app, "kedai-ali");
        const { body } = await owner.post("/api/staff").send({ name: "Aina" });
        staffId = body.staff.id;
        await owner
          .put(`/api/staff/${staffId}/hours`)
          .send({ hours: [] })
          .expect(200);
        await request(app).get("/api/public/kedai-ali").expect(200);
        await request(app).post(url).send({}).expect(400);
        await request(app).get("/api/bookings").expect(401);
        await request(app).get("/api/nope").expect(404);
      },
      ...routes.map(
        ([method, route, status_code]) =>
          [
            "http_request_duration_seconds_count",
            { method, route, status_code },
          ] as [string, Record<string, string>],
      ),
    );
    expect(counts).toEqual(routes.map(() => 1));

    // no slug or id ever becomes a label value
    const { samples } = await scrape();
    const routeLabels = samples.flatMap((s) => s.labels.route ?? []);
    expect(routeLabels.some((r) => r.includes("kedai-ali"))).toBe(false);
    expect(routeLabels.some((r) => r.split("/").includes(staffId))).toBe(false);
  });
});
