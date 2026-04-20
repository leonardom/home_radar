import { useQuery } from "@tanstack/react-query";
import { matchesApi } from "@/lib/api/endpoints";
import { queryKeys } from "@/lib/api/query-keys";

const PROTECTED_QUERY_STALE_TIME_MS = 30_000;

export const useMatchesQuery = () =>
  useQuery({
    queryKey: queryKeys.matches.me(),
    queryFn: matchesApi.listMe,
    staleTime: PROTECTED_QUERY_STALE_TIME_MS,
    retry: 1,
  });
