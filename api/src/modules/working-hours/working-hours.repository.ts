import { pool, type Queryable } from "../../db/pool.js";
import type { Range } from "./working-hours.schemas.js";

const COLUMNS = `weekday,
  to_char(start_time, 'HH24:MI') AS start,
  to_char(end_time, 'HH24:MI') AS end`;

export async function listHours(
  tenantId: string,
  staffId: string,
  db: Queryable = pool,
): Promise<Range[]> {
  const { rows } = await db.query<Range>(
    `SELECT ${COLUMNS} FROM working_hours
      WHERE tenant_id = $1 AND staff_id = $2
      ORDER BY weekday, start_time`,
    [tenantId, staffId],
  );
  return rows;
}

export async function deleteHours(
  tenantId: string,
  staffId: string,
  db: Queryable = pool,
): Promise<void> {
  await db.query(
    "DELETE FROM working_hours WHERE tenant_id = $1 AND staff_id = $2",
    [tenantId, staffId],
  );
}

export async function insertHours(
  tenantId: string,
  staffId: string,
  hours: Range[],
  db: Queryable = pool,
): Promise<void> {
  if (hours.length === 0) return;
  await db.query(
    `INSERT INTO working_hours (tenant_id, staff_id, weekday, start_time, end_time)
     SELECT $1, $2, weekday, start_time, end_time
       FROM unnest($3::smallint[], $4::time[], $5::time[])
         AS h(weekday, start_time, end_time)`,
    [
      tenantId,
      staffId,
      hours.map((h) => h.weekday),
      hours.map((h) => h.start),
      hours.map((h) => h.end),
    ],
  );
}
