import { randomInt } from "node:crypto";
import { beforeEach, describe, expect, it } from "vitest";
import { pool } from "../src/db/pool.js";

// These go straight to the database, not through the API: the point is that Postgres itself
// refuses a double booking, whatever code (or person in psql) does the INSERT.

let tenantId: string;
let staffA: string;
let staffB: string;
let serviceId: string;

beforeEach(async () => {
  tenantId = await insertId(
    "INSERT INTO tenants (name, slug) VALUES ('Kedai Ali', 'kedai-ali') RETURNING id",
  );
  staffA = await insertId(
    "INSERT INTO staff (tenant_id, name) VALUES ($1, 'Aina') RETURNING id",
    [tenantId],
  );
  staffB = await insertId(
    "INSERT INTO staff (tenant_id, name) VALUES ($1, 'Ben') RETURNING id",
    [tenantId],
  );
  serviceId = await insertId(
    "INSERT INTO services (tenant_id, name, duration_min, price_cents) VALUES ($1, 'Haircut', 45, 2800) RETURNING id",
    [tenantId],
  );
});

async function insertId(sql: string, params: unknown[] = []) {
  const { rows } = await pool.query<{ id: string }>(sql, params);
  return rows[0]!.id;
}

// the migration's alphabet: no 0/O, 1/I/L
const REF_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const randomRef = () =>
  Array.from(
    { length: 8 },
    () => REF_ALPHABET[randomInt(REF_ALPHABET.length)],
  ).join("");

function book(
  staffId: string,
  start: string,
  end: string,
  { status = "confirmed", tenant = tenantId } = {},
) {
  const ref = randomRef();
  return pool.query(
    `INSERT INTO bookings (tenant_id, ref, staff_id, service_id, customer_name, customer_phone, during, status, source)
     VALUES ($1, $2, $3, $4, 'Customer', '+60123456789', tstzrange($5, $6), $7, 'online')`,
    [tenant, ref, staffId, serviceId, start, end, status],
  );
}

describe("bookings_no_overlap", () => {
  it("rejects an overlapping booking for the same staff member", async () => {
    await book(staffA, "2026-11-02T10:00+08", "2026-11-02T10:45+08");

    await expect(
      book(staffA, "2026-11-02T10:30+08", "2026-11-02T11:15+08"),
    ).rejects.toMatchObject({
      code: "23P01", // exclusion_violation, which the API will turn into 409 SLOT_TAKEN
      constraint: "bookings_no_overlap",
    });
  });

  it("allows back-to-back bookings, and the same time with another staff member", async () => {
    await book(staffA, "2026-11-02T10:00+08", "2026-11-02T10:45+08");
    await book(staffA, "2026-11-02T10:45+08", "2026-11-02T11:30+08");
    await book(staffB, "2026-11-02T10:00+08", "2026-11-02T10:45+08");
  });

  it("frees the slot when a booking is cancelled", async () => {
    await book(staffA, "2026-11-02T10:00+08", "2026-11-02T10:45+08");
    await pool.query("UPDATE bookings SET status = 'cancelled'");

    await book(staffA, "2026-11-02T10:00+08", "2026-11-02T10:45+08");
  });

  it("rejects a booking for another business's staff member", async () => {
    const otherTenant = await insertId(
      "INSERT INTO tenants (name, slug) VALUES ('Other', 'other-shop') RETURNING id",
    );

    await expect(
      book(staffA, "2026-11-02T10:00+08", "2026-11-02T10:45+08", {
        tenant: otherTenant,
      }),
    ).rejects.toMatchObject({ code: "23503" }); // foreign_key_violation
  });
});
