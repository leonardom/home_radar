import { describe, expect, it, vi } from "vitest";

import { DuplicateEmailError, ProfileNotFoundError } from "../src/modules/users/users.errors";
import { UsersService } from "../src/modules/users/users.service";

describe("UsersService", () => {
  it("updates profile through repository", async () => {
    const usersRepository = {
      findById: vi.fn(),
      updateProfile: vi.fn().mockResolvedValue({
        id: "01a4c5ea-7d51-4dc5-9ae2-7726a983eb30",
        name: "Updated Name",
        email: "updated@example.com",
        passwordHash: "hash",
        status: "active",
        createdAt: new Date("2026-04-18T12:00:00.000Z"),
        updatedAt: new Date("2026-04-18T13:00:00.000Z"),
        deletedAt: null,
      }),
      softDeleteById: vi.fn(),
    };
    const refreshTokensRepository = {
      revokeByUserId: vi.fn().mockResolvedValue(undefined),
    };

    const service = new UsersService(usersRepository as never, refreshTokensRepository as never);

    const result = await service.updateProfile("01a4c5ea-7d51-4dc5-9ae2-7726a983eb30", {
      email: "updated@example.com",
    });

    expect(usersRepository.updateProfile).toHaveBeenCalledWith(
      "01a4c5ea-7d51-4dc5-9ae2-7726a983eb30",
      {
        email: "updated@example.com",
      },
    );
    expect(result.email).toBe("updated@example.com");
    expect(result.name).toBe("Updated Name");
  });

  it("throws profile not found when updating unknown profile", async () => {
    const usersRepository = {
      findById: vi.fn(),
      updateProfile: vi.fn().mockResolvedValue(null),
      softDeleteById: vi.fn(),
    };
    const refreshTokensRepository = {
      revokeByUserId: vi.fn().mockResolvedValue(undefined),
    };

    const service = new UsersService(usersRepository as never, refreshTokensRepository as never);

    await expect(
      service.updateProfile("01a4c5ea-7d51-4dc5-9ae2-7726a983eb30", {
        email: "updated@example.com",
      }),
    ).rejects.toBeInstanceOf(ProfileNotFoundError);
  });

  it("deletes profile and revokes user refresh tokens", async () => {
    const usersRepository = {
      findById: vi.fn(),
      updateProfile: vi.fn(),
      softDeleteById: vi.fn().mockResolvedValue(true),
    };
    const refreshTokensRepository = {
      revokeByUserId: vi.fn().mockResolvedValue(undefined),
    };

    const service = new UsersService(usersRepository as never, refreshTokensRepository as never);

    await service.deleteProfile("01a4c5ea-7d51-4dc5-9ae2-7726a983eb30");

    expect(usersRepository.softDeleteById).toHaveBeenCalledWith(
      "01a4c5ea-7d51-4dc5-9ae2-7726a983eb30",
    );
    expect(refreshTokensRepository.revokeByUserId).toHaveBeenCalledWith(
      "01a4c5ea-7d51-4dc5-9ae2-7726a983eb30",
    );
  });

  it("throws profile not found when deleting unknown profile", async () => {
    const usersRepository = {
      findById: vi.fn(),
      updateProfile: vi.fn(),
      softDeleteById: vi.fn().mockResolvedValue(false),
    };
    const refreshTokensRepository = {
      revokeByUserId: vi.fn().mockResolvedValue(undefined),
    };

    const service = new UsersService(usersRepository as never, refreshTokensRepository as never);

    await expect(
      service.deleteProfile("01a4c5ea-7d51-4dc5-9ae2-7726a983eb30"),
    ).rejects.toBeInstanceOf(ProfileNotFoundError);
  });

  it("propagates duplicate email error on update", async () => {
    const usersRepository = {
      findById: vi.fn(),
      updateProfile: vi.fn().mockRejectedValue(new DuplicateEmailError("updated@example.com")),
      softDeleteById: vi.fn(),
    };
    const refreshTokensRepository = {
      revokeByUserId: vi.fn().mockResolvedValue(undefined),
    };

    const service = new UsersService(usersRepository as never, refreshTokensRepository as never);

    await expect(
      service.updateProfile("01a4c5ea-7d51-4dc5-9ae2-7726a983eb30", {
        email: "updated@example.com",
      }),
    ).rejects.toBeInstanceOf(DuplicateEmailError);
  });
});
