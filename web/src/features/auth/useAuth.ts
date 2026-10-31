import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { LoginInput, RegisterInput } from "./auth.schemas";
import { meQueryKey, type Account } from "./useMe";

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: LoginInput) => api.post<Account>("/auth/login", input),
    // login returns the same { user, tenant } as /me, so no extra request
    onSuccess: (account) => queryClient.setQueryData(meQueryKey, account),
  });
}

export function useRegister() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: RegisterInput) =>
      api.post<Account>("/auth/register", {
        ...input,
        // the browser's timezone, e.g. "Asia/Kuala_Lumpur"; the API validates it
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      }),
    onSuccess: (account) => queryClient.setQueryData(meQueryKey, account),
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.post<void>("/auth/logout"),
    onSuccess: () => {
      // RequireAuth is watching "me", so update it (not delete it) and it redirects to /login
      queryClient.setQueryData(meQueryKey, null);
      // drop every other cached response, so the next owner on this browser sees nothing of ours
      queryClient.removeQueries({
        predicate: (query) => query.queryKey[0] !== meQueryKey[0],
      });
    },
  });
}
