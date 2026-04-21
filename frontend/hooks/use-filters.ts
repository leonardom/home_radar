import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { filtersApi } from "@/lib/api/endpoints";
import { queryKeys } from "@/lib/api/query-keys";
import type {
  CreateFilterPayload,
  FiltersListResponse,
  SearchFilter,
  UpdateFilterPayload,
} from "@/types/api";

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
    onMutate: async (payload: CreateFilterPayload) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.filters.list() });

      const previous = queryClient.getQueryData<FiltersListResponse>(
        queryKeys.filters.list(),
      );

      const optimistic: SearchFilter = {
        id: `tmp-${Date.now()}`,
        priceMin: payload.priceMin ?? null,
        priceMax: payload.priceMax ?? null,
        bedroomsMin: payload.bedroomsMin ?? null,
        bedroomsMax: payload.bedroomsMax ?? null,
        bathroomsMin: payload.bathroomsMin ?? null,
        bathroomsMax: payload.bathroomsMax ?? null,
        location: payload.location ?? null,
        propertyType: payload.propertyType ?? null,
        keywords: payload.keywords ?? [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      queryClient.setQueryData<FiltersListResponse>(queryKeys.filters.list(), {
        items: [...(previous?.items ?? []), optimistic],
      });

      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.filters.list(), context.previous);
      }
    },
    onSettled: async () => {
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
    // Optimistic update for edit
    onMutate: async ({ id, payload }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.filters.list() });
      const previous = queryClient.getQueryData<FiltersListResponse>(
        queryKeys.filters.list(),
      );
      if (!previous) return { previous };
      queryClient.setQueryData<FiltersListResponse>(queryKeys.filters.list(), {
        items: previous.items.map((item) =>
          item.id === id
            ? {
                ...item,
                ...payload,
                keywords: payload.keywords ?? item.keywords,
                updatedAt: new Date().toISOString(),
              }
            : item,
        ),
      });
      return { previous };
    },
    // Rollback on error
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.filters.list(), context.previous);
      }
    },
    // Always refetch after mutation
    onSettled: async () => {
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
    // Optimistic update for delete
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.filters.list() });
      const previous = queryClient.getQueryData<FiltersListResponse>(
        queryKeys.filters.list(),
      );
      if (!previous) return { previous };
      queryClient.setQueryData<FiltersListResponse>(queryKeys.filters.list(), {
        items: previous.items.filter((item) => item.id !== id),
      });
      return { previous };
    },
    // Rollback on error
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.filters.list(), context.previous);
      }
    },
    // Always refetch after mutation
    onSettled: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.filters.list(),
      });
    },
  });
};
