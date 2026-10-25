export type ErrorCode =
  | "BAD_REQUEST"
  | "VALIDATION_FAILED"
  | "UNAUTHENTICATED"
  | "INVALID_CREDENTIALS"
  | "BAD_ORIGIN"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "EMAIL_TAKEN"
  | "SLUG_TAKEN"
  | "SLOT_TAKEN"
  | "OUTSIDE_WORKING_HOURS"
  | "TOO_SOON"
  | "OUTSIDE_BOOKING_WINDOW"
  | "INACTIVE_RESOURCE"
  | "PAYLOAD_TOO_LARGE"
  | "RATE_LIMITED"
  | "INTERNAL";

export type FieldErrors = Record<string, string[]>;

export class AppError extends Error {
  constructor(
    readonly status: number,
    readonly code: ErrorCode,
    message: string,
    readonly fields?: FieldErrors,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class ValidationError extends AppError {
  constructor(fields: FieldErrors, message = "invalid input") {
    super(400, "VALIDATION_FAILED", message, fields);
  }
}

export class UnauthorizedError extends AppError {
  constructor(
    code: "UNAUTHENTICATED" | "INVALID_CREDENTIALS" = "UNAUTHENTICATED",
    message = "authentication required",
  ) {
    super(401, code, message);
  }
}

export class ForbiddenError extends AppError {
  constructor(
    code: "FORBIDDEN" | "BAD_ORIGIN" = "FORBIDDEN",
    message = "forbidden",
  ) {
    super(403, code, message);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "not found") {
    super(404, "NOT_FOUND", message);
  }
}

export class ConflictError extends AppError {
  constructor(code: ErrorCode, message: string) {
    super(409, code, message);
  }
}
