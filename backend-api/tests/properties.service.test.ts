import { beforeEach, describe, expect, it, vi } from "vitest";

import { PropertiesService } from "../src/modules/properties/properties.service";
import type { UpsertPropertyInput } from "../src/modules/properties/properties.types";

const makeInput = (overrides: Partial<UpsertPropertyInput> = {}): UpsertPropertyInput => ({
  source: "chrystals",
  externalListingId: "https://example.com/listings/1",
  title: "Townhouse",
  price: 350000,
  bedrooms: 3,
  bathrooms: 2,
  location: "Douglas",
  propertyType: "house",
  url: "https://example.com/listings/1",
  firstSeenAt: new Date("2026-04-18T10:00:00.000Z"),
  lastSeenAt: new Date("2026-04-18T10:00:00.000Z"),
  status: "active",
  ...overrides,
});

describe("PropertiesService", () => {
  const findBySourceIdentity = vi.fn();
  const upsertProperty = vi.fn();
  const dispatchPropertyCreated = vi.fn();
  const dispatchPropertyUpdated = vi.fn();

  const service = new PropertiesService({ findBySourceIdentity, upsertProperty } as never, {
    dispatchPropertyCreated,
    dispatchPropertyUpdated,
    dispatchFilterCreated: vi.fn(),
  });

  beforeEach(() => {
    findBySourceIdentity.mockReset();
    upsertProperty.mockReset();
    dispatchPropertyCreated.mockReset();
    dispatchPropertyUpdated.mockReset();
  });

  it("dispatches property.created on create flow when record is new", async () => {
    const input = makeInput();

    findBySourceIdentity.mockResolvedValue(null);
    upsertProperty.mockResolvedValue({ id: "property-new" });

    await service.createProperty(input);

    expect(dispatchPropertyCreated).toHaveBeenCalledWith({ propertyId: "property-new" });
    expect(dispatchPropertyUpdated).not.toHaveBeenCalled();
  });

  it("dispatches property.updated on update flow when record exists", async () => {
    const input = makeInput();

    findBySourceIdentity.mockResolvedValue({ id: "property-existing" });
    upsertProperty.mockResolvedValue({ id: "property-existing" });

    await service.updateProperty(input);

    expect(dispatchPropertyUpdated).toHaveBeenCalledWith({ propertyId: "property-existing" });
    expect(dispatchPropertyCreated).not.toHaveBeenCalled();
  });
});
