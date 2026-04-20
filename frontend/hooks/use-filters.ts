import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { filtersApi } from "@/lib/api/endpoints";
import { queryKeys } from "@/lib/api/query-keys";
import type { CreateFilterPayload, UpdateFilterPayload } from "@/types/api";

const PROTECTED_QUERY_STALE_TIME_MS = 30_000;

export const useFiltersQuery = () =>
  useQuery({
    queryKey: queryKeys.filters.list(),
    queryFn: filtersApi.list,
    staleTime: PROTECTED_QUERY_STALE_TIME_MS,
    retry: 1,
  });

export const useCreateFilterMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateFilterPayload) => filtersApi.create(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.filters.list(),
      });
    },
  });
};

export const useUpdateFilterMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateFilterPayload;
    }) => filtersApi.update(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.filters.list(),
      });
    },
  });
};

export const useDeleteFilterMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => filtersApi.remove(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.filters.list(),
      });
    },
  });
};
