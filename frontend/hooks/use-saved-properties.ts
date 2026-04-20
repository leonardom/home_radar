import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { savedPropertiesApi } from "@/lib/api/endpoints";
import { queryKeys } from "@/lib/api/query-keys";
import type {
  ListSavedPropertiesParams,
  SavePropertyPayload,
} from "@/types/api";

const PROTECTED_QUERY_STALE_TIME_MS = 30_000;

export const useSavedPropertiesQuery = (
  params: ListSavedPropertiesParams = {},
) =>
  useQuery({
    queryKey: queryKeys.savedProperties.list(params),
    queryFn: () => savedPropertiesApi.list(params),
    staleTime: PROTECTED_QUERY_STALE_TIME_MS,
    retry: 1,
  });

export const useSavePropertyMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SavePropertyPayload) =>
      savedPropertiesApi.save(payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: queryKeys.savedProperties.all,
        }),
        queryClient.invalidateQueries({ queryKey: queryKeys.matches.me() }),
      ]);
    },
  });
};

export const useRemoveSavedPropertyMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (propertyId: string) => savedPropertiesApi.remove(propertyId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: queryKeys.savedProperties.all,
        }),
        queryClient.invalidateQueries({ queryKey: queryKeys.matches.me() }),
      ]);
    },
  });
};
