import { beforeEach, describe, expect, it, vi } from "vitest";
import { DuplicateEmailError } from "../src/modules/users/users.errors";

const {
  checkDatabaseMock,
  createUserMock,
  findByEmailMock,
  findByIdMock,
  hashPasswordMock,
  verifyPasswordMock,
  createAccessTokenMock,
  verifyAccessTokenMock,
  generateRefreshTokenMock,
  hashRefreshTokenMock,
  getRefreshTokenExpiresAtMock,
  refreshCreateMock,
  refreshFindActiveByTokenHashMock,
  refreshRevokeByIdMock,
  refreshRevokeByTokenHashMock,
} = vi.hoisted(() => {
  return {
    checkDatabaseMock: vi.fn<() => Promise<void>>(),
    createUserMock: vi.fn<() => Promise<unknown>>(),
    findByEmailMock: vi.fn<() => Promise<unknown>>(),
    findByIdMock: vi.fn<() => Promise<unknown>>(),
    hashPasswordMock: vi.fn<() => Promise<string>>(),
    verifyPasswordMock: vi.fn<() => Promise<boolean>>(),
    createAccessTokenMock: vi.fn<() => { token: string; expiresIn: number }>(),
    verifyAccessTokenMock: vi.fn<() => unknown>(),
    generateRefreshTokenMock: vi.fn<() => string>(),
    hashRefreshTokenMock: vi.fn<() => string>(),
    getRefreshTokenExpiresAtMock: vi.fn<() => Date>(),
    refreshCreateMock: vi.fn<() => Promise<void>>(),
    refreshFindActiveByTokenHashMock: vi.fn<() => Promise<unknown>>(),
    refreshRevokeByIdMock: vi.fn<() => Promise<void>>(),
    refreshRevokeByTokenHashMock: vi.fn<() => Promise<void>>(),
  };
});

vi.mock("../src/modules/health/health.repository", () => {
  class HealthRepository {
    checkDatabase = checkDatabaseMock;
  }

  return { HealthRepository };
});

vi.mock("../src/modules/users/users.repository", () => {
  class UsersRepository {
    createUser = createUserMock;
    findByEmail = findByEmailMock;
    findById = findByIdMock;
  }

  return { UsersRepository };
});

vi.mock("../src/modules/auth/password.service", () => {
  class PasswordService {
    hashPassword = hashPasswordMock;
    verifyPassword = verifyPasswordMock;
  }

  return { PasswordService };
});

vi.mock("../src/modules/auth/token.service", () => {
  class TokenService {
    createAccessToken = createAccessTokenMock;
    verifyAccessToken = verifyAccessTokenMock;
    generateRefreshToken = generateRefreshTokenMock;
    hashRefreshToken = hashRefreshTokenMock;
    getRefreshTokenExpiresAt = getRefreshTokenExpiresAtMock;
  }

  return { TokenService };
});

vi.mock("../src/modules/auth/refresh-tokens.repository", () => {
  class RefreshTokensRepository {
    create = refreshCreateMock;
    findActiveByTokenHash = refreshFindActiveByTokenHashMock;
    revokeById = refreshRevokeByIdMock;
    revokeByTokenHash = refreshRevokeByTokenHashMock;
  }

  return { RefreshTokensRepository };
});

import { buildApp } from "../src/app";

describe("API routes", () => {
  beforeEach(() => {
    checkDatabaseMock.mockReset();
    createUserMock.mockReset();
    findByEmailMock.mockReset();
    findByIdMock.mockReset();
    hashPasswordMock.mockReset();
    verifyPasswordMock.mockReset();
    createAccessTokenMock.mockReset();
    verifyAccessTokenMock.mockReset();
    generateRefreshTokenMock.mockReset();
    hashRefreshTokenMock.mockReset();
    getRefreshTokenExpiresAtMock.mockReset();
    refreshCreateMock.mockReset();
    refreshFindActiveByTokenHashMock.mockReset();
    refreshRevokeByIdMock.mockReset();
    refreshRevokeByTokenHashMock.mockReset();

    checkDatabaseMock.mockResolvedValue(undefined);
    hashPasswordMock.mockResolvedValue("hashed-password");
    verifyPasswordMock.mockResolvedValue(true);
    createAccessTokenMock.mockReturnValue({ token: "access-token", expiresIn: 900 });
    verifyAccessTokenMock.mockReturnValue({
      sub: "01a4c5ea-7d51-4dc5-9ae2-7726a983eb30",
      email: "user@example.com",
      jti: "token-jti",
      type: "access",
      iat: 1,
      exp: 2,
    });
    generateRefreshTokenMock.mockReturnValue("refresh-token");
    hashRefreshTokenMock.mockReturnValue("refresh-token-hash");
    getRefreshTokenExpiresAtMock.mockReturnValue(new Date("2026-05-01T12:00:00.000Z"));
    refreshCreateMock.mockResolvedValue(undefined);
    refreshFindActiveByTokenHashMock.mockResolvedValue({
      id: "5b4cf6a8-7e48-4f41-8d70-16f02702ed70",
      userId: "01a4c5ea-7d51-4dc5-9ae2-7726a983eb30",
      tokenHash: "refresh-token-hash",
      expiresAt: new Date("2026-05-01T12:00:00.000Z"),
      revokedAt: null,
      createdAt: new Date("2026-04-18T12:00:00.000Z"),
    });
    refreshRevokeByIdMock.mockResolvedValue(undefined);
    refreshRevokeByTokenHashMock.mockResolvedValue(undefined);

    findByEmailMock.mockResolvedValue({
      id: "01a4c5ea-7d51-4dc5-9ae2-7726a983eb30",
      email: "user@example.com",
      passwordHash: "hashed-password",
      status: "active",
      createdAt: new Date("2026-04-18T12:00:00.000Z"),
      updatedAt: new Date("2026-04-18T12:00:00.000Z"),
    });
    findByIdMock.mockResolvedValue({
      id: "01a4c5ea-7d51-4dc5-9ae2-7726a983eb30",
      email: "user@example.com",
      passwordHash: "hashed-password",
      status: "active",
      createdAt: new Date("2026-04-18T12:00:00.000Z"),
      updatedAt: new Date("2026-04-18T12:00:00.000Z"),
    });

    createUserMock.mockResolvedValue({
      id: "01a4c5ea-7d51-4dc5-9ae2-7726a983eb30",
      email: "user@example.com",
      passwordHash: "hashed-password",
      status: "active",
      createdAt: new Date("2026-04-18T12:00:00.000Z"),
      updatedAt: new Date("2026-04-18T12:00:00.000Z"),
    });
  });

  it("returns health status", async () => {
    const app = await buildApp();

    const response = await app.inject({
      method: "GET",
      url: "/api/health",
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().status).toBe("ok");

    await app.close();
  });

  it("registers user successfully", async () => {
    const app = await buildApp();

    const response = await app.inject({
      method: "POST",
      url: "/api/auth/register",
      payload: {
        email: "User@Example.com",
        password: "StrongPass123",
      },
    });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toMatchObject({
      id: "01a4c5ea-7d51-4dc5-9ae2-7726a983eb30",
      email: "user@example.com",
      status: "active",
    });
    expect(response.json().passwordHash).toBeUndefined();

    await app.close();
  });

  it("returns 400 for invalid registration payload", async () => {
    const app = await buildApp();

    const response = await app.inject({
      method: "POST",
      url: "/api/auth/register",
      payload: {
        email: "invalid-email",
        password: "weak",
      },
    });

    expect(response.statusCode).toBe(400);

    await app.close();
  });

  it("returns 409 when email is duplicated", async () => {
    createUserMock.mockRejectedValueOnce(new DuplicateEmailError("user@example.com"));
    const app = await buildApp();

    const response = await app.inject({
      method: "POST",
      url: "/api/auth/register",
      payload: {
        email: "user@example.com",
        password: "StrongPass123",
      },
    });

    expect(response.statusCode).toBe(409);
    expect(response.json()).toEqual({ message: "Email already in use" });

    await app.close();
  });

  it("logs in successfully", async () => {
    const app = await buildApp();

    const response = await app.inject({
      method: "POST",
      url: "/api/auth/login",
      payload: {
        email: "user@example.com",
        password: "StrongPass123",
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      accessToken: "access-token",
      refreshToken: "refresh-token",
      tokenType: "Bearer",
      expiresIn: 900,
    });

    await app.close();
  });

  it("returns 401 for invalid login credentials", async () => {
    verifyPasswordMock.mockResolvedValueOnce(false);
    const app = await buildApp();

    const response = await app.inject({
      method: "POST",
      url: "/api/auth/login",
      payload: {
        email: "user@example.com",
        password: "WrongPass123",
      },
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toEqual({ message: "Invalid credentials" });

    await app.close();
  });

  it("refreshes token successfully", async () => {
    const app = await buildApp();

    const response = await app.inject({
      method: "POST",
      url: "/api/auth/refresh",
      payload: {
        refreshToken: "refresh-token",
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().accessToken).toBe("access-token");
    expect(refreshRevokeByIdMock).toHaveBeenCalledTimes(1);

    await app.close();
  });

  it("returns 401 when refresh token is invalid", async () => {
    refreshFindActiveByTokenHashMock.mockResolvedValueOnce(null);
    const app = await buildApp();

    const response = await app.inject({
      method: "POST",
      url: "/api/auth/refresh",
      payload: {
        refreshToken: "invalid-refresh-token",
      },
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toEqual({ message: "Invalid refresh token" });

    await app.close();
  });

  it("revokes refresh token on logout", async () => {
    const app = await buildApp();

    const response = await app.inject({
      method: "POST",
      url: "/api/auth/logout",
      payload: {
        refreshToken: "refresh-token",
      },
    });

    expect(response.statusCode).toBe(204);
    expect(refreshRevokeByTokenHashMock).toHaveBeenCalledTimes(1);

    await app.close();
  });

  it("returns authenticated profile with bearer token", async () => {
    const app = await buildApp();

    const response = await app.inject({
      method: "GET",
      url: "/api/auth/me",
      headers: {
        authorization: "Bearer access-token",
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      id: "01a4c5ea-7d51-4dc5-9ae2-7726a983eb30",
      email: "user@example.com",
      status: "active",
    });

    await app.close();
  });

  it("returns 401 without bearer token on protected endpoint", async () => {
    const app = await buildApp();

    const response = await app.inject({
      method: "GET",
      url: "/api/auth/me",
    });

    expect(response.statusCode).toBe(401);

    await app.close();
  });
});
