import type { User } from "../modules/users/users.repository.js";

declare global {
  namespace Express {
    interface Request {
      user: User | null;
      /**
       * The business this request acts for. Set from the logged-in owner's session today;
       * public booking routes will set it from the URL's :slug later.
       */
      tenantId: string | null;
    }
  }
}

export {};
