import { readFileSync } from "node:fs";
import request from "supertest";
import type { Response } from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { admin } from "./db.js";
import { loggedInOwner } from "./helpers.js";

// Two shops. Shop A's owner, and anyone on shop A's booking page, tries every route in
// docs/api.md against shop B's ids. Each attempt must get the expected status (404 whenever it
// names one of B's ids), a response with nothing of B's in it, and leave B's rows exactly as they
// were. (Roadmap Day 35, ADR-0003.)

const app = createApp();
const DAY = new Date(Date.now() + 3 * 86_400_000).toISOString().slice(0, 10); // in the booking window
const at = (time: string) => `${DAY}T${time}:00+08:00`;
const everyDay = [0, 1, 2, 3, 4, 5, 6].map((weekday) => ({
  weekday,
  start: "09:00",
  end: "18:00",
}));

// Words that only appear in shop B's data. None of them may show up in any response to A.
const B_SECRETS = [
  "Salon B",
  "Secret Facial",
  "Bella",
  "Customer of B",
  "+60199999999",
];

type Agent = Awaited<ReturnType<typeof loggedInOwner>>;
type Ids = { service: string; staff: string; booking: string };
let a: Agent; // shop A's owner
let mine: Ids; // shop A's own things, for requests that are valid apart from B's id
let theirs: Ids; // shop B's things, the targets
let bTenantId: string;

async function setUpShop(
  agent: Agent,
  prefix: string,
  staffName: string,
  customer: string,
  phone: string,
) {
  const service = (
    await agent
      .post("/api/services")
      .send({ name: `${prefix} Facial`, durationMin: 30, price: 5000 })
  ).body.service.id as string;
  const staff = (await agent.post("/api/staff").send({ name: staffName })).body
    .staff.id as string;
  await agent
    .put(`/api/staff/${staff}/hours`)
    .send({ hours: everyDay })
    .expect(200);
  const booking = (
    await agent
      .post("/api/bookings")
      .send({
        serviceId: service,
        staffId: staff,
        start: at("10:00"),
        customerName: customer,
        customerPhone: phone,
      })
      .expect(201)
  ).body.booking.id as string;
  return { service, staff, booking };
}

/** every row of shop B's, in every tenant table, to compare before and after */
async function snapshotOfB() {
  const rows: Record<string, unknown[]> = {};
  for (const table of ["services", "staff", "working_hours", "bookings"])
    rows[table] = (
      await admin.query(
        `SELECT * FROM ${table} WHERE tenant_id = $1 ORDER BY id`,
        [bTenantId],
      )
    ).rows;
  return rows;
}

beforeEach(async () => {
  const b = await loggedInOwner(app, "salon-b");
  theirs = await setUpShop(
    b,
    "Secret",
    "Bella",
    "Customer of B",
    "019-999 9999",
  );
  // an online booking too, made by one of B's customers
  await request(app)
    .post("/api/public/salon-b/bookings")
    .send({
      serviceId: theirs.service,
      staffId: theirs.staff,
      start: at("14:00"),
      customerName: "Customer of B",
      customerPhone: "019-999 9999",
    })
    .expect(201);
  bTenantId = (
    await admin.query<{ id: string }>(
      "SELECT id::text FROM tenants WHERE slug = 'salon-b'",
    )
  ).rows[0]!.id;

  a = await loggedInOwner(app, "kedai-a");
  mine = await setUpShop(a, "Kedai", "Amin", "Customer of A", "012-345 6789");
});

const pub = () => request(app); // a visitor on shop A's public booking page, no login

/** One attempt per route in docs/api.md. Keys are "METHOD /path" exactly as the docs list them. */
type Attack = {
  name: string;
  status: number;
  attempt: () => Promise<Response>;
};
const ATTACKS: Record<string, Attack[]> = {
  "GET /api/health": [
    {
      name: "says nothing about any shop",
      status: 200,
      attempt: () => pub().get("/api/health"),
    },
  ],
  "POST /api/auth/register": [
    {
      name: "can't take B's slug",
      status: 409,
      attempt: () =>
        pub().post("/api/auth/register").send({
          businessName: "Fake B",
          slug: "salon-b",
          email: "x@x.example.com",
          password: "correct-horse-battery",
        }),
    },
  ],
  "POST /api/auth/login": [
    {
      name: "can't log in as B's owner without the password",
      status: 401,
      attempt: () =>
        pub().post("/api/auth/login").send({
          email: "owner@salon-b.example.com",
          password: "wrong-password-123",
        }),
    },
  ],
  "POST /api/auth/logout": [
    {
      name: "only ends A's own session",
      status: 204,
      attempt: () => a.post("/api/auth/logout"),
    },
  ],
  "GET /api/auth/me": [
    { name: "is A, not B", status: 200, attempt: () => a.get("/api/auth/me") },
  ],

  "GET /api/services": [
    {
      name: "lists only A's",
      status: 200,
      attempt: () => a.get("/api/services"),
    },
    {
      name: "lists only A's, removed ones included",
      status: 200,
      attempt: () => a.get("/api/services?includeInactive=true"),
    },
  ],
  "POST /api/services": [
    {
      name: "creates A's own, whatever the body says",
      status: 201,
      attempt: () =>
        a.post("/api/services").send({
          name: "New",
          durationMin: 30,
          price: 100,
          tenantId: bTenantId,
        }),
    },
  ],
  "PATCH /api/services/:id": [
    {
      name: "can't edit B's",
      status: 404,
      attempt: () =>
        a.patch(`/api/services/${theirs.service}`).send({ name: "Hacked" }),
    },
  ],
  "DELETE /api/services/:id": [
    {
      name: "can't remove B's",
      status: 404,
      attempt: () => a.delete(`/api/services/${theirs.service}`),
    },
  ],

  "GET /api/staff": [
    { name: "lists only A's", status: 200, attempt: () => a.get("/api/staff") },
    {
      name: "lists only A's, removed ones included",
      status: 200,
      attempt: () => a.get("/api/staff?includeInactive=true"),
    },
  ],
  "POST /api/staff": [
    {
      name: "creates A's own, whatever the body says",
      status: 201,
      attempt: () =>
        a.post("/api/staff").send({ name: "New", tenantId: bTenantId }),
    },
  ],
  "PATCH /api/staff/:id": [
    {
      name: "can't rename B's",
      status: 404,
      attempt: () =>
        a.patch(`/api/staff/${theirs.staff}`).send({ name: "Hacked" }),
    },
  ],
  "DELETE /api/staff/:id": [
    {
      name: "can't remove B's",
      status: 404,
      attempt: () => a.delete(`/api/staff/${theirs.staff}`),
    },
  ],
  "GET /api/staff/:id/hours": [
    {
      name: "can't read B's hours",
      status: 404,
      attempt: () => a.get(`/api/staff/${theirs.staff}/hours`),
    },
  ],
  "PUT /api/staff/:id/hours": [
    {
      name: "can't replace B's hours",
      status: 404,
      attempt: () =>
        a.put(`/api/staff/${theirs.staff}/hours`).send({ hours: [] }),
    },
  ],

  "GET /api/bookings": [
    {
      name: "shows only A's day",
      status: 200,
      attempt: () => a.get(`/api/bookings?date=${DAY}`),
    },
  ],
  "POST /api/bookings": [
    {
      name: "can't book B's service",
      status: 404,
      attempt: () =>
        a.post("/api/bookings").send({
          serviceId: theirs.service,
          staffId: mine.staff,
          start: at("15:00"),
          customerName: "X",
          customerPhone: "0123456789",
        }),
    },
    {
      name: "can't book B's staff",
      status: 404,
      attempt: () =>
        a.post("/api/bookings").send({
          serviceId: mine.service,
          staffId: theirs.staff,
          start: at("15:00"),
          customerName: "X",
          customerPhone: "0123456789",
        }),
    },
  ],
  "PATCH /api/bookings/:id": [
    {
      name: "can't cancel B's",
      status: 404,
      attempt: () =>
        a
          .patch(`/api/bookings/${theirs.booking}`)
          .send({ status: "cancelled" }),
    },
    {
      name: "can't move B's",
      status: 404,
      attempt: () =>
        a.patch(`/api/bookings/${theirs.booking}`).send({ start: at("16:00") }),
    },
    {
      name: "can't move A's onto B's staff",
      status: 404,
      attempt: () =>
        a
          .patch(`/api/bookings/${mine.booking}`)
          .send({ start: at("16:00"), staffId: theirs.staff }),
    },
  ],

  "GET /api/public/:slug": [
    {
      name: "A's page shows only A",
      status: 200,
      attempt: () => pub().get("/api/public/kedai-a"),
    },
  ],
  "GET /api/public/:slug/availability": [
    {
      name: "not for B's service on A's page",
      status: 404,
      attempt: () =>
        pub().get(
          `/api/public/kedai-a/availability?serviceId=${theirs.service}&date=${DAY}`,
        ),
    },
    {
      name: "not for B's staff on A's page",
      status: 404,
      attempt: () =>
        pub().get(
          `/api/public/kedai-a/availability?serviceId=${mine.service}&staffId=${theirs.staff}&date=${DAY}`,
        ),
    },
  ],
  "POST /api/public/:slug/bookings": [
    {
      name: "can't book B's service on A's page",
      status: 404,
      attempt: () =>
        pub()
          .post("/api/public/kedai-a/bookings")
          .send({
            serviceId: theirs.service,
            start: at("15:00"),
            customerName: "X",
            customerPhone: "0123456789",
          }),
    },
    {
      name: "can't book B's staff on A's page",
      status: 404,
      attempt: () =>
        pub()
          .post("/api/public/kedai-a/bookings")
          .send({
            serviceId: mine.service,
            staffId: theirs.staff,
            start: at("15:00"),
            customerName: "X",
            customerPhone: "0123456789",
          }),
    },
  ],
};

describe("tenant isolation: shop A against shop B", () => {
  const cases = Object.entries(ATTACKS).flatMap(([route, attacks]) =>
    attacks.map((attack) => ({ route, ...attack })),
  );

  it.each(cases)("$route $name ($status)", async ({ attempt, status }) => {
    const before = await snapshotOfB();

    const res = await attempt();

    // the exact status: a 403 instead of a 404 would confirm that B's id exists
    expect(res.status).toBe(status);
    // and nothing of B's in the response
    const body = JSON.stringify(res.body ?? "");
    for (const secret of B_SECRETS)
      expect(body, `leaked "${secret}"`).not.toContain(secret);
    for (const id of [theirs.service, theirs.staff, theirs.booking])
      expect(body).not.toMatch(new RegExp(`"id":"${id}"`));
    // and nothing of B's changed
    expect(await snapshotOfB()).toEqual(before);
  });
});

describe("the attack list", () => {
  it("covers every route in docs/api.md, so a new route can't be left out", () => {
    const docs = readFileSync(
      new URL("../../docs/api.md", import.meta.url),
      "utf8",
    );
    const current = docs.split("## Added later")[0]!; // planned routes come later
    const documented = [
      ...current.matchAll(/^\| (GET|POST|PUT|PATCH|DELETE) \| `([^`?]+)/gm),
    ].map(([, method, path]) => `${method} ${path}`);
    expect(documented.length).toBeGreaterThan(15);
    expect(Object.keys(ATTACKS).sort()).toEqual(
      [...new Set(documented)].sort(),
    );
  });
});
