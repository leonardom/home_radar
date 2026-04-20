import { describe, expect, it } from "vitest";
import {
  authSignInFormSchema,
  authSignUpFormSchema,
} from "../features/auth/auth-form.schemas";
import {
  createFilterFormSchema,
  updateFilterFormSchema,
} from "../features/filters/filter-form.schemas";

describe("auth validation schemas", () => {
  it("accepts valid sign-up payload", () => {
    const parsed = authSignUpFormSchema.parse({
      name: "Jane Example",
      email: "Jane@Example.com",
      password: "Passw0rd",
    });

    expect(parsed.email).toBe("jane@example.com");
  });

  it("rejects invalid sign-up password", () => {
    expect(() =>
      authSignUpFormSchema.parse({
        name: "Jane Example",
        email: "jane@example.com",
        password: "password",
      }),
    ).toThrow();
  });

  it("accepts valid sign-in payload", () => {
    const parsed = authSignInFormSchema.parse({
      email: "User@Example.com",
      password: "x",
    });

    expect(parsed.email).toBe("user@example.com");
  });
});

describe("filter validation schemas", () => {
  it("accepts valid create payload", () => {
    const parsed = createFilterFormSchema.parse({
      priceMin: "100000",
      priceMax: "300000",
      bedroomsMin: "2",
      location: "Douglas",
      keywords: ["garden"],
    });

    expect(parsed.priceMin).toBe(100000);
    expect(parsed.location).toBe("Douglas");
  });

  it("rejects create payload with no criteria", () => {
    expect(() => createFilterFormSchema.parse({})).toThrow();
  });

  it("rejects create payload with invalid numeric range", () => {
    expect(() =>
      createFilterFormSchema.parse({
        priceMin: 300000,
        priceMax: 100000,
      }),
    ).toThrow();
  });

  it("rejects empty update payload", () => {
    expect(() => updateFilterFormSchema.parse({})).toThrow();
  });

  it("accepts valid update payload", () => {
    const parsed = updateFilterFormSchema.parse({ bathroomsMin: "1" });

    expect(parsed.bathroomsMin).toBe(1);
  });
});
