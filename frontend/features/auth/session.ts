import { useAuth, useSession, useUser } from "@clerk/nextjs";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BackendAuthError,
  exchangeBackendSession,
  logoutBackendSession,
  refreshBackendSession,
  type BackendAuthProvider,
} from "./auth-client";
import {
  clearStoredBackendTokens,
  getStoredBackendTokens,
  isBackendAccessTokenStale,
  setStoredBackendTokens,
  toStoredBackendTokens,
} from "./token-storage";

type UseBackendSessionResult = {
  backendToken: string | null;
  loading: boolean;
  error: string | null;
  errorCode: BackendAuthError["code"] | null;
  refresh: () => Promise<string | null>;
  logout: () => Promise<void>;
};

const resolveProvider = (
  externalProviderName: string | undefined,
): BackendAuthProvider => {
  if (externalProviderName === "google") {
    return "google";
  }

  if (externalProviderName === "facebook") {
    return "facebook";
  }

  return "password";
};

const parseError = (
  error: unknown,
): { message: string; code: BackendAuthError["code"] | null } => {
  if (error instanceof BackendAuthError) {
    return {
      message: error.message,
      code: error.code,
    };
  }

  if (error instanceof Error) {
    return { message: error.message, code: null };
  }

  return { message: "Authentication failed", code: null };
};

export function useBackendSession(): UseBackendSessionResult {
  const { getToken, isSignedIn } = useAuth();
  const { session } = useSession();
  const { user } = useUser();
  const [backendToken, setBackendToken] = useState<string | null>(
    () => getStoredBackendTokens()?.accessToken ?? null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<BackendAuthError["code"] | null>(
    null,
  );

  const provider = useMemo<BackendAuthProvider>(() => {
    const firstExternal = user?.externalAccounts?.at(0);
    const externalProviderName = firstExternal?.provider?.toLowerCase();
    return resolveProvider(externalProviderName);
  }, [user?.externalAccounts]);

  const saveTokens = useCallback(
    (tokens: {
      accessToken: string;
      refreshToken: string;
      tokenType: "Bearer";
      expiresIn: number;
    }) => {
      const stored = toStoredBackendTokens(tokens);
      setStoredBackendTokens(stored);
      setBackendToken(stored.accessToken);
    },
    [],
  );

  const refresh = useCallback(async (): Promise<string | null> => {
    const current = getStoredBackendTokens();
    if (!current) {
      return null;
    }

    try {
      const refreshed = await refreshBackendSession(current.refreshToken);
      saveTokens(refreshed);
      setError(null);
      setErrorCode(null);
      return refreshed.accessToken;
    } catch (refreshError: unknown) {
      const parsedError = parseError(refreshError);
      clearStoredBackendTokens();
      setBackendToken(null);
      setError(parsedError.message);
      setErrorCode(parsedError.code);
      return null;
    }
  }, [saveTokens]);

  const logout = useCallback(async (): Promise<void> => {
    const current = getStoredBackendTokens();

    try {
      if (current?.refreshToken) {
        await logoutBackendSession(current.refreshToken);
      }
    } finally {
      clearStoredBackendTokens();
      setBackendToken(null);
      setError(null);
      setErrorCode(null);
    }
  }, []);

  useEffect(() => {
    const exchangeToken = async (): Promise<void> => {
      if (!isSignedIn) {
        clearStoredBackendTokens();
        setBackendToken(null);
        setError(null);
        setErrorCode(null);
        return;
      }

      const existing = getStoredBackendTokens();
      if (existing && !isBackendAccessTokenStale(existing)) {
        setBackendToken(existing.accessToken);
        return;
      }

      if (existing && isBackendAccessTokenStale(existing)) {
        const refreshedToken = await refresh();
        if (refreshedToken) {
          return;
        }
      }

      setLoading(true);
      setError(null);
      setErrorCode(null);

      try {
        const clerkToken = await getToken();

        if (!clerkToken) {
          throw new Error("Missing Clerk session token");
        }

        const tokens = await exchangeBackendSession({
          provider,
          sessionToken: clerkToken,
        });

        saveTokens(tokens);
      } catch (exchangeError: unknown) {
        const parsedError = parseError(exchangeError);
        clearStoredBackendTokens();
        setBackendToken(null);
        setError(parsedError.message);
        setErrorCode(parsedError.code);
      } finally {
        setLoading(false);
      }
    };

    exchangeToken();
  }, [
    getToken,
    isSignedIn,
    provider,
    refresh,
    saveTokens,
    session?.id,
    user?.id,
  ]);

  useEffect(() => {
    const current = getStoredBackendTokens();
    if (!current) {
      return;
    }

    const msUntilRefresh = current.expiresAt - Date.now() - 60_000;
    const timeout = window.setTimeout(
      () => {
        void refresh();
      },
      Math.max(msUntilRefresh, 0),
    );

    return () => {
      window.clearTimeout(timeout);
    };
  }, [backendToken, refresh]);

  return { backendToken, loading, error, errorCode, refresh, logout };
}
