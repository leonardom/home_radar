import { beforeEach, describe, expect, it, vi } from "vitest";
import { ClerkTokenValidationError } from "../src/modules/auth/clerk-token.adapter";
import { oauthRateLimitService } from "../src/modules/auth/oauth-rate-limit.service";
import { oauthReplayProtectionService } from "../src/modules/auth/oauth-security.service";

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
  refreshRevokeByUserIdMock,
  createFilterMock,
  listFiltersByUserMock,
  updateFilterByIdMock,
  deleteFilterByIdMock,
  countFiltersByUserMock,
  savePropertyMock,
  listSavedByUserMock,
  removeSavedByUserAndPropertyMock,
  isSavedByUserMock,
  propertyExistsMock,
  createMatchMock,
  findMatchMock,
  listMatchesByUserMock,
  listMatchesByPropertyMock,
  listSyncStatesMock,
  getOrCreateNotificationPreferenceMock,
  updateNotificationPreferenceMock,
  listFailedNotificationsMock,
  getNotificationMetricsMock,
  findByProviderIdentityMock,
  listIdentitiesByUserIdMock,
  linkIdentityMock,
  unlinkIdentityMock,
  verifyClerkSessionTokenMock,
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
    refreshRevokeByUserIdMock: vi.fn<() => Promise<void>>(),
    createFilterMock: vi.fn<() => Promise<unknown>>(),
    listFiltersByUserMock: vi.fn<() => Promise<unknown[]>>(),
    updateFilterByIdMock: vi.fn<() => Promise<unknown>>(),
    deleteFilterByIdMock: vi.fn<() => Promise<boolean>>(),
    countFiltersByUserMock: vi.fn<() => Promise<number>>(),
    savePropertyMock: vi.fn<() => Promise<unknown>>(),
    listSavedByUserMock: vi.fn<() => Promise<unknown[]>>(),
    removeSavedByUserAndPropertyMock: vi.fn<() => Promise<boolean>>(),
    isSavedByUserMock: vi.fn<() => Promise<boolean>>(),
    propertyExistsMock: vi.fn<() => Promise<boolean>>(),
    createMatchMock: vi.fn<() => Promise<unknown>>(),
    findMatchMock: vi.fn<() => Promise<unknown>>(),
    listMatchesByUserMock: vi.fn<() => Promise<unknown[]>>(),
    listMatchesByPropertyMock: vi.fn<() => Promise<unknown[]>>(),
    listSyncStatesMock: vi.fn<() => Promise<unknown[]>>(),
    getOrCreateNotificationPreferenceMock: vi.fn<() => Promise<unknown>>(),
    updateNotificationPreferenceMock: vi.fn<() => Promise<unknown>>(),
    listFailedNotificationsMock: vi.fn<() => Promise<unknown[]>>(),
    getNotificationMetricsMock: vi.fn<() => Promise<unknown>>(),
    findByProviderIdentityMock: vi.fn<() => Promise<unknown>>(),
    listIdentitiesByUserIdMock: vi.fn<() => Promise<unknown[]>>(),
    linkIdentityMock: vi.fn<() => Promise<unknown>>(),
    unlinkIdentityMock: vi.fn<() => Promise<boolean>>(),
    verifyClerkSessionTokenMock: vi.fn<() => Promise<unknown>>(),
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
    updateProfile = findByIdMock;
    softDeleteById = vi.fn<() => Promise<boolean>>().mockResolvedValue(true);
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
    revokeByUserId = refreshRevokeByUserIdMock;
  }

  return { RefreshTokensRepository };
});

vi.mock("../src/modules/filters/filters.repository", () => {
  class FiltersRepository {
    createFilter = createFilterMock;
    listFiltersByUser = listFiltersByUserMock;
    updateFilterById = updateFilterByIdMock;
    deleteFilterById = deleteFilterByIdMock;
    countFiltersByUser = countFiltersByUserMock;
  }

  return { FiltersRepository };
});

vi.mock("../src/modules/saved-properties/saved-properties.repository", () => {
  class SavedPropertiesRepository {
    saveProperty = savePropertyMock;
    listSavedByUser = listSavedByUserMock;
    removeSavedByUserAndProperty = removeSavedByUserAndPropertyMock;
    isSavedByUser = isSavedByUserMock;
    propertyExists = propertyExistsMock;
  }

  return { SavedPropertiesRepository };
});

vi.mock("../src/modules/matches/matches.repository", () => {
  class MatchesRepository {
    createMatch = createMatchMock;
    findMatch = findMatchMock;
    listMatchesByUser = listMatchesByUserMock;
    listMatchesByProperty = listMatchesByPropertyMock;
  }

  return { MatchesRepository };
});

vi.mock("../src/modules/properties/sync-state.repository", () => {
  class SyncStateRepository {
    getLastSyncAt = vi.fn();
    setLastSyncAt = vi.fn();
    listStates = listSyncStatesMock;
  }

  return { SyncStateRepository };
});

vi.mock("../src/modules/notification-preferences/notification-preferences.repository", () => {
  class NotificationPreferencesRepository {
    getOrCreateByUserId = getOrCreateNotificationPreferenceMock;
    updateMode = updateNotificationPreferenceMock;
  }

  return { NotificationPreferencesRepository };
});

vi.mock("../src/modules/auth/user-identities.repository", () => {
  class UserIdentitiesRepository {
    findByProviderIdentity = findByProviderIdentityMock;
    listByUserId = listIdentitiesByUserIdMock;
    linkIdentity = linkIdentityMock;
    unlinkIdentity = unlinkIdentityMock;
  }

  return { UserIdentitiesRepository };
});

vi.mock("../src/modules/auth/clerk-token.adapter", () => {
  class ClerkTokenAdapter {
    verifySessionToken = verifyClerkSessionTokenMock;
  }

  class ClerkTokenValidationError extends Error {
    constructor(message: string) {
      super(message);
      this.name = "ClerkTokenValidationError";
    }
  }

  return { ClerkTokenAdapter, ClerkTokenValidationError };
});

vi.mock("../src/modules/notifications/notifications.repository", () => {
  class NotificationsRepository {
    listFailed = listFailedNotificationsMock;
    getDeliveryMetrics = getNotificationMetricsMock;
  }

  return { NotificationsRepository };
});

import { buildApp } from "../src/app";

describe("API routes", () => {
  beforeEach(() => {
    oauthRateLimitService.configureForTests(3, 60_000);
    oauthReplayProtectionService.resetForTests();
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
    refreshRevokeByUserIdMock.mockReset();
    createFilterMock.mockReset();
    listFiltersByUserMock.mockReset();
    updateFilterByIdMock.mockReset();
    deleteFilterByIdMock.mockReset();
    countFiltersByUserMock.mockReset();
    savePropertyMock.mockReset();
    listSavedByUserMock.mockReset();
    removeSavedByUserAndPropertyMock.mockReset();
    isSavedByUserMock.mockReset();
    propertyExistsMock.mockReset();
    createMatchMock.mockReset();
    findMatchMock.mockReset();
    listMatchesByUserMock.mockReset();
    listMatchesByPropertyMock.mockReset();
    listSyncStatesMock.mockReset();
    getOrCreateNotificationPreferenceMock.mockReset();
    updateNotificationPreferenceMock.mockReset();
    listFailedNotificationsMock.mockReset();
    getNotificationMetricsMock.mockReset();
    findByProviderIdentityMock.mockReset();
    listIdentitiesByUserIdMock.mockReset();
    linkIdentityMock.mockReset();
    unlinkIdentityMock.mockReset();
    verifyClerkSessionTokenMock.mockReset();

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
    refreshRevokeByUserIdMock.mockResolvedValue(undefined);
    countFiltersByUserMock.mockResolvedValue(2);

    const filterFixture = {
      id: "ceffb7eb-cded-4a75-8a5e-53f7f3f577f7",
      userId: "01a4c5ea-7d51-4dc5-9ae2-7726a983eb30",
      priceMin: 100000,
      priceMax: 300000,
      bedroomsMin: 2,
      bedroomsMax: 4,
      bathroomsMin: 1,
      bathroomsMax: 2,
      location: "Douglas",
      propertyType: "house",
      keywords: ["garden", "parking"],
      createdAt: new Date("2026-04-18T12:00:00.000Z"),
      updatedAt: new Date("2026-04-18T12:00:00.000Z"),
    };

    createFilterMock.mockResolvedValue(filterFixture);
    listFiltersByUserMock.mockResolvedValue([filterFixture]);
    updateFilterByIdMock.mockResolvedValue(filterFixture);
    deleteFilterByIdMock.mockResolvedValue(true);

    const savedPropertyFixture = {
      id: "2b8893e5-fd5a-4cbc-a4db-5f6de1d98a41",
      userId: "01a4c5ea-7d51-4dc5-9ae2-7726a983eb30",
      propertyId: "6bf9032e-d7fb-405a-9df8-7281d5f6f3e6",
      savedAt: new Date("2026-04-18T12:30:00.000Z"),
      property: {
        id: "6bf9032e-d7fb-405a-9df8-7281d5f6f3e6",
        source: "chrystals",
        externalListingId: "listing-123",
        title: "Modern apartment in Douglas",
        price: 250000,
        bedrooms: 2,
        bathrooms: 1,
        location: "Douglas",
        propertyType: "apartment",
        url: "https://example.com/listing-123",
        status: "active",
        lastSeenAt: new Date("2026-04-18T12:00:00.000Z"),
      },
    };

    propertyExistsMock.mockResolvedValue(true);
    isSavedByUserMock.mockResolvedValue(true);
    savePropertyMock.mockResolvedValue({
      item: savedPropertyFixture,
      created: true,
    });
    listSavedByUserMock.mockResolvedValue([savedPropertyFixture]);
    removeSavedByUserAndPropertyMock.mockResolvedValue(true);

    const matchFixture = {
      id: "c0cc3103-c012-46e0-b7b0-1f4299a58f0f",
      userId: "01a4c5ea-7d51-4dc5-9ae2-7726a983eb30",
      propertyId: "6bf9032e-d7fb-405a-9df8-7281d5f6f3e6",
      filterId: "ceffb7eb-cded-4a75-8a5e-53f7f3f577f7",
      matchReasons: ["price_range", "location"],
      matchedAt: new Date("2026-04-18T12:00:00.000Z"),
      createdAt: new Date("2026-04-18T12:00:00.000Z"),
    };

    createMatchMock.mockResolvedValue(matchFixture);
    findMatchMock.mockResolvedValue(matchFixture);
    listMatchesByUserMock.mockResolvedValue([matchFixture]);
    listMatchesByPropertyMock.mockResolvedValue([matchFixture]);
    listSyncStatesMock.mockResolvedValue([
      {
        key: "scraper:listings:all",
        lastSyncAt: new Date("2026-04-18T11:58:00.000Z"),
      },
    ]);
    getOrCreateNotificationPreferenceMock.mockResolvedValue({
      userId: "01a4c5ea-7d51-4dc5-9ae2-7726a983eb30",
      mode: "instant",
      createdAt: new Date("2026-04-18T12:00:00.000Z"),
      updatedAt: new Date("2026-04-18T12:00:00.000Z"),
    });
    updateNotificationPreferenceMock.mockResolvedValue({
      userId: "01a4c5ea-7d51-4dc5-9ae2-7726a983eb30",
      mode: "digest",
      createdAt: new Date("2026-04-18T12:00:00.000Z"),
      updatedAt: new Date("2026-04-18T13:00:00.000Z"),
    });
    getNotificationMetricsMock.mockResolvedValue({
      pendingCount: 2,
      sentCount: 5,
      failedCount: 1,
    });
    listFailedNotificationsMock.mockResolvedValue([
      {
        id: "d99d02fe-cdde-4e52-8bb1-281fdad2a5a5",
        userId: "01a4c5ea-7d51-4dc5-9ae2-7726a983eb30",
        matchId: "c0cc3103-c012-46e0-b7b0-1f4299a58f0f",
        status: "failed",
        attemptCount: 3,
        lastAttemptAt: new Date("2026-04-18T14:00:00.000Z"),
        sentAt: null,
        failedAt: new Date("2026-04-18T14:00:00.000Z"),
        failureReason: "SendGrid timeout",
        updatedAt: new Date("2026-04-18T14:00:00.000Z"),
      },
    ]);
    findByProviderIdentityMock.mockResolvedValue(null);
    listIdentitiesByUserIdMock.mockResolvedValue([]);
    linkIdentityMock.mockResolvedValue({
      id: "identity-1",
      userId: "01a4c5ea-7d51-4dc5-9ae2-7726a983eb30",
      provider: "google",
      providerUserId: "google-user-1",
      email: "user@example.com",
      createdAt: new Date("2026-04-18T12:00:00.000Z"),
    });
    verifyClerkSessionTokenMock.mockResolvedValue({
      providerUserId: "google-user-1",
      email: "user@example.com",
      emailVerified: true,
      firstName: "User",
      lastName: "Example",
      fullName: "User Example",
    });
    unlinkIdentityMock.mockResolvedValue(true);

    findByEmailMock.mockResolvedValue({
      id: "01a4c5ea-7d51-4dc5-9ae2-7726a983eb30",
      name: "User Example",
      email: "user@example.com",
      passwordHash: "hashed-password",
      status: "active",
      createdAt: new Date("2026-04-18T12:00:00.000Z"),
      updatedAt: new Date("2026-04-18T12:00:00.000Z"),
    });
    findByIdMock.mockResolvedValue({
      id: "01a4c5ea-7d51-4dc5-9ae2-7726a983eb30",
      name: "User Example",
      email: "user@example.com",
      passwordHash: "hashed-password",
      status: "active",
      createdAt: new Date("2026-04-18T12:00:00.000Z"),
      updatedAt: new Date("2026-04-18T12:00:00.000Z"),
      deletedAt: null,
    });

    createUserMock.mockResolvedValue({
      id: "01a4c5ea-7d51-4dc5-9ae2-7726a983eb30",
      name: "User Example",
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
    expect(response.json().auth?.clerk?.mode).toBe("optional");
    expect(response.json().auth?.clerk?.ready).toBe(false);

    await app.close();
  });

  it("authenticates with Clerk session exchange (password)", async () => {
    const app = await buildApp();
    const response = await app.inject({
      method: "POST",
      url: "/api/auth/session/exchange",
      payload: {
        provider: "password",
        sessionToken: "clerk-session-token-password",
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

  it("authenticates with Clerk session exchange (google)", async () => {
    const app = await buildApp();
    const response = await app.inject({
      method: "POST",
      url: "/api/auth/session/exchange",
      payload: {
        provider: "google",
        sessionToken: "clerk-session-token-google",
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

  it("provisions a new user on first Clerk session exchange when no account exists", async () => {
    findByEmailMock.mockResolvedValueOnce(null);
    const app = await buildApp();
    const response = await app.inject({
      method: "POST",
      url: "/api/auth/session/exchange",
      payload: {
        provider: "google",
        sessionToken: "clerk-session-token-new-user",
      },
    });
    expect(response.statusCode).toBe(200);
    expect(createUserMock).toHaveBeenCalledTimes(1);
    await app.close();
  });

  it("provisions a new user on first Clerk password session exchange when no account exists", async () => {
    findByEmailMock.mockResolvedValueOnce(null);
    const app = await buildApp();
    const response = await app.inject({
      method: "POST",
      url: "/api/auth/session/exchange",
      payload: {
        provider: "password",
        sessionToken: "clerk-session-token-password-new-user",
      },
    });

    expect(response.statusCode).toBe(200);
    expect(createUserMock).toHaveBeenCalledTimes(1);
    await app.close();
  });

  it("returns 401 for invalid Clerk session token in session exchange", async () => {
    verifyClerkSessionTokenMock.mockRejectedValueOnce(
      new ClerkTokenValidationError("invalid session token"),
    );
    const app = await buildApp();
    const response = await app.inject({
      method: "POST",
      url: "/api/auth/session/exchange",
      payload: {
        provider: "google",
        sessionToken: "invalid-token",
      },
    });
    expect(response.statusCode).toBe(401);
    await app.close();
  });

  it("returns 400 for missing or unverified email in Clerk session exchange", async () => {
    verifyClerkSessionTokenMock.mockResolvedValueOnce({
      providerUserId: "google-user-2",
      email: null,
      emailVerified: false,
      firstName: null,
      lastName: null,
      fullName: null,
    });
    const app = await buildApp();
    const response = await app.inject({
      method: "POST",
      url: "/api/auth/session/exchange",
      payload: {
        provider: "google",
        sessionToken: "clerk-session-token-unverified",
      },
    });
    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({ message: "A verified email is required for Clerk login" });
    await app.close();
  });

  it("returns 409 when Clerk identity is linked to another user in session exchange", async () => {
    findByEmailMock.mockResolvedValueOnce({
      id: "01a4c5ea-7d51-4dc5-9ae2-7726a983eb30",
      name: "User Example",
      email: "user@example.com",
      passwordHash: "hashed-password",
      status: "active",
      createdAt: new Date("2026-04-18T12:00:00.000Z"),
      updatedAt: new Date("2026-04-18T12:00:00.000Z"),
    });
    linkIdentityMock.mockResolvedValueOnce({
      id: "identity-conflict",
      userId: "other-user-id",
      provider: "google",
      providerUserId: "google-user-2",
      email: "user@example.com",
      createdAt: new Date("2026-04-18T12:00:00.000Z"),
    });
    const app = await buildApp();
    const response = await app.inject({
      method: "POST",
      url: "/api/auth/session/exchange",
      payload: {
        provider: "google",
        sessionToken: "clerk-session-token-conflict",
      },
    });
    expect(response.statusCode).toBe(409);
    expect(response.json()).toEqual({ message: "Clerk identity already linked to another user" });
    await app.close();
  });

  it("returns 400 for invalid provider or sessionToken in session exchange", async () => {
    const app = await buildApp();
    const response = await app.inject({
      method: "POST",
      url: "/api/auth/session/exchange",
      payload: {
        provider: "apple",
        sessionToken: "",
      },
    });
    expect(response.statusCode).toBe(400);
    await app.close();
  });

  it("returns 429 when session exchange rate limit is exceeded", async () => {
    const app = await buildApp();
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const response = await app.inject({
        method: "POST",
        url: "/api/auth/session/exchange",
        headers: {
          "x-forwarded-for": "203.0.113.12",
        },
        payload: {
          provider: "google",
          sessionToken: `clerk-session-token-rate-${attempt}`,
        },
      });
      expect(response.statusCode).toBe(200);
    }
    const limitedResponse = await app.inject({
      method: "POST",
      url: "/api/auth/session/exchange",
      headers: {
        "x-forwarded-for": "203.0.113.12",
      },
      payload: {
        provider: "google",
        sessionToken: "clerk-session-token-rate-final",
      },
    });
    expect(limitedResponse.statusCode).toBe(429);
    expect(limitedResponse.json()).toEqual({
      message: "Too many session exchange attempts, please retry later",
    });
    await app.close();
  });

  it("returns 409 for replayed Clerk session exchange attempts", async () => {
    const app = await buildApp();
    const payload = {
      provider: "google",
      sessionToken: "clerk-session-token-replay",
    };
    const first = await app.inject({
      method: "POST",
      url: "/api/auth/session/exchange",
      payload,
    });
    const replay = await app.inject({
      method: "POST",
      url: "/api/auth/session/exchange",
      payload,
    });
    expect(first.statusCode).toBe(200);
    expect(replay.statusCode).toBe(409);
    expect(replay.json()).toEqual({ message: "Session exchange replay detected" });
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
    listIdentitiesByUserIdMock.mockResolvedValueOnce([
      {
        id: "identity-google-1",
        userId: "01a4c5ea-7d51-4dc5-9ae2-7726a983eb30",
        provider: "google",
        providerUserId: "google-user-1",
        email: "user@example.com",
        createdAt: new Date("2026-04-18T12:00:00.000Z"),
      },
    ]);
    const app = await buildApp();

    const response = await app.inject({
      method: "GET",
      url: "/api/users/me",
      headers: {
        authorization: "Bearer access-token",
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      id: "01a4c5ea-7d51-4dc5-9ae2-7726a983eb30",
      name: "User Example",
      email: "user@example.com",
      linkedProviders: ["password", "google"],
      status: "active",
      createdAt: "2026-04-18T12:00:00.000Z",
      updatedAt: "2026-04-18T12:00:00.000Z",
      deletedAt: null,
    });

    await app.close();
  });

  it("returns 401 without bearer token on protected endpoint", async () => {
    const app = await buildApp();

    const response = await app.inject({
      method: "GET",
      url: "/api/users/me",
    });

    expect(response.statusCode).toBe(401);

    await app.close();
  });

  it("returns linked auth providers for authenticated user", async () => {
    listIdentitiesByUserIdMock.mockResolvedValueOnce([
      {
        id: "identity-google-1",
        userId: "01a4c5ea-7d51-4dc5-9ae2-7726a983eb30",
        provider: "google",
        providerUserId: "google-user-1",
        email: "user@example.com",
        createdAt: new Date("2026-04-18T12:00:00.000Z"),
      },
      {
        id: "identity-facebook-1",
        userId: "01a4c5ea-7d51-4dc5-9ae2-7726a983eb30",
        provider: "facebook",
        providerUserId: "facebook-user-1",
        email: "user@example.com",
        createdAt: new Date("2026-04-18T12:00:00.000Z"),
      },
    ]);
    const app = await buildApp();

    const response = await app.inject({
      method: "GET",
      url: "/api/users/me/auth-providers",
      headers: {
        authorization: "Bearer access-token",
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      userId: "01a4c5ea-7d51-4dc5-9ae2-7726a983eb30",
      linkedProviders: ["password", "google", "facebook"],
    });

    await app.close();
  });

  it("links oauth provider for authenticated user", async () => {
    listIdentitiesByUserIdMock.mockResolvedValueOnce([
      {
        id: "identity-google-1",
        userId: "01a4c5ea-7d51-4dc5-9ae2-7726a983eb30",
        provider: "google",
        providerUserId: "google-user-1",
        email: "user@example.com",
        createdAt: new Date("2026-04-18T12:00:00.000Z"),
      },
    ]);

    const app = await buildApp();

    const response = await app.inject({
      method: "POST",
      url: "/api/users/me/auth-providers/link",
      headers: {
        authorization: "Bearer access-token",
      },
      payload: {
        provider: "google",
        sessionToken: "oauth-session-token",
        state: "oauth_state_link_google_12345",
        nonce: "oauth_nonce_link_google_12345",
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      userId: "01a4c5ea-7d51-4dc5-9ae2-7726a983eb30",
      linkedProviders: ["password", "google"],
    });

    await app.close();
  });

  it("returns 429 when oauth link rate limit is exceeded", async () => {
    const app = await buildApp();

    for (let attempt = 0; attempt < 3; attempt += 1) {
      const response = await app.inject({
        method: "POST",
        url: "/api/users/me/auth-providers/link",
        headers: {
          authorization: "Bearer access-token",
          "x-forwarded-for": "203.0.113.11",
        },
        payload: {
          provider: "google",
          sessionToken: `oauth-session-token-link-rate-${attempt}`,
          state: `oauth_state_rate_limit_link_${attempt}_12345`,
          nonce: `oauth_nonce_rate_limit_link_${attempt}_12345`,
        },
      });

      expect(response.statusCode).toBe(200);
    }

    const limitedResponse = await app.inject({
      method: "POST",
      url: "/api/users/me/auth-providers/link",
      headers: {
        authorization: "Bearer access-token",
        "x-forwarded-for": "203.0.113.11",
      },
      payload: {
        provider: "google",
        sessionToken: "oauth-session-token-link-rate-final",
        state: "oauth_state_rate_limit_link_final_12345",
        nonce: "oauth_nonce_rate_limit_link_final_12345",
      },
    });

    expect(limitedResponse.statusCode).toBe(429);
    expect(limitedResponse.json()).toEqual({
      message: "Too many OAuth attempts, please retry later",
    });

    await app.close();
  });

  it("supports mixed auth flow: Clerk password session exchange then social link", async () => {
    listIdentitiesByUserIdMock.mockResolvedValueOnce([
      {
        id: "identity-google-1",
        userId: "01a4c5ea-7d51-4dc5-9ae2-7726a983eb30",
        provider: "google",
        providerUserId: "google-user-1",
        email: "user@example.com",
        createdAt: new Date("2026-04-18T12:00:00.000Z"),
      },
    ]);

    const app = await buildApp();

    const exchangeResponse = await app.inject({
      method: "POST",
      url: "/api/auth/session/exchange",
      payload: {
        provider: "password",
        sessionToken: "clerk-session-token-mixed-password",
      },
    });

    expect(exchangeResponse.statusCode).toBe(200);

    const linkResponse = await app.inject({
      method: "POST",
      url: "/api/users/me/auth-providers/link",
      headers: {
        authorization: `Bearer ${exchangeResponse.json().accessToken}`,
      },
      payload: {
        provider: "google",
        sessionToken: "oauth-session-token-mixed-password",
        state: "oauth_state_mixed_password_12345",
        nonce: "oauth_nonce_mixed_password_12345",
      },
    });

    expect(linkResponse.statusCode).toBe(200);
    expect(linkResponse.json()).toEqual({
      userId: "01a4c5ea-7d51-4dc5-9ae2-7726a983eb30",
      linkedProviders: ["password", "google"],
    });

    await app.close();
  });

  it("supports mixed auth flow: Clerk social session exchange then link another social provider", async () => {
    verifyClerkSessionTokenMock
      .mockResolvedValueOnce({
        providerUserId: "google-user-1",
        email: "user@example.com",
        emailVerified: true,
        firstName: "User",
        lastName: "Example",
        fullName: "User Example",
      })
      .mockResolvedValueOnce({
        providerUserId: "facebook-user-1",
        email: "user@example.com",
        emailVerified: true,
        firstName: "User",
        lastName: "Example",
        fullName: "User Example",
      });
    listIdentitiesByUserIdMock.mockResolvedValueOnce([
      {
        id: "identity-google-1",
        userId: "01a4c5ea-7d51-4dc5-9ae2-7726a983eb30",
        provider: "google",
        providerUserId: "google-user-1",
        email: "user@example.com",
        createdAt: new Date("2026-04-18T12:00:00.000Z"),
      },
      {
        id: "identity-facebook-1",
        userId: "01a4c5ea-7d51-4dc5-9ae2-7726a983eb30",
        provider: "facebook",
        providerUserId: "facebook-user-1",
        email: "user@example.com",
        createdAt: new Date("2026-04-18T12:00:00.000Z"),
      },
    ]);

    const app = await buildApp();

    const exchangeResponse = await app.inject({
      method: "POST",
      url: "/api/auth/session/exchange",
      payload: {
        provider: "google",
        sessionToken: "oauth-session-token-mixed-google",
      },
    });

    expect(exchangeResponse.statusCode).toBe(200);

    const linkResponse = await app.inject({
      method: "POST",
      url: "/api/users/me/auth-providers/link",
      headers: {
        authorization: `Bearer ${exchangeResponse.json().accessToken}`,
      },
      payload: {
        provider: "facebook",
        sessionToken: "oauth-session-token-mixed-facebook",
        state: "oauth_state_mixed_social_link_12345",
        nonce: "oauth_nonce_mixed_social_link_12345",
      },
    });

    expect(linkResponse.statusCode).toBe(200);
    expect(linkResponse.json()).toEqual({
      userId: "01a4c5ea-7d51-4dc5-9ae2-7726a983eb30",
      linkedProviders: ["password", "google", "facebook"],
    });

    await app.close();
  });

  it("returns 409 when unlinking last social auth provider", async () => {
    listIdentitiesByUserIdMock.mockResolvedValueOnce([
      {
        id: "identity-google-1",
        userId: "01a4c5ea-7d51-4dc5-9ae2-7726a983eb30",
        provider: "google",
        providerUserId: "google-user-1",
        email: "user@example.com",
        createdAt: new Date("2026-04-18T12:00:00.000Z"),
      },
    ]);
    const app = await buildApp();

    const response = await app.inject({
      method: "DELETE",
      url: "/api/users/me/auth-providers/google",
      headers: {
        authorization: "Bearer access-token",
      },
    });

    expect(response.statusCode).toBe(409);
    expect(response.json()).toEqual({
      message: "Cannot unlink the last authentication provider",
    });

    await app.close();
  });

  it("unlinks oauth provider for authenticated user", async () => {
    listIdentitiesByUserIdMock
      .mockResolvedValueOnce([
        {
          id: "identity-google-1",
          userId: "01a4c5ea-7d51-4dc5-9ae2-7726a983eb30",
          provider: "google",
          providerUserId: "google-user-1",
          email: "user@example.com",
          createdAt: new Date("2026-04-18T12:00:00.000Z"),
        },
        {
          id: "identity-facebook-1",
          userId: "01a4c5ea-7d51-4dc5-9ae2-7726a983eb30",
          provider: "facebook",
          providerUserId: "facebook-user-1",
          email: "user@example.com",
          createdAt: new Date("2026-04-18T12:00:00.000Z"),
        },
      ])
      .mockResolvedValueOnce([
        {
          id: "identity-facebook-1",
          userId: "01a4c5ea-7d51-4dc5-9ae2-7726a983eb30",
          provider: "facebook",
          providerUserId: "facebook-user-1",
          email: "user@example.com",
          createdAt: new Date("2026-04-18T12:00:00.000Z"),
        },
      ]);

    const app = await buildApp();

    const response = await app.inject({
      method: "DELETE",
      url: "/api/users/me/auth-providers/google",
      headers: {
        authorization: "Bearer access-token",
      },
    });

    expect(response.statusCode).toBe(200);
    expect(unlinkIdentityMock).toHaveBeenCalledWith(
      "01a4c5ea-7d51-4dc5-9ae2-7726a983eb30",
      "google",
    );
    expect(response.json()).toEqual({
      userId: "01a4c5ea-7d51-4dc5-9ae2-7726a983eb30",
      linkedProviders: ["password", "facebook"],
    });

    await app.close();
  });

  it("updates authenticated profile", async () => {
    findByIdMock.mockResolvedValueOnce({
      id: "01a4c5ea-7d51-4dc5-9ae2-7726a983eb30",
      name: "Updated Name",
      email: "updated@example.com",
      passwordHash: "hashed-password",
      status: "active",
      createdAt: new Date("2026-04-18T12:00:00.000Z"),
      updatedAt: new Date("2026-04-18T13:00:00.000Z"),
      deletedAt: null,
    });

    const app = await buildApp();

    const response = await app.inject({
      method: "PATCH",
      url: "/api/users/me",
      headers: {
        authorization: "Bearer access-token",
      },
      payload: {
        email: "updated@example.com",
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().email).toBe("updated@example.com");
    expect(response.json().name).toBe("Updated Name");

    await app.close();
  });

  it("returns 400 for invalid profile update payload", async () => {
    const app = await buildApp();

    const response = await app.inject({
      method: "PATCH",
      url: "/api/users/me",
      headers: {
        authorization: "Bearer access-token",
      },
      payload: {},
    });

    expect(response.statusCode).toBe(400);

    await app.close();
  });

  it("soft deletes account and revokes all refresh tokens", async () => {
    const app = await buildApp();

    const response = await app.inject({
      method: "DELETE",
      url: "/api/users/me",
      headers: {
        authorization: "Bearer access-token",
      },
    });

    expect(response.statusCode).toBe(204);
    expect(refreshRevokeByUserIdMock).toHaveBeenCalledTimes(1);

    await app.close();
  });

  it("returns authenticated user notification preferences", async () => {
    const app = await buildApp();

    const response = await app.inject({
      method: "GET",
      url: "/api/users/me/preferences",
      headers: {
        authorization: "Bearer access-token",
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      userId: "01a4c5ea-7d51-4dc5-9ae2-7726a983eb30",
      mode: "instant",
      createdAt: "2026-04-18T12:00:00.000Z",
      updatedAt: "2026-04-18T12:00:00.000Z",
    });

    await app.close();
  });

  it("updates authenticated user notification preferences", async () => {
    const app = await buildApp();

    const response = await app.inject({
      method: "PATCH",
      url: "/api/users/me/preferences",
      headers: {
        authorization: "Bearer access-token",
      },
      payload: {
        mode: "digest",
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().mode).toBe("digest");

    await app.close();
  });

  it("returns 400 for invalid notification preferences payload", async () => {
    const app = await buildApp();

    const response = await app.inject({
      method: "PATCH",
      url: "/api/users/me/preferences",
      headers: {
        authorization: "Bearer access-token",
      },
      payload: {
        mode: "hourly",
      },
    });

    expect(response.statusCode).toBe(400);

    await app.close();
  });

  it("saves a property for authenticated user", async () => {
    const app = await buildApp();

    const response = await app.inject({
      method: "POST",
      url: "/api/saved-properties",
      headers: {
        authorization: "Bearer access-token",
      },
      payload: {
        propertyId: "6bf9032e-d7fb-405a-9df8-7281d5f6f3e6",
      },
    });

    expect(response.statusCode).toBe(201);
    expect(response.json().propertyId).toBe("6bf9032e-d7fb-405a-9df8-7281d5f6f3e6");
    expect(response.json().property.title).toBe("Modern apartment in Douglas");

    await app.close();
  });

  it("lists saved properties for authenticated user", async () => {
    const app = await buildApp();

    const response = await app.inject({
      method: "GET",
      url: "/api/saved-properties?limit=20&offset=0&sortBy=savedAt&sortOrder=desc",
      headers: {
        authorization: "Bearer access-token",
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().items).toHaveLength(1);
    expect(response.json().items[0].property.id).toBe("6bf9032e-d7fb-405a-9df8-7281d5f6f3e6");

    await app.close();
  });

  it("removes saved property for authenticated user", async () => {
    const app = await buildApp();

    const response = await app.inject({
      method: "DELETE",
      url: "/api/saved-properties/6bf9032e-d7fb-405a-9df8-7281d5f6f3e6",
      headers: {
        authorization: "Bearer access-token",
      },
    });

    expect(response.statusCode).toBe(204);
    expect(removeSavedByUserAndPropertyMock).toHaveBeenCalledWith(
      "01a4c5ea-7d51-4dc5-9ae2-7726a983eb30",
      "6bf9032e-d7fb-405a-9df8-7281d5f6f3e6",
    );

    await app.close();
  });

  it("returns 404 when saving unknown property", async () => {
    propertyExistsMock.mockResolvedValueOnce(false);
    const app = await buildApp();

    const response = await app.inject({
      method: "POST",
      url: "/api/saved-properties",
      headers: {
        authorization: "Bearer access-token",
      },
      payload: {
        propertyId: "6bf9032e-d7fb-405a-9df8-7281d5f6f3e6",
      },
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual({ message: "Property not found" });

    await app.close();
  });

  it("creates a filter", async () => {
    const app = await buildApp();

    const response = await app.inject({
      method: "POST",
      url: "/api/filters",
      headers: {
        authorization: "Bearer access-token",
      },
      payload: {
        priceMin: 100000,
        priceMax: 300000,
        bedroomsMin: 2,
        bedroomsMax: 4,
        location: "Douglas",
        propertyType: "house",
        keywords: ["garden", "parking"],
      },
    });

    expect(response.statusCode).toBe(201);
    expect(response.json().id).toBe("ceffb7eb-cded-4a75-8a5e-53f7f3f577f7");

    await app.close();
  });

  it("lists user filters", async () => {
    const app = await buildApp();

    const response = await app.inject({
      method: "GET",
      url: "/api/filters",
      headers: {
        authorization: "Bearer access-token",
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().items).toHaveLength(1);

    await app.close();
  });

  it("updates an existing filter", async () => {
    const app = await buildApp();

    const response = await app.inject({
      method: "PATCH",
      url: "/api/filters/ceffb7eb-cded-4a75-8a5e-53f7f3f577f7",
      headers: {
        authorization: "Bearer access-token",
      },
      payload: {
        priceMax: 350000,
      },
    });

    expect(response.statusCode).toBe(200);

    await app.close();
  });

  it("deletes an existing filter", async () => {
    const app = await buildApp();

    const response = await app.inject({
      method: "DELETE",
      url: "/api/filters/ceffb7eb-cded-4a75-8a5e-53f7f3f577f7",
      headers: {
        authorization: "Bearer access-token",
      },
    });

    expect(response.statusCode).toBe(204);

    await app.close();
  });

  it("returns 400 for invalid filter range", async () => {
    const app = await buildApp();

    const response = await app.inject({
      method: "POST",
      url: "/api/filters",
      headers: {
        authorization: "Bearer access-token",
      },
      payload: {
        priceMin: 400000,
        priceMax: 100000,
      },
    });

    expect(response.statusCode).toBe(400);

    await app.close();
  });

  it("returns 404 when filter does not belong to user", async () => {
    updateFilterByIdMock.mockResolvedValueOnce(null);

    const app = await buildApp();

    const response = await app.inject({
      method: "PATCH",
      url: "/api/filters/ceffb7eb-cded-4a75-8a5e-53f7f3f577f7",
      headers: {
        authorization: "Bearer access-token",
      },
      payload: {
        location: "Onchan",
      },
    });

    expect(response.statusCode).toBe(404);

    await app.close();
  });

  it("lists authenticated user matches", async () => {
    const app = await buildApp();

    const response = await app.inject({
      method: "GET",
      url: "/api/matches/me",
      headers: {
        authorization: "Bearer access-token",
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().items).toHaveLength(1);
    expect(response.json().items[0].matchReasons).toEqual(["price_range", "location"]);

    await app.close();
  });

  it("returns sync diagnostic status", async () => {
    const app = await buildApp();

    const response = await app.inject({
      method: "GET",
      url: "/api/sync/status",
      headers: {
        authorization: "Bearer access-token",
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().states).toHaveLength(1);
    expect(response.json().states[0].key).toBe("scraper:listings:all");

    await app.close();
  });

  it("returns notifications delivery diagnostics", async () => {
    const app = await buildApp();

    const response = await app.inject({
      method: "GET",
      url: "/api/notifications/status",
      headers: {
        authorization: "Bearer access-token",
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().metrics).toEqual({
      pendingCount: 2,
      sentCount: 5,
      failedCount: 1,
    });
    expect(response.json().failed).toHaveLength(1);
    expect(response.json().failed[0].attemptCount).toBe(3);
    expect(response.json().failed[0].failureReason).toBe("SendGrid timeout");

    await app.close();
  });
});
