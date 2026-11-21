import type { Request, RequestHandler } from "express";
import { httpRequestDuration } from "../lib/metrics.js";

export const httpMetrics: RequestHandler = (req, res, next) => {
  const stop = httpRequestDuration.startTimer();
  res.on("finish", () => {
    stop({
      method: req.method,
      route: routeOf(req),
      status_code: String(res.statusCode),
    });
  });
  next();
};

export function routePrefix(prefix: string): RequestHandler {
  return (req, _res, next) => {
    req.routePrefix = prefix;
    next();
  };
}

function routeOf(req: Request): string {
  const prefix = req.routePrefix ?? "";
  const route = req.route as { path?: unknown } | undefined;
  if (typeof route?.path === "string")
    return route.path === "/" && prefix ? prefix : prefix + route.path;
  // stopped before reaching a route, e.g. a 401 from requireRole or a 404 inside a router
  if (prefix) return `${prefix}/*`;
  return req.originalUrl.startsWith("/api") ? "(unmatched)" : "(web)";
}
