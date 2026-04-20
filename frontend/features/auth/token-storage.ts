import type { BackendAuthTokens } from "./auth-client";

export type StoredBackendTokens = {
  accessToken: string;
  refreshToken: string;
  tokenType: "Bearer";
  expiresAt: number;
};

const BACKEND_TOKENS_STORAGE_KEY = "home-radar.backend.tokens";
const REFRESH_SKEW_MS = 30_000;

let memoryTokens: StoredBackendTokens | null = null;

const hasSessionStorage = (): boolean =>
  typeof window !== "undefined" && typeof window.sessionStorage !== "undefined";

const readFromSessionStorage = (): StoredBackendTokens | null => {
  if (!hasSessionStorage()) {
    return null;
  }

  const rawValue = window.sessionStorage.getItem(BACKEND_TOKENS_STORAGE_KEY);

  if (!rawValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawValue) as Partial<StoredBackendTokens>;
    if (
      typeof parsed.accessToken !== "string" ||
      typeof parsed.refreshToken !== "string" ||
      parsed.tokenType !== "Bearer" ||
      typeof parsed.expiresAt !== "number"
    ) {
      return null;
    }

    return {
      accessToken: parsed.accessToken,
      refreshToken: parsed.refreshToken,
      tokenType: "Bearer",
      expiresAt: parsed.expiresAt,
    };
  } catch {
    return null;
  }
};

const writeToSessionStorage = (tokens: StoredBackendTokens | null): void => {
  if (!hasSessionStorage()) {
    return;
  }

  if (!tokens) {
    window.sessionStorage.removeItem(BACKEND_TOKENS_STORAGE_KEY);
    return;
  }

  window.sessionStorage.setItem(
    BACKEND_TOKENS_STORAGE_KEY,
    JSON.stringify(tokens),
  );
};

export const toStoredBackendTokens = (
  tokens: BackendAuthTokens,
): StoredBackendTokens => ({
  accessToken: tokens.accessToken,
  refreshToken: tokens.refreshToken,
  tokenType: tokens.tokenType,
  expiresAt: Date.now() + tokens.expiresIn * 1000,
});

export const setStoredBackendTokens = (tokens: StoredBackendTokens): void => {
  memoryTokens = tokens;
  writeToSessionStorage(tokens);
};

export const clearStoredBackendTokens = (): void => {
  memoryTokens = null;
  writeToSessionStorage(null);
};

export const getStoredBackendTokens = (): StoredBackendTokens | null => {
  const candidate = memoryTokens ?? readFromSessionStorage();

  if (!candidate) {
    return null;
  }

  if (candidate.expiresAt <= Date.now()) {
    clearStoredBackendTokens();
    return null;
  }

  memoryTokens = candidate;
  return candidate;
};

export const isBackendAccessTokenStale = (
  tokens: StoredBackendTokens,
): boolean => tokens.expiresAt - Date.now() <= REFRESH_SKEW_MS;
