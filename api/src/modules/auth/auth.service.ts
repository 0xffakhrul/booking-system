import { withTransaction } from "../../db/transaction.js";
import { UnauthorizedError } from "../../lib/errors.js";
import { hashPassword, verifyPassword } from "../../lib/password.js";
import { createSession } from "../sessions/sessions.js";
import { createUser, findUserByEmail } from "../users/users.repository.js";
import type { LoginInput, RegisterInput } from "./auth.schemas.js";

export async function register({ email, username, password }: RegisterInput) {
  const passwordHash = await hashPassword(password);

  return withTransaction(async (tx) => {
    const user = await createUser(email, username, passwordHash, tx);
    const session = await createSession(user.id, tx);
    return { user, session };
  });
}

export async function login({ email, password }: LoginInput) {
  const found = await findUserByEmail(email);
  const valid = await verifyPassword(found?.password_hash, password);

  if (!found || !valid)
    throw new UnauthorizedError(
      "INVALID_CREDENTIALS",
      "invalid email or password",
    );

  const { password_hash: _, ...user } = found;
  const session = await createSession(user.id);
  return { user, session };
}
