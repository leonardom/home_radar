import { describe, expect, it, vi } from "vitest";

import {
  AuthIdentityService,
  ProviderIdentityConflictError,
} from "../src/modules/auth/auth-identity.service";

describe("AuthIdentityService", () => {
  it("resolves user from existing provider identity", async () => {
    const findByProviderIdentity = vi.fn().mockResolvedValue({
      id: "identity-1",
      userId: "user-1",
      provider: "google",
      providerUserId: "google-user-1",
      email: "user@example.com",
      createdAt: new Date("2026-04-19T12:00:00.000Z"),
    });
    const findById = vi.fn().mockResolvedValue({
      id: "user-1",
      name: "User One",
      email: "user@example.com",
      passwordHash: "hash",
      status: "active",
      createdAt: new Date("2026-04-19T11:00:00.000Z"),
      updatedAt: new Date("2026-04-19T11:00:00.000Z"),
      deletedAt: null,
    });

    const service = new AuthIdentityService(
      { findById } as never,
      { findByProviderIdentity } as never,
    );

    const result = await service.resolveUserByProviderOrVerifiedEmail({
      provider: "google",
      providerUserId: "google-user-1",
      email: "other@example.com",
      emailVerified: true,
    });

    expect(result?.resolution).toBe("provider_identity");
    expect(findById).toHaveBeenCalledWith("user-1");
  });

  it("links provider identity to existing verified email user", async () => {
    const findByProviderIdentity = vi.fn().mockResolvedValue(null);
    const findByEmail = vi.fn().mockResolvedValue({
      id: "user-2",
      name: "User Two",
      email: "user2@example.com",
      passwordHash: "hash",
      status: "active",
      createdAt: new Date("2026-04-19T11:00:00.000Z"),
      updatedAt: new Date("2026-04-19T11:00:00.000Z"),
      deletedAt: null,
    });
    const linkIdentity = vi.fn().mockResolvedValue({
      id: "identity-2",
      userId: "user-2",
      provider: "facebook",
      providerUserId: "fb-user-2",
      email: "user2@example.com",
      createdAt: new Date("2026-04-19T12:00:00.000Z"),
    });

    const service = new AuthIdentityService(
      { findByEmail } as never,
      { findByProviderIdentity, linkIdentity } as never,
    );

    const result = await service.resolveUserByProviderOrVerifiedEmail({
      provider: "facebook",
      providerUserId: "fb-user-2",
      email: "USER2@example.com",
      emailVerified: true,
    });

    expect(result?.resolution).toBe("verified_email_link");
    expect(linkIdentity).toHaveBeenCalledWith({
      userId: "user-2",
      provider: "facebook",
      providerUserId: "fb-user-2",
      email: "user2@example.com",
    });
  });

  it("returns null when email is not verified and no identity is linked", async () => {
    const findByProviderIdentity = vi.fn().mockResolvedValue(null);
    const findByEmail = vi.fn();

    const service = new AuthIdentityService(
      { findByEmail } as never,
      { findByProviderIdentity } as never,
    );

    const result = await service.resolveUserByProviderOrVerifiedEmail({
      provider: "google",
      providerUserId: "google-user-3",
      email: "user3@example.com",
      emailVerified: false,
    });

    expect(result).toBeNull();
    expect(findByEmail).not.toHaveBeenCalled();
  });

  it("throws conflict when identity is linked to another user", async () => {
    const findByProviderIdentity = vi.fn().mockResolvedValue(null);
    const findByEmail = vi.fn().mockResolvedValue({
      id: "user-4",
      name: "User Four",
      email: "user4@example.com",
      passwordHash: "hash",
      status: "active",
      createdAt: new Date("2026-04-19T11:00:00.000Z"),
      updatedAt: new Date("2026-04-19T11:00:00.000Z"),
      deletedAt: null,
    });
    const linkIdentity = vi.fn().mockResolvedValue({
      id: "identity-4",
      userId: "other-user",
      provider: "google",
      providerUserId: "google-user-4",
      email: "user4@example.com",
      createdAt: new Date("2026-04-19T12:00:00.000Z"),
    });

    const service = new AuthIdentityService(
      { findByEmail } as never,
      { findByProviderIdentity, linkIdentity } as never,
    );

    await expect(
      service.resolveUserByProviderOrVerifiedEmail({
        provider: "google",
        providerUserId: "google-user-4",
        email: "user4@example.com",
        emailVerified: true,
      }),
    ).rejects.toBeInstanceOf(ProviderIdentityConflictError);
  });
});
