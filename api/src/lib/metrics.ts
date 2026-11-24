import {
  collectDefaultMetrics,
  Counter,
  Histogram,
  Registry,
} from "prom-client";

export const registry = new Registry();

// CPU, memory, event loop lag and garbage collection
collectDefaultMetrics({ register: registry });

export const httpRequestDuration = new Histogram({
  name: "http_request_duration_seconds",
  help: "Time to answer an HTTP request, by route pattern",
  labelNames: ["method", "route", "status_code"] as const,
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
  registers: [registry],
});

export const bookingsCreated = new Counter({
  name: "bookings_created_total",
  help: "Bookings created: online by customers, manual by owners",
  labelNames: ["source"] as const,
  registers: [registry],
});

export const bookingConflicts = new Counter({
  name: "booking_conflicts_total",
  help: "Bookings and moves refused because the slot was taken",
  labelNames: ["operation", "caught_by"] as const,
  registers: [registry],
});

for (const source of ["online", "manual"]) bookingsCreated.inc({ source }, 0);
for (const caught_by of ["check", "constraint"])
  bookingConflicts.inc({ operation: "create", caught_by }, 0);
bookingConflicts.inc({ operation: "move", caught_by: "constraint" }, 0);
