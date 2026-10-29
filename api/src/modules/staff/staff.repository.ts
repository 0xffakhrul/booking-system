import { pool, type Queryable } from "../../db/pool.js";
import type { StaffInput } from "./staff.schemas.js";

export interface Staff {
  id: string;
  name: string;
  active: boolean;
}

const COLUMNS = "id, name, active";

// Every query filters by tenant_id, so one business can never read or change another's staff

export async function listStaff(
  tenantId: string,
  includeInactive: boolean,
  db: Queryable = pool,
): Promise<Staff[]> {
  // oldest first: a stable order for the dashboard's staff columns
  const { rows } = await db.query<Staff>(
    `SELECT ${COLUMNS} FROM staff
      WHERE tenant_id = $1 AND (active OR $2)
      ORDER BY id`,
    [tenantId, includeInactive],
  );
  return rows;
}

export async function createStaff(
  tenantId: string,
  input: StaffInput,
  db: Queryable = pool,
): Promise<Staff> {
  const { rows } = await db.query<Staff>(
    `INSERT INTO staff (tenant_id, name) VALUES ($1, $2) RETURNING ${COLUMNS}`,
    [tenantId, input.name],
  );
  return rows[0]!;
}

/** Returns null when the staff member doesn't exist or belongs to another business */
export async function updateStaff(
  tenantId: string,
  id: string,
  input: StaffInput,
  db: Queryable = pool,
): Promise<Staff | null> {
  const { rows } = await db.query<Staff>(
    `UPDATE staff SET name = $3
      WHERE tenant_id = $1 AND id = $2
      RETURNING ${COLUMNS}`,
    [tenantId, id, input.name],
  );
  return rows[0] ?? null;
}

/**
 * True if the staff member exists in this business (active or not).
 * With lock: true, the row stays locked until the transaction ends.
 */
export async function staffExists(
  tenantId: string,
  id: string,
  db: Queryable = pool,
  { lock = false } = {},
): Promise<boolean> {
  const { rowCount } = await db.query(
    `SELECT 1 FROM staff WHERE tenant_id = $1 AND id = $2${lock ? " FOR UPDATE" : ""}`,
    [tenantId, id],
  );
  return rowCount === 1;
}

/**
 * Soft delete. Their working hours stay in the database (the availability query
 * skips inactive staff), and their past bookings keep pointing at them.
 * Returns false if not found.
 */
export async function deactivateStaff(
  tenantId: string,
  id: string,
  db: Queryable = pool,
): Promise<boolean> {
  const { rowCount } = await db.query(
    "UPDATE staff SET active = false WHERE tenant_id = $1 AND id = $2",
    [tenantId, id],
  );
  return rowCount === 1;
}
