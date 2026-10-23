import pg from "pg";
import { env } from "../config/env.js";
import { logger } from "../lib/logger.js";

export const pool = new pg.Pool({
  connectionString: env.DATABASE_URL,
  max: 10,
});

pool.on("error", (err) => {
  logger.error({ err }, "idle postgres client error");
});

export interface Queryable {
  query<R extends pg.QueryResultRow = pg.QueryResultRow>(
    text: string,
    values?: unknown[],
  ): Promise<pg.QueryResult<R>>;
}
