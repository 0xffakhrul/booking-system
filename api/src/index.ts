import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { pool } from "./db/pool.js";
import { logger } from "./lib/logger.js";
import { deleteExpiredSessions } from "./modules/sessions/sessions.js";

const app = createApp();

const server = app.listen(env.PORT, () => {
  logger.info({ port: env.PORT, env: env.NODE_ENV }, "api listening");
});

const cleanup = setInterval(
  async () => {
    try {
      const deleted = await deleteExpiredSessions();
      logger.debug({ deleted }, "expired sessions cleaned up");
    } catch (err) {
      logger.error({ err }, "session cleanup failed");
    }
  },
  60 * 60 * 1000,
);

process.on("unhandledRejection", (reason) => {
  logger.fatal({ err: reason }, "unhandled promise rejection");
  process.exit(1);
});
process.on("uncaughtException", (err) => {
  logger.fatal({ err }, "uncaught exception");
  process.exit(1);
});

function shutdown(signal: string) {
  logger.info({ signal }, "shutting down");
  clearInterval(cleanup);
  server.close(async () => {
    await pool.end();
    logger.info("shutdown complete");
    process.exit(0);
  });
}
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
