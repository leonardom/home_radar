import { describe, expect, it } from "vitest";

import { mapScraperListingToUpsertProperty } from "../src/modules/properties/properties.mapper";

describe("properties mapper", () => {
  it("maps scraper listing_url as external identity", () => {
    const mapped = mapScraperListingToUpsertProperty({
      id: 12,
      source: "chrystals",
      listing_url: "https://example.com/listing/abc",
      title: "Townhouse",
      region: "Douglas",
      price_value: 350000,
      beds: 3,
      baths: 2,
      property_type: "house",
      updated_at: "2026-04-18T12:00:00.000Z",
    });

    expect(mapped.externalListingId).toBe("https://example.com/listing/abc");
    expect(mapped.source).toBe("chrystals");
    expect(mapped.price).toBe(350000);
    expect(mapped.bedrooms).toBe(3);
    expect(mapped.bathrooms).toBe(2);
    expect(mapped.location).toBe("Douglas");
    expect(mapped.propertyType).toBe("house");
  });

  it("maps inactive status values", () => {
    const mapped = mapScraperListingToUpsertProperty({
      id: 10,
      source: "manxmove",
      listing_url: "https://example.com/listing/10",
      status: "removed",
      updated_at: "2026-04-18T12:00:00.000Z",
    });

    expect(mapped.status).toBe("inactive");
  });

  it("throws when source is missing", () => {
    expect(() =>
      mapScraperListingToUpsertProperty({
        id: 1,
        listing_url: "https://example.com/listing/1",
        updated_at: "2026-04-18T12:00:00.000Z",
      }),
    ).toThrow(/source is required/i);
  });
});
