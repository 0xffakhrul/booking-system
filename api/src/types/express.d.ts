import type { User } from "../modules/users/users.repository.js";

declare global {
  namespace Express {
    interface Request {
      user: User | null;
      /**
       * The business this request acts for: from the logged-in owner's session, or from the
       * URL's :slug on public routes. tenantTransaction uses it for Row-Level Security.
       */
      tenantId: string | null;
    }
  }
}

export {};
