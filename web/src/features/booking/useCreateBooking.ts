import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { availabilityKey } from "./useAvailability";

export type BookingRequest = {
  serviceId: string;
  start: string;
  staffId?: string; // left out for "anyone": the server picks whoever is free
  customerName: string;
  customerPhone: string;
};

/** What the API sends back: a ref, never the id or the phone number */
export type Booking = {
  ref: string;
  service: { id: string; name: string; durationMin: number };
  staff: { id: string; name: string };
  customerName: string;
  start: string;
  end: string;
  status: "confirmed" | "cancelled";
  source: "online" | "manual";
};

/** POST /api/public/:slug/bookings; without a staffId the server picks whoever is free */
export function useCreateBooking(slug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: BookingRequest) =>
      (await api.post<{ booking: Booking }>(`/public/${slug}/bookings`, input))
        .booking,
    // booked or beaten to it, the free times just changed
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: availabilityKey(slug) }),
  });
}
