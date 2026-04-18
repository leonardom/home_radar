import { describe, expect, it } from "vitest";

import { TokenService } from "../src/modules/auth/token.service";

describe("TokenService", () => {
  it("creates and verifies access token with required claims", () => {
    const service = new TokenService();

    const { token } = service.createAccessToken({
      sub: "01a4c5ea-7d51-4dc5-9ae2-7726a983eb30",
      email: "user@example.com",
    });

    const payload = service.verifyAccessToken(token);

    expect(payload.sub).toBe("01a4c5ea-7d51-4dc5-9ae2-7726a983eb30");
    expect(payload.email).toBe("user@example.com");
    expect(payload.type).toBe("access");
    expect(payload.jti).toBeTypeOf("string");
    expect(payload.iat).toBeTypeOf("number");
    expect(payload.exp).toBeTypeOf("number");
  });

  it("hashes refresh token deterministically", () => {
    const service = new TokenService();
    const refreshToken = "fixed-refresh-token";

    const hash1 = service.hashRefreshToken(refreshToken);
    const hash2 = service.hashRefreshToken(refreshToken);

    expect(hash1).toBe(hash2);
  });

  it("generates future refresh token expiration date", () => {
    const service = new TokenService();
    const expiresAt = service.getRefreshTokenExpiresAt();

    expect(expiresAt.getTime()).toBeGreaterThan(Date.now());
  });
});
