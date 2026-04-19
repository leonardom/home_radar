import { beforeEach, describe, expect, it, vi } from "vitest";

const { verifyTokenMock } = vi.hoisted(() => ({
  verifyTokenMock: vi.fn(),
}));

vi.mock("@clerk/backend", () => ({
  verifyToken: verifyTokenMock,
}));

vi.mock("../src/config/env", () => ({
  env: {
    CLERK_SECRET_KEY: "sk_test_123",
    CLERK_JWT_KEY: "jwt_key_123",
    CLERK_API_URL: undefined,
    CLERK_SKIP_JWKS_CACHE: false,
  },
}));

import {
  ClerkTokenAdapter,
  ClerkTokenValidationError,
} from "../src/modules/auth/clerk-token.adapter";

describe("ClerkTokenAdapter", () => {
  beforeEach(() => {
    verifyTokenMock.mockReset();
  });

  it("normalizes verified Clerk claims", async () => {
    verifyTokenMock.mockResolvedValue({
      data: {
        sub: "user_clerk_1",
        email_address: "User@Example.com",
        email_verified: true,
        given_name: "User",
        family_name: "Example",
        name: "User Example",
      },
    });

    const adapter = new ClerkTokenAdapter();
    const result = await adapter.verifySessionToken("token-value", "google");

    expect(result).toEqual({
      providerUserId: "user_clerk_1",
      email: "user@example.com",
      emailVerified: true,
      firstName: "User",
      lastName: "Example",
      fullName: "User Example",
    });
  });

  it("throws when Clerk verification returns errors", async () => {
    verifyTokenMock.mockResolvedValue({
      errors: [new Error("invalid token")],
    });

    const adapter = new ClerkTokenAdapter();

    await expect(adapter.verifySessionToken("invalid-token", "facebook")).rejects.toBeInstanceOf(
      ClerkTokenValidationError,
    );
  });
});
