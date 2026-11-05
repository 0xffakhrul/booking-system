import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

/** The API's Booking (docs/api.md: Bookings). start and end are UTC instants. */
export type Booking = {
  id: string;
  ref: string;
  service: { id: string; name: string; durationMin: number };
  staff: { id: string; name: string };
  customerName: string;
  customerPhone: string;
  start: string;
  end: string;
  status: "confirmed" | "cancelled";
  source: "online" | "manual";
};

/** every bookings query starts with this, so a later change can refresh them all at once */
export const bookingsKey = ["bookings"] as const;

/** One day's bookings, cancelled included. `date` is the business's calendar date. */
export function useBookings(date: string) {
  return useQuery({
    queryKey: [...bookingsKey, date],
    queryFn: async () =>
      (
        await api.get<{ bookings: Booking[] }>(
          `/bookings?${new URLSearchParams({ date })}`,
        )
      ).bookings,
    // refetchOnWindowFocus is on by default: switch back to this tab and new bookings appear
  });
}
