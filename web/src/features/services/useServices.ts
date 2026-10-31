import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export type Service = {
  id: string;
  name: string;
  durationMin: number;
  price: number; // sen
  active: boolean;
};
export type ServiceInput = Pick<Service, "name" | "durationMin" | "price">;

const servicesKey = ["services"] as const;

export function useServices() {
  return useQuery({
    queryKey: servicesKey,
    queryFn: async () =>
      (await api.get<{ services: Service[] }>("/services")).services,
  });
}

// Each mutation refetches the list when it succeeds. Returning the promise from onSuccess
// makes mutateAsync wait for the refetch, so a dialog closes onto the updated list.

export function useCreateService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ServiceInput) =>
      api.post<{ service: Service }>("/services", input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: servicesKey }),
  });
}

export function useUpdateService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...patch }: ServiceInput & { id: string }) =>
      api.patch<{ service: Service }>(`/services/${id}`, patch),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: servicesKey }),
  });
}

export function useDeleteService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<void>(`/services/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: servicesKey }),
  });
}
