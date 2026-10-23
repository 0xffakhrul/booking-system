import { pino } from "pino";
import { env } from "../config/env.js";

export const logger = pino({
  level: env.LOG_LEVEL,
  redact: {
    paths: [
      "password",
      "*.password",
      "password_hash",
      "*.password_hash",
      "token",
      "*.token",
      "req.headers.cookie",
      "req.headers.authorization",
      'res.headers["set-cookie"]',
    ],
    censor: "[REDACTED]",
  },
  ...(env.NODE_ENV === "development"
    ? {
        transport: {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "SYS:HH:MM:ss",
            ignore: "pid,hostname",
          },
        },
      }
    : {}),
});
