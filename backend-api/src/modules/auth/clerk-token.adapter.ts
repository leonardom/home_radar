import { verifyToken } from "@clerk/backend";
import { z } from "zod";

import { env } from "../../config/env";
import type { AuthProvider } from "./user-identities.types";

const ClerkClaimsSchema = z
  .object({
    sub: z.string().min(1),
    email: z.string().email().optional(),
    email_address: z.string().email().optional(),
    email_verified: z.union([z.boolean(), z.string()]).optional(),
    given_name: z.string().optional(),
    family_name: z.string().optional(),
    name: z.string().optional(),
  })
  .passthrough();

export type VerifiedClerkIdentity = {
  providerUserId: string;
  email: string | null;
  emailVerified: boolean;
  firstName: string | null;
  lastName: string | null;
  fullName: string | null;
};

export class ClerkTokenValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ClerkTokenValidationError";
  }
}

export class ClerkTokenAdapter {
  async verifySessionToken(token: string, provider: AuthProvider): Promise<VerifiedClerkIdentity> {
    if (!env.CLERK_SECRET_KEY && !env.CLERK_JWT_KEY) {
      throw new ClerkTokenValidationError(
        "Clerk verification keys are not configured (CLERK_SECRET_KEY or CLERK_JWT_KEY)",
      );
    }

    const result = await verifyToken(token, {
      secretKey: env.CLERK_SECRET_KEY,
      jwtKey: env.CLERK_JWT_KEY,
      apiUrl: env.CLERK_API_URL,
      skipJwksCache: env.CLERK_SKIP_JWKS_CACHE,
    });

    const errors = "errors" in result ? (result.errors as unknown) : undefined;
    if (Array.isArray(errors) && errors.length > 0) {
      const firstError = errors[0];
      const message =
        typeof firstError === "object" && firstError !== null && "message" in firstError
          ? String((firstError as { message?: string }).message)
          : "Invalid Clerk token";

      throw new ClerkTokenValidationError(`${provider} token verification failed: ${message}`);
    }

    const claims = ClerkClaimsSchema.parse(result.data);
    const email = (claims.email ?? claims.email_address ?? null)?.toLowerCase() ?? null;

    return {
      providerUserId: claims.sub,
      email,
      emailVerified: this.asBoolean(claims.email_verified),
      firstName: claims.given_name ?? null,
      lastName: claims.family_name ?? null,
      fullName: claims.name ?? null,
    };
  }

  private asBoolean(value: boolean | string | undefined): boolean {
    if (typeof value === "boolean") {
      return value;
    }

    if (typeof value === "string") {
      return value.toLowerCase() === "true";
    }

    return false;
  }
}
