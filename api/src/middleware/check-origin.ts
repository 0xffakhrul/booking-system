import type { RequestHandler } from "express";
import { env } from "../config/env.js";
import { ForbiddenError } from "../lib/errors.js";

export const checkOrigin: RequestHandler = (req, _res, next) => {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();
  const origin = req.get("origin");
  if (origin && origin !== env.APP_ORIGIN)
    throw new ForbiddenError("BAD_ORIGIN", "request origin not allowed");
  next();
};
