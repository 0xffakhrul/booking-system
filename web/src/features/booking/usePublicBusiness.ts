import { useQuery } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api";

export type PublicService = {
  id: string;
  name: string;
  durationMin: number;
  price: number; // sen
};

export type PublicBusiness = {
  business: { name: string; slug: string; timezone: string };
  services: PublicService[];
  staff: { id: string; name: string }[];
};

/** Everything the booking page needs to start: GET /api/public/:slug, no login */
export function usePublicBusiness(slug: string) {
  return useQuery({
    queryKey: ["public", slug],
    queryFn: () => api.get<PublicBusiness>(`/public/${slug}`),
    // a 404 is a wrong link, so asking again won't help
    retry: (count, err) =>
      !(err instanceof ApiError && err.status === 404) && count < 1,
  });
}
