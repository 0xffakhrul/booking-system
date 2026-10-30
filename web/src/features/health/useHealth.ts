import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export type Health = { ok: boolean; db: "up" | "down" };

export function useHealth() {
  return useQuery({
    queryKey: ["health"],
    queryFn: () => api.get<Health>("/health"),
    refetchInterval: 10_000, // so you can watch it flip when you stop the API
  });
}
