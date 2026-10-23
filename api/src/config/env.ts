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
  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
    .default("info"),
});

export const env = EnvSchema.parse(process.env);
