import { apiClient } from "./client";
import type {
  CreateFilterPayload,
  FiltersListResponse,
  LinkAuthProviderPayload,
  ListSavedPropertiesParams,
  MatchesListResponse,
  SavePropertyPayload,
  SavedProperty,
  SavedPropertiesListResponse,
  SearchFilter,
  UpdateFilterPayload,
  UpdateUserPreferencesPayload,
  UpdateUserProfilePayload,
  UserAuthProviders,
  UserPreferences,
  UserProfile,
} from "@/types/api";

const buildSavedPropertiesQuery = (
  params: ListSavedPropertiesParams = {},
): string => {
  const searchParams = new URLSearchParams();

  if (params.limit !== undefined) {
    searchParams.set("limit", String(params.limit));
  }

  if (params.offset !== undefined) {
    searchParams.set("offset", String(params.offset));
  }

  if (params.sortBy) {
    searchParams.set("sortBy", params.sortBy);
  }

  if (params.sortOrder) {
    searchParams.set("sortOrder", params.sortOrder);
  }

  const query = searchParams.toString();
  return query ? `/saved-properties?${query}` : "/saved-properties";
};

export const usersApi = {
  getMe: () => apiClient.get<UserProfile>("/users/me"),

  updateMe: (payload: UpdateUserProfilePayload) =>
    apiClient.patch<UserProfile>("/users/me", payload),

  getAuthProviders: () =>
    apiClient.get<UserAuthProviders>("/users/me/auth-providers"),

  linkAuthProvider: (payload: LinkAuthProviderPayload) =>
    apiClient.post<UserAuthProviders>("/users/me/auth-providers/link", payload),

  unlinkAuthProvider: (provider: "google" | "facebook") =>
    apiClient.remove<UserAuthProviders>(`/users/me/auth-providers/${provider}`),

  getPreferences: () => apiClient.get<UserPreferences>("/users/me/preferences"),

  updatePreferences: (payload: UpdateUserPreferencesPayload) =>
    apiClient.patch<UserPreferences>("/users/me/preferences", payload),
};

export const filtersApi = {
  list: () => apiClient.get<FiltersListResponse>("/filters"),

  create: (payload: CreateFilterPayload) =>
    apiClient.post<SearchFilter>("/filters", payload),

  update: (id: string, payload: UpdateFilterPayload) =>
    apiClient.patch<SearchFilter>(`/filters/${id}`, payload),

  remove: (id: string) => apiClient.remove<null>(`/filters/${id}`),
};

export const matchesApi = {
  listMe: () => apiClient.get<MatchesListResponse>("/matches/me"),
};

export const savedPropertiesApi = {
  list: (params?: ListSavedPropertiesParams) =>
    apiClient.get<SavedPropertiesListResponse>(
      buildSavedPropertiesQuery(params),
    ),

  save: (payload: SavePropertyPayload) =>
    apiClient.post<SavedProperty>("/saved-properties", payload),

  remove: (propertyId: string) =>
    apiClient.remove<null>(`/saved-properties/${propertyId}`),
};
