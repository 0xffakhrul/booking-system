import express from "express";
import pg from "pg";
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { checkAppRole, ensureAppRole } from "../src/db/app-role.js";
import { pool } from "../src/db/pool.js";
import { asTenant, currentDb } from "../src/db/tenant.js";
import { withTransaction } from "../src/db/transaction.js";
import { ConflictError } from "../src/lib/errors.js";
import { errorHandler } from "../src/middleware/error-handler.js";
import { tenantTransaction } from "../src/middleware/tenant-transaction.js";
import { admin } from "./db.js";
import { loggedInOwner } from "./helpers.js";

// ADR-0003. `pool` is the API's own user (tempah_app); `admin` skips RLS and sees everything.

const NO_TENANT = /app\.tenant_id|invalid input syntax for type bigint/;

let ali: string;
let mei: string;

beforeEach(async () => {
  const tenant = async (name: string, slug: string) =>
    (
      await admin.query<{ id: string }>(
        "INSERT INTO tenants (name, slug) VALUES ($1, $2) RETURNING id::text",
        [name, slug],
      )
    ).rows[0]!.id;
  ali = await tenant("Kedai Ali", "kedai-ali");
  mei = await tenant("Salon Mei", "salon-mei");
  await admin.query(
    `INSERT INTO services (tenant_id, name, duration_min, price_cents) VALUES
       ($1, 'Haircut', 30, 2000), ($1, 'Beard trim', 15, 1000),
       ($2, 'Hair colour', 90, 12000), ($2, 'Blow dry', 30, 4000), ($2, 'Manicure', 45, 5000)`,
    [ali, mei],
  );
});

const names = (rows: { name: string }[]) => rows.map((r) => r.name).sort();

describe("the API's database user", () => {
  it("can't skip Row-Level Security, and the startup check knows the difference", async () => {
    await expect(checkAppRole(pool)).resolves.toBeUndefined();
    await expect(checkAppRole(admin)).rejects.toThrow(
      /skips Row-Level Security/,
    );
  });

  it("is never an admin: setup refuses to turn one into the API's user", async () => {
    const client = new pg.Client({
      connectionString: process.env.MIGRATION_DATABASE_URL,
    });
    await client.connect();
    try {
      await expect(
        ensureAppRole(client, process.env.MIGRATION_DATABASE_URL!),
      ).rejects.toThrow(/admin user/);
    } finally {
      await client.end();
    }
  });
});

describe("services, with Row-Level Security", () => {
  it("can't be read without a tenant: it fails instead of showing everyone's", async () => {
    await expect(pool.query("SELECT * FROM services")).rejects.toThrow(
      NO_TENANT,
    );
  });

  it("shows only the tenant's own rows, with no WHERE in the query", async () => {
    const as = (tenantId: string) =>
      asTenant(tenantId, async () =>
        names(
          (
            await currentDb().query<{ name: string }>(
              "SELECT name FROM services",
            )
          ).rows,
        ),
      );
    expect(await as(ali)).toEqual(["Beard trim", "Haircut"]);
    expect(await as(mei)).toEqual(["Blow dry", "Hair colour", "Manicure"]);
  });

  it("refuses to write a row for another tenant (WITH CHECK)", async () => {
    await expect(
      asTenant(mei, () =>
        currentDb().query(
          "INSERT INTO services (tenant_id, name, duration_min, price_cents) VALUES ($1, 'Sneaky', 30, 0)",
          [ali],
        ),
      ),
    ).rejects.toThrow(/row-level security/);
    // and it can't change or delete what it can't see
    await asTenant(mei, async () => {
      const update = await currentDb().query(
        "UPDATE services SET price_cents = 0 WHERE tenant_id = $1",
        [ali],
      );
      expect(update.rowCount).toBe(0);
    });
  });

  it("GET /api/services relies on RLS alone and still shows only the owner's own", async () => {
    // listServices has no tenant_id filter on purpose (services.repository.ts)
    const app = createApp();
    const owner = await loggedInOwner(app, "kedai-baru");
    await owner
      .post("/api/services")
      .send({ name: "Fade", durationMin: 30, price: 2500 });

    const res = await owner.get("/api/services");
    expect(names(res.body.services)).toEqual(["Fade"]); // not Ali's or Mei's

    const page = await request(app).get("/api/public/salon-mei");
    expect(names(page.body.services)).toEqual([
      "Blow dry",
      "Hair colour",
      "Manicure",
    ]);
  });
});

describe("the per-request transaction", () => {
  // a tiny app with just the middleware, so a route can write and then fail on purpose
  const app = express();
  app.use((req, _res, next) => {
    req.tenantId = String(req.headers["x-tenant"]);
    next();
  });
  app.use(tenantTransaction);
  const insert = (tenantId: string | null, name: string) =>
    currentDb().query(
      "INSERT INTO services (tenant_id, name, duration_min, price_cents) VALUES ($1, $2, 30, 1000)",
      [tenantId, name],
    );
  app.post("/ok", async (req, res) => {
    await insert(req.tenantId, "Saved");
    res.status(201).json({ ok: true });
  });
  app.post("/fails", async (req) => {
    await insert(req.tenantId, "Rolled back");
    throw new ConflictError("SLOT_TAKEN", "someone got there first");
  });
  app.post("/retries", async (req, res) => {
    // a nested transaction that fails is only a savepoint: the request carries on
    await withTransaction(() => insert(mei, "Wrong shop")).catch(() => {});
    await insert(req.tenantId, "After the savepoint");
    res.status(201).json({ ok: true });
  });
  app.use(errorHandler);

  const count = async (name: string) =>
    (
      await admin.query<{ n: number }>(
        "SELECT count(*)::int AS n FROM services WHERE name = $1",
        [name],
      )
    ).rows[0]!.n;

  it("has committed by the time the response arrives", async () => {
    await request(app).post("/ok").set("x-tenant", ali).expect(201);
    expect(await count("Saved")).toBe(1);
  });

  it("rolls back everything when the response is an error", async () => {
    const res = await request(app).post("/fails").set("x-tenant", ali);
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("SLOT_TAKEN");
    expect(await count("Rolled back")).toBe(0);
  });

  it("turns nested transactions into savepoints, so one failure doesn't spoil the request", async () => {
    await request(app).post("/retries").set("x-tenant", ali).expect(201);
    expect(await count("Wrong shop")).toBe(0); // refused by WITH CHECK, rolled back to the savepoint
    expect(await count("After the savepoint")).toBe(1);
  });

  it("can't switch tenants halfway through", async () => {
    await expect(
      asTenant(ali, () => asTenant(mei, async () => "nope")),
    ).rejects.toThrow(/different tenant/);
  });
});
