import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

/** One block of time a staff member works: local wall-clock time in the shop's timezone */
export type Range = { weekday: number; start: string; end: string };

const hoursKey = (staffId: string) => ["staff", staffId, "hours"] as const;

export function useWorkingHours(staffId: string) {
  return useQuery({
    queryKey: hoursKey(staffId),
    queryFn: async () =>
      (await api.get<{ hours: Range[] }>(`/staff/${staffId}/hours`)).hours,
  });
}

/** Replaces the whole week in one request, like the API's PUT */
export function useSaveWorkingHours(staffId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (hours: Range[]) =>
      (await api.put<{ hours: Range[] }>(`/staff/${staffId}/hours`, { hours }))
        .hours,
    // the PUT answers with the saved week, so it goes straight into the cache
    onSuccess: (hours) => queryClient.setQueryData(hoursKey(staffId), hours),
  });
}
