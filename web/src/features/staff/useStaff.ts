import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export type Staff = { id: string; name: string; active: boolean };

const staffKey = ["staff"] as const;

export function useStaff() {
  return useQuery({
    queryKey: staffKey,
    queryFn: async () => (await api.get<{ staff: Staff[] }>("/staff")).staff,
  });
}

export function useCreateStaff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { name: string }) =>
      api.post<{ staff: Staff }>("/staff", input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: staffKey }),
  });
}

export function useUpdateStaff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      api.patch<{ staff: Staff }>(`/staff/${id}`, { name }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: staffKey }),
  });
}

export function useDeleteStaff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<void>(`/staff/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: staffKey }),
  });
}
