import { beforeEach, describe, expect, it, vi } from "vitest";

import { PropertiesSyncService } from "../src/modules/properties/properties.sync.service";

describe("PropertiesSyncService", () => {
  const fetchIncremental = vi.fn();
  const fetchAllBySource = vi.fn();
  const findBySourceIdentity = vi.fn();
  const upsertProperty = vi.fn();
  const markInactiveMissingForSource = vi.fn();
  const getLastSyncAt = vi.fn();
  const setLastSyncAt = vi.fn();
  const dispatchPropertyCreated = vi.fn();
  const dispatchPropertyUpdated = vi.fn();

  const service = new PropertiesSyncService(
    { fetchIncremental, fetchAllBySource } as never,
    { findBySourceIdentity, upsertProperty, markInactiveMissingForSource } as never,
    { getLastSyncAt, setLastSyncAt } as never,
    {
      dispatchPropertyCreated,
      dispatchPropertyUpdated,
      dispatchFilterCreated: vi.fn(),
    },
  );

  beforeEach(() => {
    fetchIncremental.mockReset();
    fetchAllBySource.mockReset();
    findBySourceIdentity.mockReset();
    upsertProperty.mockReset();
    markInactiveMissingForSource.mockReset();
    getLastSyncAt.mockReset();
    setLastSyncAt.mockReset();
    dispatchPropertyCreated.mockReset();
    dispatchPropertyUpdated.mockReset();

    markInactiveMissingForSource.mockResolvedValue(0);
    setLastSyncAt.mockResolvedValue(undefined);
  });

  it("runs incremental sync with watermark and emits created/updated events", async () => {
    getLastSyncAt.mockResolvedValue(new Date("2026-04-18T11:00:00.000Z"));
    fetchIncremental.mockResolvedValue([
      {
        id: 1,
        source: "chrystals",
        listing_url: "https://example.com/1",
        title: "A",
        updated_at: "2026-04-18T12:00:00.000Z",
      },
      {
        id: 2,
        source: "chrystals",
        listing_url: "https://example.com/2",
        title: "B",
        updated_at: "2026-04-18T12:05:00.000Z",
      },
    ]);

    findBySourceIdentity
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: "existing-property" });
    upsertProperty
      .mockResolvedValueOnce({ id: "created-property" })
      .mockResolvedValueOnce({ id: "updated-property" });

    const result = await service.runIncremental("chrystals");

    expect(fetchIncremental).toHaveBeenCalledWith({
      after: new Date("2026-04-18T11:00:00.000Z"),
      source: "chrystals",
    });
    expect(dispatchPropertyCreated).toHaveBeenCalledWith({ propertyId: "created-property" });
    expect(dispatchPropertyUpdated).toHaveBeenCalledWith({ propertyId: "updated-property" });
    expect(setLastSyncAt).toHaveBeenCalledWith(
      "scraper:listings:chrystals",
      new Date("2026-04-18T12:05:00.000Z"),
    );
    expect(result.fetched).toBe(2);
    expect(result.created).toBe(1);
    expect(result.updated).toBe(1);
    expect(result.deactivated).toBe(0);
  });

  it("runs backfill and deactivates missing properties by source", async () => {
    fetchAllBySource.mockResolvedValue([
      {
        id: 1,
        source: "manxmove",
        listing_url: "https://example.com/a",
        title: "A",
        updated_at: "2026-04-18T12:00:00.000Z",
      },
      {
        id: 2,
        source: "manxmove",
        listing_url: "https://example.com/b",
        title: "B",
        updated_at: "2026-04-18T12:05:00.000Z",
      },
    ]);

    findBySourceIdentity.mockResolvedValue(null);
    upsertProperty.mockResolvedValue({ id: "new-property" });
    markInactiveMissingForSource.mockResolvedValue(3);

    const result = await service.runBackfill("manxmove");

    expect(fetchAllBySource).toHaveBeenCalledWith("manxmove");
    expect(markInactiveMissingForSource).toHaveBeenCalledWith("manxmove", [
      "https://example.com/a",
      "https://example.com/b",
    ]);
    expect(result.mode).toBe("backfill");
    expect(result.deactivated).toBe(3);
  });
});
