import { useQuery } from "@tanstack/react-query";
import type { CurrentUser } from "@ratama/shared";
import { apiFetch } from "@/lib/api";

export function useCurrentUser() {
  return useQuery({
    queryKey: ["current-user"],
    queryFn: () => apiFetch<CurrentUser>("/auth/me"),
    retry: false,
    staleTime: 60_000
  });
}
