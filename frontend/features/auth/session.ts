import { useEffect, useState } from "react";
import { useAuth, useSession, useUser } from "@clerk/nextjs";
import { publicEnv } from "@/lib/env";

export function useBackendSession() {
  const { getToken, isSignedIn } = useAuth();
  const { session } = useSession();
  const { user } = useUser();
  const [backendToken, setBackendToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function exchangeToken() {
      if (!isSignedIn) {
        setBackendToken(null);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const clerkToken = await getToken();
        const res = await fetch(
          `${publicEnv.NEXT_PUBLIC_API_BASE_URL}/auth/session/exchange`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${clerkToken}`,
            },
          },
        );
        if (!res.ok) throw new Error("Failed to exchange session");
        const data = await res.json();
        setBackendToken(data.accessToken || null);
      } catch (err: any) {
        setError(err.message || "Unknown error");
        setBackendToken(null);
      } finally {
        setLoading(false);
      }
    }
    exchangeToken();
    // Only run on sign-in change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignedIn, session?.id, user?.id]);

  return { backendToken, loading, error };
}
