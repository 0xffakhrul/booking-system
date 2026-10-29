import { withTransaction } from "../../db/transaction.js";
import { NotFoundError } from "../../lib/errors.js";
import { staffExists } from "../staff/staff.repository.js";
import * as hours from "./working-hours.repository.js";
import type { Range } from "./working-hours.schemas.js";

export async function getHours(
  tenantId: string,
  staffId: string,
): Promise<Range[]> {
  if (!(await staffExists(tenantId, staffId)))
    throw new NotFoundError("staff member not found");
  return hours.listHours(tenantId, staffId);
}

export async function replaceHours(
  tenantId: string,
  staffId: string,
  week: Range[],
): Promise<Range[]> {
  return withTransaction(async (tx) => {
    const found = await staffExists(tenantId, staffId, tx, { lock: true });
    if (!found) throw new NotFoundError("staff member not found");

    await hours.deleteHours(tenantId, staffId, tx);
    await hours.insertHours(tenantId, staffId, week, tx);
    return hours.listHours(tenantId, staffId, tx);
  });
}
