import { withTransaction } from "../../db/transaction.js";
import { UnauthorizedError } from "../../lib/errors.js";
import { hashPassword, verifyPassword } from "../../lib/password.js";
import { createSession } from "../sessions/sessions.js";
import {
  createTenant,
  findTenantById,
  type Tenant,
} from "../tenants/tenants.repository.js";
import {
  createUser,
  findUserByEmail,
  type User,
} from "../users/users.repository.js";
import type { LoginInput, RegisterInput } from "./auth.schemas.js";

export async function register(input: RegisterInput) {
  // hash before opening the transaction: argon2 is deliberately slow,
  // and a transaction should hold its connection for as short as possible
  const passwordHash = await hashPassword(input.password);

  // all three rows or none: if the email is taken, the tenant insert is rolled back too
  return withTransaction(async (tx) => {
    const tenant = await createTenant(
      { name: input.businessName, slug: input.slug, timezone: input.timezone },
      tx,
    );
    const user = await createUser(
      { tenantId: tenant.id, email: input.email, passwordHash },
      tx,
    );
    const session = await createSession(user.id, tx);
    return { tenant, user, session };
  });
}

export async function login({ email, password }: LoginInput) {
  const found = await findUserByEmail(email);
  const valid = await verifyPassword(found?.passwordHash, password);

  if (!found || !valid)
    throw new UnauthorizedError(
      "INVALID_CREDENTIALS",
      "invalid email or password",
    );

  const { passwordHash: _, ...user } = found;
  const tenant = await loadTenant(user);
  const session = await createSession(user.id);
  return { user, tenant, session };
}

export async function getAccount(user: User) {
  return { user, tenant: await loadTenant(user) };
}

async function loadTenant(user: User): Promise<Tenant> {
  const tenant = await findTenantById(user.tenantId);

  if (!tenant)
    throw new Error(`tenant ${user.tenantId} not found for user ${user.id}`);
  return tenant;
}
