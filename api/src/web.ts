import { existsSync } from "node:fs";
import path from "node:path";
import express from "express";
import type { Router } from "express";

/**
 * Serves the built React app (web/dist) from the same origin as the API, so the production
 * image is one container and the browser sees one site (ADR-0010). Requests under /api never
 * reach here. Anything else that isn't a file gets index.html, so React Router can handle
 * deep links like /app/services after a refresh.
 */
export function serveWeb(dir: string): Router {
  const index = path.join(dir, "index.html");
  if (!existsSync(index))
    throw new Error(`WEB_DIST_DIR has no index.html: ${dir}`);

  const router = express.Router();

  router.use((req, res, next) => {
    const isPage = req.method === "GET" || req.method === "HEAD";
    if (!isPage || req.path === "/api" || req.path.startsWith("/api/"))
      return next("router"); // leave it to the API
    next();
  });

  // Vite puts a content hash in every file name under assets/, so they can be cached forever
  router.use(
    "/assets",
    express.static(path.join(dir, "assets"), { immutable: true, maxAge: "1y" }),
    // a missing asset is a plain 404, not index.html (the browser would try to run HTML as JS)
    (_req, res) => {
      res.sendStatus(404);
    },
  );
  router.use(express.static(dir, { index: false, maxAge: "1h" }));

  // every other page: the app shell, never cached, so a deploy shows up on the next load
  router.use((_req, res) => {
    res.set("Cache-Control", "no-cache");
    res.sendFile(index);
  });

  return router;
}
