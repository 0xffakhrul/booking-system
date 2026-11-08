import type { RequestHandler } from "express";
import { asTenant, currentTransaction } from "../db/tenant.js";
import { currentTenantId } from "./auth.js";
import { errorHandler } from "./error-handler.js";

/** Thrown inside the transaction to roll it back without it being an error */
class RollBack extends Error {}

/**
 * Runs the rest of the request in a transaction for req.tenantId, so Row-Level Security
 * shows only that business's rows (ADR-0003). Goes after whatever sets req.tenantId.
 *
 * The response is held back until COMMIT has succeeded. Otherwise a client could get a 201
 * for a booking that was then lost. Any 4xx or 5xx response rolls the transaction back.
 */
export const tenantTransaction: RequestHandler = (req, res, next) => {
  // e.g. /api/staff/1/hours passes through the staff router and then the hours router
  if (currentTransaction()) return next();

  const tenantId = currentTenantId(req);

  // Hold back res.end, which every res.json/send/end goes through, until the transaction is done
  const end = res.end.bind(res) as (...args: unknown[]) => typeof res;
  let send = () => {};
  let hungUp = false;
  let finished!: () => void;
  const responded = new Promise<void>((resolve) => (finished = resolve));
  res.end = ((...args: unknown[]) => {
    send = () => end(...args);
    finished();
    return res;
  }) as typeof res.end;
  // a client that hangs up before we answer: roll back rather than wait forever
  res.on("close", () => {
    hungUp = !res.writableEnded;
    finished();
  });

  asTenant(tenantId, async () => {
    next(); // the route runs inside the transaction (AsyncLocalStorage carries it)…
    await responded; // …until it has written its response
    if (res.statusCode >= 400 || hungUp) throw new RollBack();
  }).then(
    () => send(),
    (err: unknown) => {
      if (err instanceof RollBack) return send();
      // couldn't connect, BEGIN or COMMIT: answer with an error instead of the held response
      res.end = end as typeof res.end;
      if (res.headersSent || hungUp) return;
      // the held-back body's headers would describe the wrong body
      for (const h of ["content-length", "content-type", "etag"])
        res.removeHeader(h);
      errorHandler(err, req, res, next);
    },
  );
};
