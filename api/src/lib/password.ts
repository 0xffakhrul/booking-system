import argon2 from "argon2";

const DUMMY_HASH = await argon2.hash("timing-equalizer-not-a-real-password");

export function hashPassword(password: string) {
  return argon2.hash(password, { type: argon2.argon2id });
}

export function verifyPassword(hash: string | undefined, password: string) {
  return argon2.verify(hash ?? DUMMY_HASH, password);
}
