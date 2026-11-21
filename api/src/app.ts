import express from "express";
import type { Router } from "express";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { env } from "./config/env.js";
import { pool } from "./db/pool.js";
import { loadUser } from "./middleware/auth.js";
import { checkOrigin } from "./middleware/check-origin.js";
import { errorHandler, notFoundHandler } from "./middleware/error-handler.js";
import { httpLogger } from "./middleware/http-logger.js";
import { httpMetrics, routePrefix } from "./middleware/http-metrics.js";
import authRoutes from "./modules/auth/auth.routes.js";
import bookingsRoutes from "./modules/bookings/bookings.routes.js";
import publicRoutes from "./modules/public/public.routes.js";
import servicesRoutes from "./modules/services/services.routes.js";
import staffRoutes from "./modules/staff/staff.routes.js";
import workingHoursRoutes from "./modules/working-hours/working-hours.routes.js";
import { serveWeb } from "./web.js";

export function createApp({ webDist = env.WEB_DIST_DIR } = {}) {
  const app = express();

  app.set("trust proxy", env.TRUST_PROXY); // >0 only behind a proxy that overwrites X-Forwarded-For, else req.ip is spoofable
  app.use(httpMetrics);
  app.use(httpLogger);
  app.use(helmet());
  // the React app, in production (ADR-0010); before the API's middleware, which pages don't need
  if (webDist) app.use(serveWeb(webDist));
  app.use(express.json({ limit: "10kb" }));
  app.use(cookieParser());
  app.use(checkOrigin);
  app.use(loadUser);

  app.get("/api/health", async (_req, res) => {
    await pool.query("SELECT 1");
    res.json({ ok: true, db: "up" });
  });

  // each router is told its mount path, for the metrics' route label (http-metrics.ts)
  const mount = (path: string, router: Router) =>
    app.use(path, routePrefix(path), router);
  mount("/api/auth", authRoutes);
  mount("/api/public", publicRoutes); // customers: no login
  mount("/api/bookings", bookingsRoutes);
  mount("/api/services", servicesRoutes);
  mount("/api/staff", staffRoutes);
  mount("/api/staff/:staffId/hours", workingHoursRoutes);

  app.use(notFoundHandler); // after all routes
  app.use(errorHandler); // always last
  return app;
}
