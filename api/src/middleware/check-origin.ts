import type { RequestHandler } from "express";
import { env } from "../config/env.js";
import { AppError } from "../lib/errors.js";

export const checkOrigin: RequestHandler = (req, _res, next) => {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();
  const origin = req.get("origin");
  if (origin && origin !== env.APP_ORIGIN)
    throw new AppError(403, "bad origin");
  next();
};
