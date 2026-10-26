import type { Request, RequestHandler } from "express";
import { ForbiddenError, UnauthorizedError } from "../lib/errors.js";
import {
  getSessionUser,
  readSessionToken,
} from "../modules/sessions/sessions.js";
import type { User } from "../modules/users/users.repository.js";

export const loadUser: RequestHandler = async (req, _res, next) => {
  const token = readSessionToken(req);
  req.user = token ? await getSessionUser(token) : null;
  req.tenantId = req.user?.tenantId ?? null;
  next();
};

export const requireAuth: RequestHandler = (req, _res, next) => {
  if (!req.user) throw new UnauthorizedError();
  next();
};

/** Logged in AND one of these roles. 401 if not logged in, 403 if the role doesn't match. */
export function requireRole(...roles: User["role"][]): RequestHandler {
  return (req, _res, next) => {
    if (!req.user) throw new UnauthorizedError();
    if (!roles.includes(req.user.role))
      throw new ForbiddenError("FORBIDDEN", "your role can't do this");
    next();
  };
}

export function currentUser(req: Request): User {
  if (!req.user)
    throw new Error("currentUser() used on a route without requireAuth");
  return req.user;
}

export function currentTenantId(req: Request): string {
  if (!req.tenantId)
    throw new Error("currentTenantId() used on a route without a tenant");
  return req.tenantId;
}
