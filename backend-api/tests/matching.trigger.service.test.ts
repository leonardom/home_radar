import { beforeEach, describe, expect, it, vi } from "vitest";

import type { SearchFilter } from "../src/modules/filters/filters.types";
import { MatchingService } from "../src/modules/matching/matching.service";
import type { MatchingTriggerEvent } from "../src/modules/matching/matching.trigger.events";
import { MatchingTriggerService } from "../src/modules/matching/matching.trigger.service";
import type { PropertyCandidate } from "../src/modules/matching/matching.types";

const createProperty = (overrides: Partial<PropertyCandidate> = {}): PropertyCandidate => ({
  id: "property-1",
  price: 250000,
  bedrooms: 3,
  location: "Douglas",
  description: "House with parking and garden",
  propertyType: "house",
  ...overrides,
});

const createFilter = (overrides: Partial<SearchFilter> = {}): SearchFilter => ({
  id: "filter-1",
  userId: "user-1",
  priceMin: 100000,
  priceMax: 300000,
  bedroomsMin: 2,
  bedroomsMax: null,
  bathroomsMin: null,
  bathroomsMax: null,
  location: "doug",
  propertyType: "house",
  keywords: ["garden"],
  createdAt: new Date("2026-04-18T00:00:00.000Z"),
  updatedAt: new Date("2026-04-18T00:00:00.000Z"),
  ...overrides,
});

describe("MatchingTriggerService", () => {
  const hasProcessed = vi.fn();
  const markProcessed = vi.fn();
  const findCandidateFiltersForProperty = vi.fn();
  const findFilterByIdForUser = vi.fn();
  const findPropertyById = vi.fn();
  const findCandidatePropertiesForFilter = vi.fn();
  const consume = vi.fn();
  const logger = {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  };

  const matchingService = new MatchingService();

  const service = new MatchingTriggerService(
    matchingService,
    { findCandidateFiltersForProperty, findFilterByIdForUser },
    { findPropertyById, findCandidatePropertiesForFilter },
    { hasProcessed, markProcessed },
    { consume },
    logger,
  );

  beforeEach(() => {
    hasProcessed.mockReset();
    markProcessed.mockReset();
    findCandidateFiltersForProperty.mockReset();
    findFilterByIdForUser.mockReset();
    findPropertyById.mockReset();
    findCandidatePropertiesForFilter.mockReset();
    consume.mockReset();
    logger.info.mockReset();
    logger.warn.mockReset();
    logger.error.mockReset();

    hasProcessed.mockResolvedValue(false);
    markProcessed.mockResolvedValue(undefined);
    consume.mockResolvedValue(undefined);
  });

  it("handles property.created event and consumes matches", async () => {
    const property = createProperty();
    const filter = createFilter();

    findPropertyById.mockResolvedValue(property);
    findCandidateFiltersForProperty.mockResolvedValue([filter]);

    await service.handleEvent({
      id: "evt-property-created",
      type: "property.created",
      occurredAt: new Date("2026-04-18T12:00:00.000Z"),
      payload: { propertyId: property.id },
    });

    expect(findPropertyById).toHaveBeenCalledWith(property.id);
    expect(findCandidateFiltersForProperty).toHaveBeenCalledWith(property);
    expect(consume).toHaveBeenCalledTimes(1);
    expect(markProcessed).toHaveBeenCalledWith("evt-property-created");
  });

  it("handles property.updated event and consumes matches", async () => {
    const property = createProperty();
    const filter = createFilter();

    findPropertyById.mockResolvedValue(property);
    findCandidateFiltersForProperty.mockResolvedValue([filter]);

    await service.handleEvent({
      id: "evt-property-updated",
      type: "property.updated",
      occurredAt: new Date("2026-04-18T12:00:00.000Z"),
      payload: { propertyId: property.id },
    });

    expect(consume).toHaveBeenCalledTimes(1);
    expect(markProcessed).toHaveBeenCalledWith("evt-property-updated");
  });

  it("handles filter.created event and consumes matches", async () => {
    const property = createProperty();
    const filter = createFilter();

    findFilterByIdForUser.mockResolvedValue(filter);
    findCandidatePropertiesForFilter.mockResolvedValue([property]);

    await service.handleEvent({
      id: "evt-filter-created",
      type: "filter.created",
      occurredAt: new Date("2026-04-18T12:00:00.000Z"),
      payload: { filterId: filter.id, userId: filter.userId },
    });

    expect(findFilterByIdForUser).toHaveBeenCalledWith(filter.id, filter.userId);
    expect(findCandidatePropertiesForFilter).toHaveBeenCalledWith(filter);
    expect(consume).toHaveBeenCalledTimes(1);
    expect(markProcessed).toHaveBeenCalledWith("evt-filter-created");
  });

  it("skips already processed events", async () => {
    hasProcessed.mockResolvedValue(true);

    const event: MatchingTriggerEvent = {
      id: "evt-processed",
      type: "property.created",
      occurredAt: new Date(),
      payload: { propertyId: "property-1" },
    };

    await service.handleEvent(event);

    expect(consume).not.toHaveBeenCalled();
    expect(markProcessed).not.toHaveBeenCalled();
  });

  it("retries and succeeds after transient failure", async () => {
    const property = createProperty();
    const filter = createFilter();

    findPropertyById.mockResolvedValue(property);
    findCandidateFiltersForProperty.mockResolvedValue([filter]);
    consume.mockRejectedValueOnce(new Error("temporary failure")).mockResolvedValueOnce(undefined);

    await service.handleEvent({
      id: "evt-retry",
      type: "property.created",
      occurredAt: new Date("2026-04-18T12:00:00.000Z"),
      payload: { propertyId: property.id },
    });

    expect(consume).toHaveBeenCalledTimes(2);
    expect(markProcessed).toHaveBeenCalledWith("evt-retry");
  });

  it("dispatches filter.created through dispatcher method", async () => {
    const property = createProperty();
    const filter = createFilter();

    findFilterByIdForUser.mockResolvedValue(filter);
    findCandidatePropertiesForFilter.mockResolvedValue([property]);

    await service.dispatchFilterCreated({
      filterId: filter.id,
      userId: filter.userId,
    });

    expect(findFilterByIdForUser).toHaveBeenCalledWith(filter.id, filter.userId);
    expect(consume).toHaveBeenCalledTimes(1);
  });

  it("dispatches property.created and property.updated through dispatcher methods", async () => {
    const property = createProperty();
    const filter = createFilter();

    findPropertyById.mockResolvedValue(property);
    findCandidateFiltersForProperty.mockResolvedValue([filter]);

    await service.dispatchPropertyCreated({ propertyId: property.id });
    await service.dispatchPropertyUpdated({ propertyId: property.id });

    expect(findPropertyById).toHaveBeenCalledTimes(2);
    expect(consume).toHaveBeenCalledTimes(2);
  });
});
