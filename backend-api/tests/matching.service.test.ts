import { describe, expect, it } from "vitest";

import type { SearchFilter } from "../src/modules/filters/filters.types";
import { MatchingService } from "../src/modules/matching/matching.service";
import type { PropertyCandidate } from "../src/modules/matching/matching.types";

const createFilter = (overrides: Partial<SearchFilter> = {}): SearchFilter => {
  return {
    id: "filter-1",
    userId: "user-1",
    priceMin: null,
    priceMax: null,
    bedroomsMin: null,
    bedroomsMax: null,
    bathroomsMin: null,
    bathroomsMax: null,
    location: null,
    propertyType: null,
    keywords: [],
    createdAt: new Date("2026-04-18T00:00:00.000Z"),
    updatedAt: new Date("2026-04-18T00:00:00.000Z"),
    ...overrides,
  };
};

const createProperty = (overrides: Partial<PropertyCandidate> = {}): PropertyCandidate => {
  return {
    id: "property-1",
    price: 250000,
    bedrooms: 3,
    location: "Douglas",
    description: "Family home with garden and parking",
    propertyType: "house",
    ...overrides,
  };
};

describe("MatchingService", () => {
  it("matches by price range", () => {
    const service = new MatchingService();
    const filter = createFilter({ priceMin: 200000, priceMax: 300000 });

    expect(service.isPropertyMatch(createProperty(), filter)).toBe(true);
    expect(service.isPropertyMatch(createProperty({ price: 350000 }), filter)).toBe(false);
  });

  it("matches by minimum bedrooms", () => {
    const service = new MatchingService();
    const filter = createFilter({ bedroomsMin: 3 });

    expect(service.isPropertyMatch(createProperty({ bedrooms: 3 }), filter)).toBe(true);
    expect(service.isPropertyMatch(createProperty({ bedrooms: 2 }), filter)).toBe(false);
  });

  it("matches by normalized location contains", () => {
    const service = new MatchingService();
    const filter = createFilter({ location: "doug" });

    expect(service.isPropertyMatch(createProperty({ location: " Douglas " }), filter)).toBe(true);
    expect(service.isPropertyMatch(createProperty({ location: "Peel" }), filter)).toBe(false);
  });

  it("uses keywords as optional matcher", () => {
    const service = new MatchingService();
    const withKeywords = createFilter({ keywords: ["parking"] });
    const withoutKeywords = createFilter({ keywords: [] });

    expect(service.isPropertyMatch(createProperty(), withKeywords)).toBe(true);
    expect(
      service.isPropertyMatch(createProperty({ description: "Sea view apartment" }), withKeywords),
    ).toBe(false);
    expect(
      service.isPropertyMatch(
        createProperty({ description: "Sea view apartment" }),
        withoutKeywords,
      ),
    ).toBe(true);
  });

  it("returns standardized match payload", () => {
    const service = new MatchingService();
    const now = new Date("2026-04-18T12:00:00.000Z");
    const filter = createFilter({
      id: "filter-77",
      userId: "user-77",
      priceMin: 100000,
      bedroomsMin: 2,
      location: "douglas",
      propertyType: "house",
      keywords: ["garden"],
    });

    const match = service.matchPropertyAgainstFilter(createProperty(), filter, now);

    expect(match).toEqual({
      propertyId: "property-1",
      filterId: "filter-77",
      userId: "user-77",
      matchReason: ["price_range", "minimum_bedrooms", "location", "keywords", "property_type"],
      matchedAt: now,
    });
  });

  it("matches one property against multiple filters", () => {
    const service = new MatchingService();
    const property = createProperty();

    const filters = [
      createFilter({ id: "f-1", priceMin: 100000, priceMax: 300000 }),
      createFilter({ id: "f-2", location: "peel" }),
      createFilter({ id: "f-3", bedroomsMin: 3 }),
    ];

    const matches = service.matchPropertyAgainstFilters(property, filters);

    expect(matches.map((match) => match.filterId)).toEqual(["f-1", "f-3"]);
  });
});
