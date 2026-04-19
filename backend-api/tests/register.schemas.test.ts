import { describe, expect, it } from "vitest";

import { RegisterRequestSchema } from "../src/modules/auth/register.schemas";

describe("RegisterRequestSchema", () => {
  it("accepts valid payload", () => {
    const parsed = RegisterRequestSchema.parse({
      name: "John Doe",
      email: "USER@Example.COM",
      password: "StrongPass123",
    });

    expect(parsed.email).toBe("user@example.com");
    expect(parsed.name).toBe("John Doe");
  });

  it("rejects invalid email", () => {
    expect(() =>
      RegisterRequestSchema.parse({
        name: "John Doe",
        email: "invalid-email",
        password: "StrongPass123",
      }),
    ).toThrow();
  });

  it("rejects weak password", () => {
    expect(() =>
      RegisterRequestSchema.parse({
        name: "John Doe",
        email: "user@example.com",
        password: "weakpass",
      }),
    ).toThrow();
  });
});
