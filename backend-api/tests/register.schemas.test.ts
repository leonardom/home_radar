import { describe, expect, it } from "vitest";

import { RegisterRequestSchema } from "../src/modules/auth/register.schemas";

describe("RegisterRequestSchema", () => {
  it("accepts valid payload", () => {
    const parsed = RegisterRequestSchema.parse({
      email: "USER@Example.COM",
      password: "StrongPass123",
    });

    expect(parsed.email).toBe("user@example.com");
  });

  it("rejects invalid email", () => {
    expect(() =>
      RegisterRequestSchema.parse({
        email: "invalid-email",
        password: "StrongPass123",
      }),
    ).toThrow();
  });

  it("rejects weak password", () => {
    expect(() =>
      RegisterRequestSchema.parse({
        email: "user@example.com",
        password: "weakpass",
      }),
    ).toThrow();
  });
});
