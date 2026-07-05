import type { QueryClient } from "@tanstack/react-query";

export function invalidateMany(queryClient: QueryClient, queryKeys: string[]) {
  for (const queryKey of queryKeys) {
    void queryClient.invalidateQueries({ queryKey: [queryKey] });
  }
}
