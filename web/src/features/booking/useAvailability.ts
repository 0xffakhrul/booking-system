import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export type Slot = { start: string; end: string; staffIds: string[] };
export type Availability = { date: string; timezone: string; slots: Slot[] };

/** every availability query for one business starts with this, so they can all be refreshed at once */
export const availabilityKey = (slug: string) =>
  ["public", slug, "availability"] as const;

/**
 * Free start times for a service on a date (the business's calendar), no login.
 * With a staffId, only that person's free times; without, anyone's.
 */
export function useAvailability(
  slug: string,
  serviceId: string | null,
  date: string,
  staffId: string | null,
) {
  return useQuery({
    queryKey: [...availabilityKey(slug), serviceId, date, staffId],
    queryFn: () =>
      api.get<Availability>(
        `/public/${slug}/availability?${new URLSearchParams({
          serviceId: serviceId!,
          date,
          ...(staffId && { staffId }),
        })}`,
      ),
    enabled: serviceId !== null,
    staleTime: 30_000, // other customers are booking too, so don't trust it for long
  });
}
