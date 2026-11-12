import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";

// A stand-in for web/dist: the API serves the built React app in production (ADR-0010)
const dist = mkdtempSync(path.join(tmpdir(), "web-dist-"));
writeFileSync(
  path.join(dist, "index.html"),
  "<!doctype html><title>Tempah</title>",
);
writeFileSync(path.join(dist, "favicon.svg"), "<svg/>");
mkdirSync(path.join(dist, "assets"));
writeFileSync(path.join(dist, "assets", "index-abc123.js"), "console.log(1)");

const app = createApp({ webDist: dist });

describe("serving the web app", () => {
  it("serves the app shell at / without caching it", async () => {
    const res = await request(app).get("/");
    expect(res.status).toBe(200);
    expect(res.text).toContain("<title>Tempah</title>");
    expect(res.headers["cache-control"]).toBe("no-cache");
  });

  it("serves the app shell for deep links, so a refresh on /app/services works", async () => {
    for (const page of ["/app/services", "/book/kedai-ali", "/login"]) {
      const res = await request(app).get(page);
      expect(res.status, page).toBe(200);
      expect(res.text).toContain("<title>Tempah</title>");
    }
  });

  it("caches hashed assets for a year, and 404s missing ones instead of sending the shell", async () => {
    const res = await request(app).get("/assets/index-abc123.js");
    expect(res.status).toBe(200);
    expect(res.headers["cache-control"]).toContain("immutable");
    expect(res.headers["cache-control"]).toContain("max-age=31536000");

    expect((await request(app).get("/assets/gone-123.js")).status).toBe(404);
  });

  it("serves other files from the build, like the favicon", async () => {
    const res = await request(app).get("/favicon.svg");
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toContain("image/svg+xml");
  });

  it("leaves /api alone: unknown API routes are JSON 404s, not the app shell", async () => {
    const res = await request(app).get("/api/nope");
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
    expect((await request(app).get("/api/health")).body).toEqual({
      ok: true,
      db: "up",
    });
  });

  it("only answers page loads: a POST to a page path still reaches the API's 404", async () => {
    const res = await request(app)
      .post("/app/services")
      .set("Origin", "http://localhost:5173");
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });
});
