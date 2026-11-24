import http from "node:http";
import { registry } from "./lib/metrics.js";

// GET /metrics on its own port
export function createMetricsServer() {
  return http.createServer((req, res) => {
    if (req.method !== "GET" || req.url !== "/metrics") {
      res.writeHead(404).end();
      return;
    }
    registry.metrics().then(
      (body) =>
        res.writeHead(200, { "Content-Type": registry.contentType }).end(body),
      () => res.writeHead(500).end(),
    );
  });
}
