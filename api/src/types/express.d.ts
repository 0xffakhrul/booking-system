import type { User } from "../modules/users/users.repository.js";

declare global {
  namespace Express {
    interface Request {
      user: User | null;
    }
  }
}

export {};
