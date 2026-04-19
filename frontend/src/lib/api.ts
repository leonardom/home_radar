type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  token?: string;
  body?: unknown;
};

import { clearSession, getSession, setSession } from "./session";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const API_BASE =
  process.env.NEXT_PUBLIC_BACKEND_API_URL?.replace(/\/$/, "") ??
  "http://localhost:4000/api";

const request = async <T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> => {
  const response = await fetch(`${API_BASE}${path}`, {
    method: options.method ?? "GET",
    headers: {
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      ...(options.body ? { "Content-Type": "application/json" } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
    cache: "no-store",
  });

  const contentType = response.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");
  const payload = isJson
    ? ((await response.json()) as Record<string, unknown>)
    : null;

  if (!response.ok) {
    const message =
      payload && typeof payload.message === "string"
        ? payload.message
        : `Request failed with status ${response.status}`;
    throw new ApiError(message, response.status);
  }

  if (response.status === 204) {
    return null as T;
  }

  return payload as T;
};

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
  tokenType: "Bearer";
  expiresIn: number;
};

export type FilterItem = {
  id: string;
  priceMin: number | null;
  priceMax: number | null;
  bedroomsMin: number | null;
  bedroomsMax: number | null;
  bathroomsMin: number | null;
  bathroomsMax: number | null;
  location: string | null;
  propertyType:
    | "apartment"
    | "house"
    | "bungalow"
    | "land"
    | "commercial"
    | "other"
    | null;
  keywords: string[];
  createdAt: string;
  updatedAt: string;
};

export type SavedListingItem = {
  id: string;
  userId: string;
  propertyId: string;
  savedAt: string;
  property: {
    id: string;
    source: string;
    externalListingId: string;
    title: string;
    price: number | null;
    bedrooms: number | null;
    bathrooms: number | null;
    location: string | null;
    propertyType:
      | "house"
      | "apartment"
      | "land"
      | "commercial"
      | "other"
      | null;
    url: string | null;
    status: "active" | "inactive";
    lastSeenAt: string;
  };
};

export type MatchItem = {
  id: string;
  userId: string;
  propertyId: string;
  filterId: string | null;
  matchReasons: string[];
  matchedAt: string;
  createdAt: string;
};

export type NotificationsStatus = {
  metrics: {
    pendingCount: number;
    sentCount: number;
    failedCount: number;
  };
  failed: Array<{
    id: string;
    status: string;
    attemptCount: number;
    failureReason: string | null;
  }>;
};

export type SyncStatus = {
  states: Array<{
    key: string;
    lastSyncAt: string | null;
    lagSeconds: number | null;
  }>;
};

export const login = (email: string, password: string) => {
  return request<AuthTokens>("/auth/login", {
    method: "POST",
    body: { email, password },
  });
};

export const refresh = (refreshToken: string) => {
  return request<AuthTokens>("/auth/refresh", {
    method: "POST",
    body: { refreshToken },
  });
};

export const logout = (refreshToken: string) => {
  return request<void>("/auth/logout", {
    method: "POST",
    body: { refreshToken },
  });
};

export const withAuthenticatedSession = async <T>(
  operation: (accessToken: string) => Promise<T>,
): Promise<T> => {
  const session = getSession();
  if (!session) {
    throw new ApiError("You are not authenticated. Please login first.", 401);
  }

  try {
    return await operation(session.accessToken);
  } catch (caught) {
    if (!(caught instanceof ApiError) || caught.status !== 401) {
      throw caught;
    }

    try {
      const nextTokens = await refresh(session.refreshToken);
      setSession({
        accessToken: nextTokens.accessToken,
        refreshToken: nextTokens.refreshToken,
      });
      return await operation(nextTokens.accessToken);
    } catch (refreshError) {
      clearSession();
      throw refreshError;
    }
  }
};

export const register = (name: string, email: string, password: string) => {
  return request("/auth/register", {
    method: "POST",
    body: { name, email, password },
  });
};

export const getFilters = (token: string) => {
  return request<{ items: FilterItem[] }>("/filters", { token });
};

export const createFilter = (
  token: string,
  payload: {
    location?: string;
    propertyType?: FilterItem["propertyType"];
    priceMin?: number;
    priceMax?: number;
    bedroomsMin?: number;
    keywords?: string[];
  },
) => {
  return request<FilterItem>("/filters", {
    method: "POST",
    token,
    body: payload,
  });
};

export const deleteFilter = (token: string, filterId: string) => {
  return request<void>(`/filters/${filterId}`, {
    method: "DELETE",
    token,
  });
};

export const getSavedListings = (token: string) => {
  return request<{ items: SavedListingItem[] }>(
    "/saved-properties?limit=50&offset=0&sortBy=savedAt&sortOrder=desc",
    { token },
  );
};

export const saveListing = (token: string, propertyId: string) => {
  return request<SavedListingItem>("/saved-properties", {
    method: "POST",
    token,
    body: { propertyId },
  });
};

export const removeSavedListing = (token: string, propertyId: string) => {
  return request<void>(`/saved-properties/${propertyId}`, {
    method: "DELETE",
    token,
  });
};

export const getMatches = (token: string) => {
  return request<{ items: MatchItem[] }>("/matches/me", { token });
};

export const getNotificationsStatus = (token: string) => {
  return request<NotificationsStatus>("/notifications/status", { token });
};

export const getSyncStatus = (token: string) => {
  return request<SyncStatus>("/sync/status", { token });
};
