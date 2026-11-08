import type { Queryable } from "../../db/pool.js";
import { currentDb } from "../../db/tenant.js";
import type {
  CreateServiceInput,
  UpdateServiceInput,
} from "./services.schemas.js";

export interface Service {
  id: string;
  name: string;
  durationMin: number;
  price: number;
  active: boolean;
}

const COLUMNS = `id, name, duration_min AS "durationMin", price_cents AS "price", active`;

// Row-Level Security keeps each business to its own services (ADR-0003). The queries below
// still filter by tenant_id as a second lock, except listServices.

/**
 * The current business's services. No tenant_id filter on purpose: Row-Level Security adds it,
 * and this query proves that it does. Must run in a tenant transaction (asTenant).
 */
export async function listServices(
  includeInactive: boolean,
  db: Queryable = currentDb(),
): Promise<Service[]> {
  const { rows } = await db.query<Service>(
    `SELECT ${COLUMNS} FROM services
      WHERE active OR $1
      ORDER BY name, id`,
    [includeInactive],
  );
  return rows;
}

export async function createService(
  tenantId: string,
  input: CreateServiceInput,
  db: Queryable = currentDb(),
): Promise<Service> {
  const { rows } = await db.query<Service>(
    `INSERT INTO services (tenant_id, name, duration_min, price_cents)
     VALUES ($1, $2, $3, $4)
     RETURNING ${COLUMNS}`,
    [tenantId, input.name, input.durationMin, input.price],
  );
  return rows[0]!;
}

/** Returns null when the service doesn't exist or belongs to another business */
export async function updateService(
  tenantId: string,
  id: string,
  patch: UpdateServiceInput,
  db: Queryable = currentDb(),
): Promise<Service | null> {
  // COALESCE keeps the current value for any field the patch leaves out
  const { rows } = await db.query<Service>(
    `UPDATE services
        SET name         = COALESCE($3, name),
            duration_min = COALESCE($4, duration_min),
            price_cents  = COALESCE($5, price_cents)
      WHERE tenant_id = $1 AND id = $2
      RETURNING ${COLUMNS}`,
    [
      tenantId,
      id,
      patch.name ?? null,
      patch.durationMin ?? null,
      patch.price ?? null,
    ],
  );
  return rows[0] ?? null;
}

/** Soft delete: bookings will reference services, so rows are never removed. Returns false if not found. */
export async function deactivateService(
  tenantId: string,
  id: string,
  db: Queryable = currentDb(),
): Promise<boolean> {
  const { rowCount } = await db.query(
    "UPDATE services SET active = false WHERE tenant_id = $1 AND id = $2",
    [tenantId, id],
  );
  return rowCount === 1;
}

/** Includes inactive services, so callers can tell "removed" (422) from "never existed" (404) */
export async function findService(
  tenantId: string,
  id: string,
  db: Queryable = currentDb(),
): Promise<Service | null> {
  const { rows } = await db.query<Service>(
    `SELECT ${COLUMNS} FROM services WHERE tenant_id = $1 AND id = $2`,
    [tenantId, id],
  );
  return rows[0] ?? null;
}
