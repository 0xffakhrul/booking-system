import type pg from "pg";
import { pool } from "./pool.js";
import { currentTransaction } from "./tenant.js";

let savepoints = 0;

/**
 * Runs `fn` as one unit that commits or rolls back as a whole.
 *
 * Inside a request's tenant transaction this becomes a SAVEPOINT on the same connection:
 * a failure undoes only `fn`'s work and the request can carry on (the booking code relies on
 * this to try the next staff member after a 23P01). Outside one, it's a normal transaction.
 */
export async function withTransaction<T>(
  fn: (tx: pg.PoolClient) => Promise<T>,
): Promise<T> {
  const outer = currentTransaction();
  if (outer) return withSavepoint(outer, fn);

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    client.release();
    return result;
  } catch (err) {
    try {
      await client.query("ROLLBACK");
      client.release();
    } catch (rollbackErr) {
      client.release(rollbackErr as Error);
    }
    throw err;
  }
}

async function withSavepoint<T>(
  client: pg.PoolClient,
  fn: (tx: pg.PoolClient) => Promise<T>,
): Promise<T> {
  const name = `sp_${++savepoints}`;
  await client.query(`SAVEPOINT ${name}`);
  try {
    const result = await fn(client);
    await client.query(`RELEASE SAVEPOINT ${name}`);
    return result;
  } catch (err) {
    await client.query(`ROLLBACK TO SAVEPOINT ${name}`);
    throw err;
  }
}
