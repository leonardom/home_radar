import { beforeEach, describe, expect, it, vi } from "vitest";
import { DuplicateEmailError } from "../src/modules/users/users.errors";

const { checkDatabaseMock, createUserMock, hashPasswordMock } = vi.hoisted(() => {
  return {
    checkDatabaseMock: vi.fn<() => Promise<void>>(),
    createUserMock: vi.fn<() => Promise<unknown>>(),
    hashPasswordMock: vi.fn<() => Promise<string>>(),
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
  }

  return { UsersRepository };
});

vi.mock("../src/modules/auth/password.service", () => {
  class PasswordService {
    hashPassword = hashPasswordMock;
  }

  return { PasswordService };
});

import { buildApp } from "../src/app";

describe("API routes", () => {
  beforeEach(() => {
    checkDatabaseMock.mockReset();
    createUserMock.mockReset();
    hashPasswordMock.mockReset();

    checkDatabaseMock.mockResolvedValue(undefined);
    hashPasswordMock.mockResolvedValue("hashed-password");
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
});
