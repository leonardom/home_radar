import {
  clearStoredBackendTokens,
  getStoredBackendTokens,
  setStoredBackendTokens,
  toStoredBackendTokens,
} from "@/features/auth/token-storage";
import { publicEnv } from "@/lib/env";
import { refreshBackendSession } from "@/features/auth/auth-client";

export class ApiClientError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code:
      | "validation"
      | "unauthorized"
      | "forbidden"
      | "not_found"
      | "conflict"
      | "rate_limited"
      | "server_error"
      | "request_failed",
    public readonly issues: Array<{ path?: string; message: string }> = [],
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

type ApiRequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  headers?: HeadersInit;
  includeAuth?: boolean;
  retryOnAuth?: boolean;
};

const toApiErrorCode = (
  status: number,
):
  | "validation"
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "conflict"
  | "rate_limited"
  | "server_error"
  | "request_failed" => {
  if (status === 400 || status === 422) {
    return "validation";
  }

  if (status === 401) {
    return "unauthorized";
  }

  if (status === 403) {
    return "forbidden";
  }

  if (status === 404) {
    return "not_found";
  }

  if (status === 409) {
    return "conflict";
  }

  if (status === 429) {
    return "rate_limited";
  }

  if (status >= 500) {
    return "server_error";
  }

  return "request_failed";
};

const parseJson = async (response: Response): Promise<unknown> => {
  if (response.status === 204) {
    return null;
  }

  try {
    return await response.json();
  } catch {
    return null;
  }
};

const normalizePath = (path: string): string => {
  if (!path.startsWith("/")) {
    return `/${path}`;
  }

  return path;
};

const parseIssues = (
  payload: unknown,
): Array<{ path?: string; message: string }> => {
  if (!payload || typeof payload !== "object" || !("issues" in payload)) {
    return [];
  }

  const issues = payload.issues;
  if (!Array.isArray(issues)) {
    return [];
  }

  return issues
    .map((issue) => {
      if (!issue || typeof issue !== "object") {
        return null;
      }

      const message =
        "message" in issue && typeof issue.message === "string"
          ? issue.message
          : null;

      if (!message) {
        return null;
      }

      const path =
        "path" in issue && typeof issue.path === "string"
          ? issue.path
          : undefined;

      return { message, path };
    })
    .filter(
      (issue): issue is { path?: string; message: string } => issue !== null,
    );
};

const parseErrorMessage = (payload: unknown, status: number): string => {
  if (
    payload &&
    typeof payload === "object" &&
    "message" in payload &&
    typeof payload.message === "string"
  ) {
    return payload.message;
  }

  if (status === 401) {
    return "Your session is no longer valid. Please sign in again.";
  }

  if (status === 429) {
    return "Too many requests. Please wait and try again.";
  }

  return "Request failed";
};

const buildHeaders = (
  headers: HeadersInit | undefined,
  includeAuth: boolean,
): Headers => {
  const nextHeaders = new Headers(headers);

  if (!nextHeaders.has("Content-Type")) {
    nextHeaders.set("Content-Type", "application/json");
  }

  if (includeAuth) {
    const stored = getStoredBackendTokens();
    if (stored?.accessToken) {
      nextHeaders.set("Authorization", `Bearer ${stored.accessToken}`);
    }
  }

  return nextHeaders;
};

const tryRefreshAuth = async (): Promise<boolean> => {
  const stored = getStoredBackendTokens();

  if (!stored?.refreshToken) {
    clearStoredBackendTokens();
    return false;
  }

  try {
    const refreshed = await refreshBackendSession(stored.refreshToken);
    setStoredBackendTokens(toStoredBackendTokens(refreshed));
    return true;
  } catch {
    clearStoredBackendTokens();
    return false;
  }
};

const request = async <T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> => {
  const {
    method = "GET",
    body,
    headers,
    includeAuth = true,
    retryOnAuth = true,
  } = options;

  const response = await fetch(
    `${publicEnv.NEXT_PUBLIC_API_BASE_URL}${normalizePath(path)}`,
    {
      method,
      headers: buildHeaders(headers, includeAuth),
      body: body === undefined ? undefined : JSON.stringify(body),
    },
  );

  if (response.status === 401 && includeAuth && retryOnAuth) {
    const refreshed = await tryRefreshAuth();
    if (refreshed) {
      return request<T>(path, {
        ...options,
        retryOnAuth: false,
      });
    }
  }

  if (!response.ok) {
    const payload = await parseJson(response);
    const message = parseErrorMessage(payload, response.status);
    const code = toApiErrorCode(response.status);
    throw new ApiClientError(
      message,
      response.status,
      code,
      parseIssues(payload),
    );
  }

  return (await parseJson(response)) as T;
};

export const apiClient = {
  get: <T>(
    path: string,
    options?: Omit<ApiRequestOptions, "method" | "body">,
  ) => request<T>(path, { ...options, method: "GET" }),

  post: <T>(
    path: string,
    body?: unknown,
    options?: Omit<ApiRequestOptions, "method" | "body">,
  ) => request<T>(path, { ...options, method: "POST", body }),

  patch: <T>(
    path: string,
    body?: unknown,
    options?: Omit<ApiRequestOptions, "method" | "body">,
  ) => request<T>(path, { ...options, method: "PATCH", body }),

  put: <T>(
    path: string,
    body?: unknown,
    options?: Omit<ApiRequestOptions, "method" | "body">,
  ) => request<T>(path, { ...options, method: "PUT", body }),

  remove: <T>(
    path: string,
    options?: Omit<ApiRequestOptions, "method" | "body">,
  ) => request<T>(path, { ...options, method: "DELETE" }),
};
