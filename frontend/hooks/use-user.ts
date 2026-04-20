import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { usersApi } from "@/lib/api/endpoints";
import { queryKeys } from "@/lib/api/query-keys";
import type {
  LinkAuthProviderPayload,
  UpdateUserPreferencesPayload,
  UpdateUserProfilePayload,
} from "@/types/api";

const PROTECTED_QUERY_STALE_TIME_MS = 30_000;

export const useMeQuery = () =>
  useQuery({
    queryKey: queryKeys.user.me(),
    queryFn: usersApi.getMe,
    staleTime: PROTECTED_QUERY_STALE_TIME_MS,
    retry: 1,
  });

export const useAuthProvidersQuery = () =>
  useQuery({
    queryKey: queryKeys.auth.providers(),
    queryFn: usersApi.getAuthProviders,
    staleTime: PROTECTED_QUERY_STALE_TIME_MS,
    retry: 1,
  });

export const useUserPreferencesQuery = () =>
  useQuery({
    queryKey: queryKeys.user.preferences(),
    queryFn: usersApi.getPreferences,
    staleTime: PROTECTED_QUERY_STALE_TIME_MS,
    retry: 1,
  });

export const useUpdateMeMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateUserProfilePayload) =>
      usersApi.updateMe(payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.user.me() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.auth.providers() }),
      ]);
    },
  });
};

export const useUpdateUserPreferencesMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateUserPreferencesPayload) =>
      usersApi.updatePreferences(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.user.preferences(),
      });
    },
  });
};

export const useLinkAuthProviderMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: LinkAuthProviderPayload) =>
      usersApi.linkAuthProvider(payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.auth.providers() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.user.me() }),
      ]);
    },
  });
};

export const useUnlinkAuthProviderMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (provider: "google" | "facebook") =>
      usersApi.unlinkAuthProvider(provider),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.auth.providers() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.user.me() }),
      ]);
    },
  });
};
