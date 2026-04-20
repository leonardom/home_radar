import { publicEnv } from "@/lib/env";

export type BackendAuthProvider = "password" | "google" | "facebook";

export type BackendAuthTokens = {
  accessToken: string;
  refreshToken: string;
  tokenType: "Bearer";
  expiresIn: number;
};

export type BackendValidationIssue = {
  path?: string;
  message: string;
};

type AuthErrorCode =
  | "unauthorized"
  | "conflict"
  | "rate_limited"
  | "validation"
  | "request_failed";

export class BackendAuthError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: AuthErrorCode,
    public readonly issues: BackendValidationIssue[] = [],
  ) {
    super(message);
    this.name = "BackendAuthError";
  }
}

const toAuthErrorCode = (status: number): AuthErrorCode => {
  if (status === 400) {
    return "validation";
  }

  if (status === 401) {
    return "unauthorized";
  }

  if (status === 409) {
    return "conflict";
  }

  if (status === 429) {
    return "rate_limited";
  }

  return "request_failed";
};

const toUserMessage = (status: number, fallbackMessage: string): string => {
  if (status === 401) {
    return "Your session is no longer valid. Please sign in again.";
  }

  if (status === 409) {
    return "We could not complete sign-in due to an account conflict.";
  }

  if (status === 429) {
    return "Too many attempts right now. Please wait and try again.";
  }

  return fallbackMessage;
};

const parseJson = async (response: Response): Promise<unknown> => {
  try {
    return await response.json();
  } catch {
    return null;
  }
};

const parseAuthError = async (
  response: Response,
): Promise<BackendAuthError> => {
  const body = await parseJson(response);
  const payload = body && typeof body === "object" ? body : null;

  const serverMessage =
    payload && "message" in payload && typeof payload.message === "string"
      ? payload.message
      : "Authentication request failed";

  const issues =
    payload && "issues" in payload && Array.isArray(payload.issues)
      ? payload.issues
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
          .filter((issue): issue is BackendValidationIssue => issue !== null)
      : [];

  return new BackendAuthError(
    toUserMessage(response.status, serverMessage),
    response.status,
    toAuthErrorCode(response.status),
    issues,
  );
};

const parseTokens = (payload: unknown): BackendAuthTokens => {
  if (!payload || typeof payload !== "object") {
    throw new Error("Invalid auth response payload");
  }

  const accessToken =
    "accessToken" in payload && typeof payload.accessToken === "string"
      ? payload.accessToken
      : null;
  const refreshToken =
    "refreshToken" in payload && typeof payload.refreshToken === "string"
      ? payload.refreshToken
      : null;
  const tokenType = "tokenType" in payload ? payload.tokenType : null;
  const expiresIn = "expiresIn" in payload ? payload.expiresIn : null;

  if (
    !accessToken ||
    !refreshToken ||
    tokenType !== "Bearer" ||
    typeof expiresIn !== "number" ||
    !Number.isFinite(expiresIn) ||
    expiresIn <= 0
  ) {
    throw new Error("Invalid auth response payload");
  }

  return {
    accessToken,
    refreshToken,
    tokenType,
    expiresIn,
  };
};

export const exchangeBackendSession = async (params: {
  provider: BackendAuthProvider;
  sessionToken: string;
}): Promise<BackendAuthTokens> => {
  const response = await fetch(
    `${publicEnv.NEXT_PUBLIC_API_BASE_URL}/auth/session/exchange`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params),
    },
  );

  if (!response.ok) {
    throw await parseAuthError(response);
  }

  return parseTokens(await parseJson(response));
};

export const refreshBackendSession = async (
  refreshToken: string,
): Promise<BackendAuthTokens> => {
  const response = await fetch(
    `${publicEnv.NEXT_PUBLIC_API_BASE_URL}/auth/refresh`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refreshToken }),
    },
  );

  if (!response.ok) {
    throw await parseAuthError(response);
  }

  return parseTokens(await parseJson(response));
};

export const logoutBackendSession = async (
  refreshToken: string,
): Promise<void> => {
  const response = await fetch(
    `${publicEnv.NEXT_PUBLIC_API_BASE_URL}/auth/logout`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refreshToken }),
    },
  );

  if (!response.ok) {
    throw await parseAuthError(response);
  }
};
