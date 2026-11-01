import pg from "pg";
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { pool } from "../src/db/pool.js";
import { generateRef } from "../src/modules/bookings/refs.js";
import { loggedInOwner } from "./helpers.js";

// ADR-0002's promise, tested: many customers press "Book" for the same slot at the same moment.
// Each test runs RUNS times in a row, because a race that loses 1 time in 5 would pass a single run.
const RACERS = 20;
const RUNS = 10;
// The raw-SQL race has no lock in front of it, so its losers deadlock and Postgres needs
// deadlock_timeout (1 s) to break each one. 10 racers, once, keeps CI quick.
const RAW_RACERS = 10;
// generous: a race can include Postgres breaking a deadlock, which takes deadlock_timeout (1 s)
const timeout = 30_000;

const app = createApp();
const url = "/api/public/kedai-ali/bookings";
const day = new Date(Date.now() + 2 * 86_400_000).toISOString().slice(0, 10);
const start = `${day}T10:00:00+08:00`;

describe("booking one slot concurrently", () => {
  let serviceId: string;
  let staffIds: string[];

  beforeEach(async () => {
    const owner = await loggedInOwner(app, "kedai-ali");
    const service = await owner
      .post("/api/services")
      .send({ name: "Haircut", durationMin: 45, price: 2800 });
    serviceId = service.body.service.id;

    const hours = [0, 1, 2, 3, 4, 5, 6].map((weekday) => ({
      weekday,
      start: "09:00",
      end: "18:00",
    }));
    staffIds = [];
    for (const name of ["Aina", "Ben", "Chong"]) {
      const { body } = await owner.post("/api/staff").send({ name });
      await owner.put(`/api/staff/${body.staff.id}/hours`).send({ hours });
      staffIds.push(body.staff.id);
    }
  });

  /** fires `count` identical booking requests at once and waits for all of them */
  const race = (count: number, staffId?: string) =>
    Promise.all(
      Array.from({ length: count }, (_, i) =>
        request(app)
          .post(url)
          .send({
            serviceId,
            staffId,
            start,
            customerName: `Racer ${i}`,
            customerPhone: "012-345 6789",
          }),
      ),
    );

  const countBookings = async () =>
    (await pool.query<{ n: number }>("SELECT count(*)::int AS n FROM bookings"))
      .rows[0]!.n;

  it(
    `${RACERS} requests for one staff member: exactly 1 succeeds, ${RACERS - 1} get 409`,
    { repeats: RUNS - 1, timeout },
    async () => {
      const results = await race(RACERS, staffIds[0]);

      const won = results.filter((r) => r.status === 201);
      const lost = results.filter((r) => r.status === 409);
      expect(won).toHaveLength(1);
      expect(lost).toHaveLength(RACERS - 1);
      expect(lost.every((r) => r.body.error.code === "SLOT_TAKEN")).toBe(true);
      expect(await countBookings()).toBe(1);
    },
  );

  it(
    `${RACERS} requests for "anyone" with 3 staff: exactly 3 succeed, one per person`,
    { repeats: RUNS - 1, timeout },
    async () => {
      const results = await race(RACERS);

      const won = results.filter((r) => r.status === 201);
      expect(won).toHaveLength(3);
      expect(results.filter((r) => r.status === 409)).toHaveLength(RACERS - 3);
      const winners = won.map((r) => r.body.booking.staff.id).sort();
      expect(winners).toEqual([...staffIds].sort());
      expect(await countBookings()).toBe(3);
    },
  );

  it(
    `the database on its own: ${RAW_RACERS} INSERTs on separate connections, exactly 1 commits`,
    { timeout },
    async () => {
      // No API here, so no "is it free?" check first: only the exclusion constraint stands in the way.
      // Every client connects first, so the INSERTs really do arrive together.
      const { rows } = await pool.query<{ id: string }>(
        "SELECT id FROM tenants",
      );
      const tenantId = rows[0]!.id;
      const clients = await Promise.all(
        Array.from({ length: RAW_RACERS }, async () => {
          const client = new pg.Client({
            connectionString: process.env.DATABASE_URL,
          });
          await client.connect();
          return client;
        }),
      );

      try {
        const results = await Promise.allSettled(
          clients.map((client) =>
            client.query(
              `INSERT INTO bookings (tenant_id, ref, staff_id, service_id, customer_name, customer_phone, during, source)
               VALUES ($1, $2, $3, $4, 'Racer', '+60123456789',
                       tstzrange($5::timestamptz, $5::timestamptz + interval '45 minutes'), 'online')`,
              [tenantId, generateRef(), staffIds[0], serviceId, start],
            ),
          ),
        );

        // Exactly one wins. The others fail with an overlap (23P01), or with a deadlock (40P01)
        // when two of them blocked each other and Postgres had to abort one. The API avoids
        // these with a row lock (ADR-0009); here, without it, you can see them happen.
        expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
        const codes = results
          .filter((r) => r.status === "rejected")
          .map((r) => (r.reason as pg.DatabaseError).code);
        expect(codes).toHaveLength(RAW_RACERS - 1);
        expect(codes.every((c) => c === "23P01" || c === "40P01")).toBe(true);
      } finally {
        await Promise.all(clients.map((client) => client.end()));
      }
    },
  );
});
