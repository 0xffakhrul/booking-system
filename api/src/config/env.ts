import { z } from "zod";

const EnvSchema = z.object({
  DATABASE_URL: z.string().url(),
  APP_ORIGIN: z.string().url(),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(3009),
  // number of proxies in front of the app that overwrite X-Forwarded-For; 0 = none
  TRUST_PROXY: z.coerce.number().int().min(0).default(0),
  // the built React app (web/dist) to serve at /; unset in development, where Vite serves it
  WEB_DIST_DIR: z.string().min(1).optional(),
  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
    .default("info"),
});

export const env = EnvSchema.parse(process.env);
