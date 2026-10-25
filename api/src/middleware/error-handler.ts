import type { ErrorRequestHandler, RequestHandler } from "express";
import { ZodError } from "zod";
import {
  AppError,
  NotFoundError,
  ValidationError,
  type FieldErrors,
} from "../lib/errors.js";

interface BodyParserError {
  type: string;
  status: number;
  expose: boolean;
  message: string;
}

function isBodyParserError(err: unknown): err is BodyParserError {
  return (
    typeof err === "object" &&
    err !== null &&
    "type" in err &&
    typeof (err as { status?: unknown }).status === "number"
  );
}

function zodFieldErrors(err: ZodError): FieldErrors {
  const fields: FieldErrors = {};
  for (const issue of err.issues) {
    const key = issue.path.join(".") || "body";
    (fields[key] ??= []).push(issue.message);
  }
  return fields;
}

function toAppError(err: unknown): AppError {
  if (err instanceof AppError) return err;
  if (err instanceof ZodError) return new ValidationError(zodFieldErrors(err));

  if (isBodyParserError(err)) {
    if (err.type === "entity.parse.failed")
      return new AppError(400, "BAD_REQUEST", "malformed JSON body");
    if (err.type === "entity.too.large")
      return new AppError(413, "PAYLOAD_TOO_LARGE", "request body too large");
    if (err.status < 500 && err.expose)
      return new AppError(err.status, "BAD_REQUEST", err.message);
  }

  return new AppError(500, "INTERNAL", "internal server error");
}

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  const appError = toAppError(err);

  if (appError.status >= 500) {
    res.err = err instanceof Error ? err : new Error(String(err));
  }

  res.status(appError.status).json({
    error: {
      code: appError.code,
      message: appError.message,
      ...(appError.fields && { fields: appError.fields }),
      ...(appError.status >= 500 && { requestId: req.id }),
    },
  });
};

export const notFoundHandler: RequestHandler = (req) => {
  throw new NotFoundError(`no route for ${req.method} ${req.path}`);
};
