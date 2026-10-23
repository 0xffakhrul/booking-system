import type { Request, RequestHandler } from "express";
import {
  getSessionUser,
  readSessionToken,
} from "../modules/sessions/sessions.js";
import type { User } from "../modules/users/users.repository.js";
import { UnauthorizedError } from "../lib/errors.js";

export const loadUser: RequestHandler = async (req, _res, next) => {
  const token = readSessionToken(req);
  req.user = token ? await getSessionUser(token) : null;
  next();
};

export const requireAuth: RequestHandler = (req, _res, next) => {
  if (!req.user) throw new UnauthorizedError();
  next();
};

export function currentUser(req: Request): User {
  if (!req.user)
    throw new Error("currentUser() used on a route without requireAuth");
  return req.user;
}
