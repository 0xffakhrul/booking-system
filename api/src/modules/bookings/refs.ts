import { randomInt } from "node:crypto";

// No 0/O or 1/I/L, so a ref read out over the phone can't be misheard (ADR-0007).
// The bookings table has a CHECK with the same alphabet.
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

/** e.g. "K7XQ9MPA": 31^8 ≈ 850 billion combinations per business */
export function generateRef(): string {
  let ref = "";
  for (let i = 0; i < 8; i++) ref += ALPHABET[randomInt(ALPHABET.length)];
  return ref;
}
