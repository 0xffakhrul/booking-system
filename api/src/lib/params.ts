import { NotFoundError } from "./errors.js";

/**
 * Route ids are BIGINT strings. Anything that isn't 1–18 digits can't match a row,
 * so it's a 404 rather than letting Postgres throw "invalid input syntax for type bigint" (a 500).
 */
export function parseId(raw: string | undefined, what = "resource"): string {
  if (!raw || !/^\d{1,18}$/.test(raw))
    throw new NotFoundError(`${what} not found`);
  return raw;
}
