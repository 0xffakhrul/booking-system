import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { AppError } from "../lib/errors.js";

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  if (err instanceof ZodError) {
    res
      .status(400)
      .json({ error: "invalid input", details: err.flatten().fieldErrors });
    return;
  }

  if (err instanceof AppError) {
    res.status(err.status).json({ error: err.message });
    return;
  }

  if (typeof err?.status === "number" && err.status < 500 && err.expose) {
    res.status(err.status).json({ error: err.message });
    return;
  }

  res.err = err instanceof Error ? err : new Error(String(err));
  res.status(500).json({ error: "internal server error", requestId: req.id });
};
