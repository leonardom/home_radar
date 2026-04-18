import { describe, expect, it } from "vitest";

import {
  CreateFilterBodySchema,
  UpdateFilterBodySchema,
} from "../src/modules/filters/filters.schemas";

describe("filters schemas", () => {
  it("accepts valid create payload", () => {
    const parsed = CreateFilterBodySchema.parse({
      priceMin: 100000,
      priceMax: 300000,
      bedroomsMin: 2,
      bedroomsMax: 4,
      location: "Douglas",
      propertyType: "house",
      keywords: ["garden"],
    });

    expect(parsed.priceMin).toBe(100000);
    expect(parsed.propertyType).toBe("house");
  });

  it("rejects invalid create numeric range", () => {
    expect(() =>
      CreateFilterBodySchema.parse({
        priceMin: 300000,
        priceMax: 100000,
      }),
    ).toThrow();
  });

  it("rejects empty update payload", () => {
    expect(() => UpdateFilterBodySchema.parse({})).toThrow();
  });

  it("accepts valid update payload", () => {
    const parsed = UpdateFilterBodySchema.parse({
      bathroomsMin: 1,
      bathroomsMax: 2,
    });

    expect(parsed.bathroomsMax).toBe(2);
  });
});
