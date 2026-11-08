import pg from "pg";

/**
 * The admin connection, for tests that set up or inspect rows directly. It skips Row-Level
 * Security, so it sees every tenant. Test the API's behaviour through `pool` or HTTP instead.
 */
export const admin = new pg.Pool({
  connectionString: process.env.MIGRATION_DATABASE_URL,
  max: 3,
});
