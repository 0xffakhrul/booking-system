import { useQuery } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api";

export type User = { id: string; email: string; role: "owner" };
export type Tenant = {
  id: string;
  name: string;
  slug: string;
  timezone: string;
};
export type Account = { user: User; tenant: Tenant };

export const meQueryKey = ["me"] as const;

/** The logged-in account, or null when logged out. The session cookie is the source of truth. */
export function useMe() {
  return useQuery({
    queryKey: meQueryKey,
    queryFn: async (): Promise<Account | null> => {
      try {
        return await api.get<Account>("/auth/me");
      } catch (err) {
        // logged out is a normal state, not an error
        if (err instanceof ApiError && err.status === 401) return null;
        throw err;
      }
    },
    staleTime: 5 * 60_000, // don't re-ask on every page change
  });
}
