import express from "express";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { env } from "./config/env.js";
import { pool } from "./db/pool.js";
import { loadUser } from "./middleware/auth.js";
import { checkOrigin } from "./middleware/check-origin.js";
import { errorHandler } from "./middleware/error-handler.js";
import { httpLogger } from "./middleware/http-logger.js";
import authRoutes from "./modules/auth/auth.routes.js";

export function createApp() {
  const app = express();

  app.set("trust proxy", env.TRUST_PROXY); // >0 only behind a proxy that overwrites X-Forwarded-For, else req.ip is spoofable
  app.use(httpLogger); // first, so every request gets logged with an id
  app.use(helmet());
  app.use(express.json({ limit: "10kb" }));
  app.use(cookieParser());
  app.use(checkOrigin);
  app.use(loadUser);

  app.get("/api/health", async (_req, res) => {
    await pool.query("SELECT 1");
    res.json({ ok: true, db: "up" });
  });

  app.use("/api/auth", authRoutes);

  app.use(errorHandler); // always last
  return app;
}
