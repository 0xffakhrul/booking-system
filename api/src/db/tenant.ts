import { AsyncLocalStorage } from "node:async_hooks";
import type pg from "pg";
import { pool, type Queryable } from "./pool.js";

// Row-Level Security (ADR-0003): Postgres only shows a tenant's rows inside a transaction that has
// run set_config('app.tenant_id', …, true). AsyncLocalStorage carries that transaction through
// every `await` in the request, so repositories pick it up without it being passed around.

type TenantTransaction = { client: pg.PoolClient; tenantId: string };
const current = new AsyncLocalStorage<TenantTransaction>();

/** The connection to query: the current tenant transaction, or the pool outside one */
export function currentDb(): Queryable {
  return current.getStore()?.client ?? pool;
}

/** The current tenant transaction's client, if there is one */
export function currentTransaction(): pg.PoolClient | undefined {
  return current.getStore()?.client;
}

/**
 * Runs `fn` in a transaction where Row-Level Security sees only this tenant's rows.
 * Commits if `fn` resolves, rolls back if it throws. The setting is transaction-local, so it
 * can't leak to whoever uses this pooled connection next.
 */
export async function asTenant<T>(
  tenantId: string,
  fn: () => Promise<T>,
): Promise<T> {
  const outer = current.getStore();
  if (outer) {
    if (outer.tenantId !== tenantId)
      throw new Error("asTenant() for a different tenant inside another one");
    return fn(); // already in this tenant's transaction
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT set_config('app.tenant_id', $1, true)", [
      tenantId,
    ]);
    const result = await current.run({ client, tenantId }, fn);
    await client.query("COMMIT");
    client.release();
    return result;
  } catch (err) {
    try {
      await client.query("ROLLBACK");
      client.release();
    } catch (rollbackErr) {
      client.release(rollbackErr as Error); // a broken connection: drop it from the pool
    }
    throw err;
  }
}
