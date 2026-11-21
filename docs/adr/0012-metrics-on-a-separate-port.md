# ADR-0012: Prometheus metrics on a separate, unpublished port

- **Status:** Accepted
- **Date:** 2026-11-21

## Context

The app should expose metrics for Prometheus: request rate and latency, bookings created and slot conflicts, plus the Node process's memory and event loop. `/metrics` must stay internal. It shows traffic and business volume, and anyone could scrape it as often as they like. Caddy passes every request for the public hostname to the app's port 3009 (ADR-0010).

## Decision

**`prom-client` serves `GET /metrics` from a second, tiny HTTP server on `METRICS_PORT` (9464), not from the Express app.**

- Caddy proxies only to 3009, so no public URL can reach `/metrics`. Nothing has to remember to block it.
- In `deploy/compose.yml` the port is published on the server's loopback only (`127.0.0.1:9464`), so `curl` works on the server. Prometheus scrapes it over the Compose network as `app:9464`. The Lighthouse firewall doesn't open it either.
- Every request is timed by one histogram, `http_request_duration_seconds{method, route, status_code}`. Its `_count` is the request counter. `route` is the Express pattern (`/api/bookings/:id`), never the real URL, so the number of series stays fixed.
- `bookings_created_total{source}` and `booking_conflicts_total{operation, caught_by}` count the business events. `caught_by` says which layer refused a booking: the availability check, or the exclusion constraint after a race (ADR-0002). With 20 simultaneous requests for one slot, both show up.

## Alternatives considered

| Option | Why not |
| --- | --- |
| `/metrics` on the main app, blocked in the Caddyfile | Safe only while that one Caddy rule exists. Moving the proxy or adding a hostname could expose it |
| `/metrics` on the main app behind a token | Still public, and Prometheus then needs a secret |
| `express-prom-bundle` | Guesses route labels from URLs by replacing things that look like IDs. The app already knows its route patterns, so it can label exactly |
| OpenTelemetry SDK and collector | More moving parts than one box needs. `prom-client` writes the format Prometheus reads directly |

## Consequences

- **Good:** keeping `/metrics` private depends on a port that isn't published, not on a proxy rule. It's tested: the main app answers 404 for `/metrics`.
- **Good:** the route label comes from Express, so a slug or a booking ID can never create new series. A test checks this.
- **Bad:** one more port, and `index.ts` starts and stops two servers.
- **Bad:** a booking is counted when its insert succeeds, before the request's `COMMIT`. If that commit fails (very rare), the count is one too high.
- **Risk:** `route` comes from `routePrefix(path)`, which each router gets when it's mounted in `app.ts`. A router mounted without it is labelled `(unmatched)` for its errors and by its own path for its routes, which is wrong but still a fixed number of series.
