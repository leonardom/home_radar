import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { savedPropertiesApi } from "@/lib/api/endpoints";
import { queryKeys } from "@/lib/api/query-keys";
import type {
  ListSavedPropertiesParams,
  SavedPropertiesListResponse,
  SavedProperty,
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
    onMutate: async (payload: SavePropertyPayload) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.savedProperties.all,
      });

      const previousLists =
        queryClient.getQueriesData<SavedPropertiesListResponse>({
          queryKey: queryKeys.savedProperties.all,
        });

      for (const [key, value] of previousLists) {
        if (!value) {
          continue;
        }

        const exists = value.items.some(
          (item) => item.propertyId === payload.propertyId,
        );
        if (exists) {
          continue;
        }

        const optimisticItem: SavedProperty = {
          id: `tmp-${payload.propertyId}`,
          userId: "optimistic",
          propertyId: payload.propertyId,
          savedAt: new Date().toISOString(),
          property: {
            id: payload.propertyId,
            source: "optimistic",
            externalListingId: payload.propertyId,
            title: "Saving...",
            price: 0,
            bedrooms: null,
            bathrooms: null,
            location: "",
            propertyType: "",
            url: "",
            status: "pending",
            lastSeenAt: new Date().toISOString(),
          },
        };

        queryClient.setQueryData<SavedPropertiesListResponse>(key, {
          items: [optimisticItem, ...value.items],
        });
      }

      return { previousLists };
    },
    onError: (_error, _variables, context) => {
      for (const [key, value] of context?.previousLists ?? []) {
        queryClient.setQueryData(key, value);
      }
    },
    onSettled: async () => {
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
    onMutate: async (propertyId: string) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.savedProperties.all,
      });

      const previousLists =
        queryClient.getQueriesData<SavedPropertiesListResponse>({
          queryKey: queryKeys.savedProperties.all,
        });

      for (const [key, value] of previousLists) {
        if (!value) {
          continue;
        }

        queryClient.setQueryData<SavedPropertiesListResponse>(key, {
          items: value.items.filter((item) => item.propertyId !== propertyId),
        });
      }

      return { previousLists };
    },
    onError: (_error, _variables, context) => {
      for (const [key, value] of context?.previousLists ?? []) {
        queryClient.setQueryData(key, value);
      }
    },
    onSettled: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: queryKeys.savedProperties.all,
        }),
        queryClient.invalidateQueries({ queryKey: queryKeys.matches.me() }),
      ]);
    },
  });
};
