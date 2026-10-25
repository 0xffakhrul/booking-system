import express from "express";
import type { Request, Response } from "express";
import { rateLimit } from "express-rate-limit";
import { currentUser, requireAuth } from "../../middleware/auth.js";
import {
  COOKIE_NAME,
  cookieOptions,
  deleteSession,
  readSessionToken,
  type NewSession,
} from "../sessions/sessions.js";
import { loginSchema, registerSchema } from "./auth.schemas.js";
import * as authService from "./auth.service.js";
import { AppError } from "../../lib/errors.js";

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  handler: (_req, _res, next) =>
    next(
      new AppError(429, "RATE_LIMITED", "too many attempts, try again later"),
    ),
});

// Kill any old session (session fixation defense), then set the new cookie
async function setSessionCookie(
  req: Request,
  res: Response,
  session: NewSession,
) {
  const oldToken = readSessionToken(req);
  if (oldToken) await deleteSession(oldToken);
  res.cookie(COOKIE_NAME, session.token, cookieOptions(session.expiresAt));
}

router.post("/register", authLimiter, async (req, res) => {
  const input = registerSchema.parse(req.body); // throws ZodError → 400
  const { tenant, user, session } = await authService.register(input);
  await setSessionCookie(req, res, session);
  req.log.info({ userId: user.id, tenantId: tenant.id }, "business registered");
  res.status(201).json({ user, tenant });
});

router.post("/login", authLimiter, async (req, res) => {
  const input = loginSchema.parse(req.body);
  const { user, session } = await authService.login(input);
  await setSessionCookie(req, res, session);
  req.log.info({ userId: user.id }, "user logged in");
  res.json({ user });
});

router.post("/logout", async (req, res) => {
  const token = readSessionToken(req);
  if (token) await deleteSession(token);
  res.clearCookie(COOKIE_NAME, cookieOptions());
  res.status(204).end();
});

router.get("/me", requireAuth, (req, res) => {
  res.json({ user: currentUser(req) });
});

export default router;
